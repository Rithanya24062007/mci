const pool = require('../config/database');
const { checkAndResetQueue } = require('../utils/queueReset');

// Get staff's own queue data
const getStaffQueue = async (req, res) => {
    const staffId = req.user.staffId;

    if (!staffId) {
        return res.status(403).json({ error: 'No staff ID associated with this user' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check and reset queue if it's a new day
        await checkAndResetQueue(client, staffId);

        await client.query('COMMIT');
        client.release();

        // Get queue information
        const queueResult = await pool.query(
            'SELECT last_issued_token, current_serving_token FROM staff_queue WHERE staff_id = $1',
            [staffId]
        );

        if (queueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Queue not found for this staff' });
        }

        const queue = queueResult.rows[0];

        // Get waiting tokens
        const tokensResult = await pool.query(
            `SELECT token_number, customer_name, customer_phone, created_at 
             FROM tokens 
             WHERE staff_id = $1 AND status = 'waiting' 
             ORDER BY token_number ASC`,
            [staffId]
        );

        // Get completed tokens count for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedResult = await pool.query(
            `SELECT COUNT(*) as count 
             FROM tokens 
             WHERE staff_id = $1 AND status = 'completed' AND created_at >= $2`,
            [staffId, today]
        );

        res.json({
            currentServingToken: queue.current_serving_token,
            lastIssuedToken: queue.last_issued_token,
            waitingTokens: tokensResult.rows,
            completedToday: parseInt(completedResult.rows[0].count)
        });

    } catch (error) {
        console.error('Error getting staff queue:', error);
        if (client) {
            await client.query('ROLLBACK');
            client.release();
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Move to next token
const nextToken = async (req, res) => {
    const staffId = req.user.staffId;

    if (!staffId) {
        return res.status(403).json({ error: 'No staff ID associated with this user' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get current queue state
        const queueResult = await client.query(
            'SELECT last_issued_token, current_serving_token FROM staff_queue WHERE staff_id = $1 FOR UPDATE',
            [staffId]
        );

        if (queueResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Queue not found' });
        }

        const queue = queueResult.rows[0];
        const currentToken = queue.current_serving_token;

        // Find the next waiting token (minimum token_number with status='waiting')
        const nextTokenResult = await client.query(
            'SELECT token_number FROM tokens WHERE staff_id = $1 AND status = $2 ORDER BY token_number ASC LIMIT 1',
            [staffId, 'waiting']
        );

        if (nextTokenResult.rows.length === 0) {
            // No next token — complete the current one and reset the serving slot
            if (currentToken > 0) {
                await client.query(
                    'UPDATE tokens SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE staff_id = $2 AND token_number = $3',
                    ['completed', staffId, currentToken]
                );
                await client.query(
                    'UPDATE staff_queue SET current_serving_token = 0 WHERE staff_id = $1',
                    [staffId]
                );
            }
            await client.query('COMMIT');
            return res.json({
                success: true,
                currentServingToken: null,
                message: 'Queue is now empty'
            });
        }

        const nextTokenNumber = nextTokenResult.rows[0].token_number;

        // Mark current token as completed (if exists)
        if (currentToken > 0) {
            await client.query(
                'UPDATE tokens SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE staff_id = $2 AND token_number = $3',
                ['completed', staffId, currentToken]
            );
        }

        // Mark next token as serving
        await client.query(
            'UPDATE tokens SET status = $1 WHERE staff_id = $2 AND token_number = $3',
            ['serving', staffId, nextTokenNumber]
        );

        // Update current serving token
        await client.query(
            'UPDATE staff_queue SET current_serving_token = $1 WHERE staff_id = $2',
            [nextTokenNumber, staffId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            currentServingToken: nextTokenNumber,
            message: `Now serving token ${nextTokenNumber}`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('============================================');
        console.error('ERROR in nextToken function:');
        console.error('Staff ID:', staffId);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('============================================');
        res.status(500).json({ error: 'Internal server error', details: error.message });
    } finally {
        client.release();
    }
};

// Get tracking status
const getTrackingStatus = async (req, res) => {
    const staffId = req.user.staffId;

    if (!staffId) {
        return res.status(403).json({ error: 'No staff ID associated with this user' });
    }

    try {
        const result = await pool.query(
            'SELECT live_tracking_enabled FROM staff WHERE id = $1',
            [staffId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        res.json({
            liveTrackingEnabled: result.rows[0].live_tracking_enabled
        });

    } catch (error) {
        console.error('Error getting tracking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get live tracking data (people count from ultrasonic sensors)
const getLiveTrackingData = async (req, res) => {
    const staffId = req.user.staffId;

    if (!staffId) {
        return res.status(403).json({ error: 'No staff ID associated with this user' });
    }

    try {
        // Find the device mapped to this staff and get its current people count
        const result = await pool.query(
            `SELECT lc.count AS people_count, lc.updated_at AS timestamp
             FROM live_count lc
             JOIN devices d ON d.device_id = lc.device_id
             WHERE d.mapped_staff_id = $1
             ORDER BY lc.updated_at DESC
             LIMIT 1`,
            [staffId]
        );

        if (result.rows.length === 0) {
            return res.json({ latestReading: null });
        }

        res.json({
            latestReading: {
                sensor_value: result.rows[0].people_count,
                timestamp:    result.rows[0].timestamp
            }
        });

    } catch (error) {
        console.error('Error getting live tracking data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getStaffQueue,
    nextToken,
    getTrackingStatus,
    getLiveTrackingData
};
