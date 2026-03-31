const express = require('express');
const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('admin'));

// Create new staff member
router.post('/staff', [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid input data' 
            });
        }

        const { name, email, password } = req.body;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create staff and user in transaction
        const result = await transaction(async (client) => {
            // Create staff record
            const staffResult = await client.query(
                'INSERT INTO staff (name, is_active) VALUES ($1, TRUE) RETURNING id',
                [name]
            );
            const staffId = staffResult.rows[0].id;

            // Create user record
            await client.query(
                'INSERT INTO users (name, email, password_hash, role, staff_id) VALUES ($1, $2, $3, $4, $5)',
                [name, email, passwordHash, 'staff', staffId]
            );

            return staffId;
        });

        res.json({
            success: true,
            message: 'Staff member created successfully',
            staff_id: result
        });

    } catch (error) {
        console.error('Create staff error:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                success: false, 
                error: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create staff member' 
        });
    }
});

// Get all staff members
router.get('/staff', async (req, res) => {
    try {
        const result = await query(
            `SELECT s.id, s.name, s.is_active, s.live_tracking_enabled, s.created_at,
                    u.email,
                    sq.last_issued_token, sq.current_serving_token
             FROM staff s
             LEFT JOIN users u ON u.staff_id = s.id
             LEFT JOIN staff_queue sq ON sq.staff_id = s.id
             ORDER BY s.id`
        );

        res.json({
            success: true,
            staff: result.rows
        });

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch staff' 
        });
    }
});

// Update staff details
router.put('/staff/:id', [
    body('name').optional().notEmpty().trim(),
    body('is_active').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid input data' 
            });
        }

        const { id } = req.params;
        const { name, is_active } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No fields to update' 
            });
        }

        values.push(id);
        const result = await query(
            `UPDATE staff SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Staff member not found' 
            });
        }

        res.json({
            success: true,
            message: 'Staff updated successfully',
            staff: result.rows[0]
        });

    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update staff' 
        });
    }
});

// Toggle live tracking for staff
router.patch('/staff/:id/toggle-tracking', async (req, res) => {
    try {
        const { id } = req.params;

        // Transaction ensures only one staff has tracking enabled
        const result = await transaction(async (client) => {
            // Get current state
            const currentState = await client.query(
                'SELECT live_tracking_enabled FROM staff WHERE id = $1',
                [id]
            );

            if (currentState.rows.length === 0) {
                throw new Error('Staff not found');
            }

            const newState = !currentState.rows[0].live_tracking_enabled;

            // Update staff (trigger automatically handles disabling others)
            const updated = await client.query(
                'UPDATE staff SET live_tracking_enabled = $1 WHERE id = $2 RETURNING *',
                [newState, id]
            );

            return updated.rows[0];
        });

        res.json({
            success: true,
            message: `Live tracking ${result.live_tracking_enabled ? 'enabled' : 'disabled'}`,
            staff: result
        });

    } catch (error) {
        console.error('Toggle tracking error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to toggle live tracking' 
        });
    }
});

// Map device to staff
router.post('/device/map', [
    body('device_id').notEmpty().trim(),
    body('staff_id').isInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid input data' 
            });
        }

        const { device_id, staff_id } = req.body;

        // Check if staff exists
        const staffCheck = await query(
            'SELECT id FROM staff WHERE id = $1',
            [staff_id]
        );

        if (staffCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Staff member not found' 
            });
        }

        // Insert or update device mapping
        const result = await query(
            `INSERT INTO devices (device_id, mapped_staff_id) 
             VALUES ($1, $2)
             ON CONFLICT (device_id) 
             DO UPDATE SET mapped_staff_id = $2
             RETURNING *`,
            [device_id, staff_id]
        );

        res.json({
            success: true,
            message: 'Device mapped successfully',
            device: result.rows[0]
        });

    } catch (error) {
        console.error('Map device error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to map device' 
        });
    }
});

// Get all devices
router.get('/devices', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.id, d.device_id, d.mapped_staff_id, d.created_at,
                    s.name as staff_name
             FROM devices d
             LEFT JOIN staff s ON s.id = d.mapped_staff_id
             ORDER BY d.id`
        );

        res.json({
            success: true,
            devices: result.rows
        });

    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch devices' 
        });
    }
});

module.exports = router;
