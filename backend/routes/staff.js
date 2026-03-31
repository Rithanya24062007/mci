const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken, requireRole, requireStaffOwnership } = require('../middleware/auth');

const router = express.Router();

// All routes require staff authentication
router.use(verifyToken);
router.use(requireRole('staff'));

// Get current queue state
router.get('/queue', requireStaffOwnership, async (req, res) => {
    try {
        const staffId = req.user.staff_id;

        // Get queue state
        const queueState = await query(
            'SELECT last_issued_token, current_serving_token FROM staff_queue WHERE staff_id = $1',
            [staffId]
        );

        // Get waiting tokens
        const waitingTokens = await query(
            `SELECT id, token_number, customer_name, created_at, status
             FROM tokens
             WHERE staff_id = $1 AND status IN ('waiting', 'serving')
             ORDER BY token_number`,
            [staffId]
        );

        res.json({
            success: true,
            queue: {
                last_issued_token: queueState.rows[0]?.last_issued_token || 0,
                current_serving_token: queueState.rows[0]?.current_serving_token || 0,
                waiting_tokens: waitingTokens.rows
            }
        });

    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch queue data' 
        });
    }
});

// Serve next customer
router.post('/next', requireStaffOwnership, async (req, res) => {
    try {
        const staffId = req.user.staff_id;

        const result = await transaction(async (client) => {
            // Get current state
            const queueState = await client.query(
                'SELECT current_serving_token, last_issued_token FROM staff_queue WHERE staff_id = $1',
                [staffId]
            );

            const currentToken = queueState.rows[0].current_serving_token;
            const lastIssued = queueState.rows[0].last_issued_token;

            // Check if there are waiting customers
            if (currentToken >= lastIssued) {
                return { 
                    success: false, 
                    message: 'No waiting customers' 
                };
            }

            const nextToken = currentToken + 1;

            // Mark current token as completed (if exists)
            if (currentToken > 0) {
                await client.query(
                    'UPDATE tokens SET status = $1 WHERE staff_id = $2 AND token_number = $3',
                    ['completed', staffId, currentToken]
                );
            }

            // Mark next token as serving
            await client.query(
                'UPDATE tokens SET status = $1 WHERE staff_id = $2 AND token_number = $3',
                ['serving', staffId, nextToken]
            );

            // Update current serving token
            await client.query(
                'UPDATE staff_queue SET current_serving_token = $1 WHERE staff_id = $2',
                [nextToken, staffId]
            );

            return {
                success: true,
                current_serving_token: nextToken
            };
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);

    } catch (error) {
        console.error('Serve next error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to serve next customer' 
        });
    }
});

// Get live tracking data
router.get('/live-data', requireStaffOwnership, async (req, res) => {
    try {
        const staffId = req.user.staff_id;

        // Check if live tracking is enabled
        const staffCheck = await query(
            'SELECT live_tracking_enabled FROM staff WHERE id = $1',
            [staffId]
        );

        if (!staffCheck.rows[0]?.live_tracking_enabled) {
            return res.json({
                success: true,
                enabled: false,
                message: 'Live tracking not enabled for this staff member'
            });
        }

        // Get latest tracking data (last 30 seconds)
        const result = await query(
            `SELECT entry_sensor_value, exit_sensor_value, calculated_occupancy, timestamp
             FROM live_tracking_data
             WHERE staff_id = $1 AND timestamp > NOW() - INTERVAL '30 seconds'
             ORDER BY timestamp DESC
             LIMIT 1`,
            [staffId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                enabled: true,
                data: null,
                message: 'No recent data available'
            });
        }

        res.json({
            success: true,
            enabled: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get live data error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch live tracking data' 
        });
    }
});

// Get recent tracking history (for chart visualization)
router.get('/live-data/history', requireStaffOwnership, async (req, res) => {
    try {
        const staffId = req.user.staff_id;
        const limit = parseInt(req.query.limit) || 20;

        // Check if live tracking is enabled
        const staffCheck = await query(
            'SELECT live_tracking_enabled FROM staff WHERE id = $1',
            [staffId]
        );

        if (!staffCheck.rows[0]?.live_tracking_enabled) {
            return res.json({
                success: true,
                enabled: false,
                history: []
            });
        }

        // Get recent history (last 5 minutes)
        const result = await query(
            `SELECT entry_sensor_value, exit_sensor_value, calculated_occupancy, timestamp
             FROM live_tracking_data
             WHERE staff_id = $1 AND timestamp > NOW() - INTERVAL '5 minutes'
             ORDER BY timestamp DESC
             LIMIT $2`,
            [staffId, limit]
        );

        res.json({
            success: true,
            enabled: true,
            history: result.rows.reverse() // Oldest to newest for chart
        });

    } catch (error) {
        console.error('Get live history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch tracking history' 
        });
    }
});

module.exports = router;
