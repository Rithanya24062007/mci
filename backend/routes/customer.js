const express = require('express');
const { query, transaction } = require('../config/database');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Get list of active staff members
router.get('/staff/list', async (req, res) => {
    try {
        const result = await query(
            `SELECT s.id, s.name, sq.current_serving_token, sq.last_issued_token,
                    (sq.last_issued_token - sq.current_serving_token) as waiting_count
             FROM staff s
             LEFT JOIN staff_queue sq ON sq.staff_id = s.id
             WHERE s.is_active = TRUE
             ORDER BY s.name`
        );

        res.json({
            success: true,
            staff: result.rows
        });

    } catch (error) {
        console.error('Get staff list error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff list' 
        });
    }
});

// Book a token
router.post('/token/book', [
    body('staff_id').isInt(),
    body('customer_name').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid input data' 
            });
        }

        const { staff_id, customer_name } = req.body;

        // Check if staff is active
        const staffCheck = await query(
            'SELECT is_active FROM staff WHERE id = $1',
            [staff_id]
        );

        if (staffCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Staff member not found' 
            });
        }

        if (!staffCheck.rows[0].is_active) {
            return res.status(400).json({ 
                success: false, 
                error: 'This staff member is not currently active' 
            });
        }

        // CRITICAL: Atomic token generation in transaction
        const result = await transaction(async (client) => {
            // Increment last_issued_token atomically
            const tokenResult = await client.query(
                `UPDATE staff_queue 
                 SET last_issued_token = last_issued_token + 1 
                 WHERE staff_id = $1 
                 RETURNING last_issued_token`,
                [staff_id]
            );

            const newTokenNumber = tokenResult.rows[0].last_issued_token;

            // Insert new token
            await client.query(
                `INSERT INTO tokens (staff_id, token_number, status, customer_name) 
                 VALUES ($1, $2, $3, $4)`,
                [staff_id, newTokenNumber, 'waiting', customer_name || null]
            );

            return {
                staff_id,
                token_number: newTokenNumber
            };
        });

        res.json({
            success: true,
            message: 'Token booked successfully',
            token: result
        });

    } catch (error) {
        console.error('Book token error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to book token' 
        });
    }
});

// Get current serving token for a staff member
router.get('/staff/:id/current-token', [
    param('id').isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid staff ID' 
            });
        }

        const { id } = req.params;

        const result = await query(
            'SELECT current_serving_token, last_issued_token FROM staff_queue WHERE staff_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Staff member not found' 
            });
        }

        res.json({
            success: true,
            current_serving_token: result.rows[0].current_serving_token,
            last_issued_token: result.rows[0].last_issued_token
        });

    } catch (error) {
        console.error('Get current token error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch current token' 
        });
    }
});

// Get queue status for a staff member (detailed info for customers)
router.get('/staff/:id/queue-status', [
    param('id').isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid staff ID' 
            });
        }

        const { id } = req.params;

        // Get staff and queue info
        const result = await query(
            `SELECT s.name, sq.current_serving_token, sq.last_issued_token,
                    (sq.last_issued_token - sq.current_serving_token) as waiting_count
             FROM staff s
             LEFT JOIN staff_queue sq ON sq.staff_id = s.id
             WHERE s.id = $1 AND s.is_active = TRUE`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Staff member not found or inactive' 
            });
        }

        res.json({
            success: true,
            staff: result.rows[0]
        });

    } catch (error) {
        console.error('Get queue status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch queue status' 
        });
    }
});

module.exports = router;
