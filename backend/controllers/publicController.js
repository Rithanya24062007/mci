const pool = require('../config/database');
const { checkAndResetQueue } = require('../utils/queueReset');

// Get customer's active token
const getCustomerActiveToken = async (req, res) => {
    const customerId = parseInt(req.params.customerId);

    try {
        const result = await pool.query(
            `SELECT t.id, t.token_number, t.staff_id, t.status, t.created_at,
                    s.name as staff_name, s.counter_name
             FROM tokens t
             JOIN staff s ON t.staff_id = s.id
             WHERE t.customer_id = $1 
             AND t.status IN ('waiting', 'serving')
             ORDER BY t.created_at DESC
             LIMIT 1`,
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.json({ hasActiveToken: false });
        }

        const token = result.rows[0];
        res.json({
            hasActiveToken: true,
            tokenNumber: token.token_number,
            staffId: token.staff_id,
            staffName: token.staff_name,
            counterName: token.counter_name,
            status: token.status,
            createdAt: token.created_at
        });

    } catch (error) {
        console.error('Error getting customer active token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get active staff list
const getActiveStaff = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.id, s.name, s.counter_name, sq.current_serving_token,
                    (SELECT COUNT(*) FROM tokens WHERE staff_id = s.id AND status = 'waiting') as waiting_count
             FROM staff s
             JOIN staff_queue sq ON s.id = sq.staff_id
             WHERE s.is_active = true
             ORDER BY s.counter_name ASC`
        );

        res.json({
            staff: result.rows
        });

    } catch (error) {
        console.error('Error getting active staff:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get queue info for specific staff
const getQueueInfo = async (req, res) => {
    const staffId = parseInt(req.params.id);

    try {
        const queueResult = await pool.query(
            'SELECT current_serving_token, last_issued_token FROM staff_queue WHERE staff_id = $1',
            [staffId]
        );

        if (queueResult.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        const queue = queueResult.rows[0];

        // Get waiting count
        const waitingResult = await pool.query(
            'SELECT COUNT(*) as count FROM tokens WHERE staff_id = $1 AND status = $2',
            [staffId, 'waiting']
        );

        res.json({
            currentServingToken: queue.current_serving_token,
            lastIssuedToken: queue.last_issued_token,
            waitingCount: parseInt(waitingResult.rows[0].count)
        });

    } catch (error) {
        console.error('Error getting queue info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Check specific token status
const checkTokenStatus = async (req, res) => {
    const staffId = parseInt(req.params.staffId);
    const tokenNumber = parseInt(req.params.tokenNumber);

    try {
        const tokenResult = await pool.query(
            'SELECT status, completed_at FROM tokens WHERE staff_id = $1 AND token_number = $2',
            [staffId, tokenNumber]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(404).json({ error: 'Token not found' });
        }

        const token = tokenResult.rows[0];

        // Get current serving token
        const queueResult = await pool.query(
            'SELECT current_serving_token FROM staff_queue WHERE staff_id = $1',
            [staffId]
        );

        const currentServingToken = Number.parseInt(queueResult.rows[0]?.current_serving_token || 0);
        let aheadCount = 0;

        // For waiting customers, count both waiting tokens ahead and the currently serving token (if it is ahead).
        if (token.status === 'waiting') {
            const aheadResult = await pool.query(
                'SELECT COUNT(*) as count FROM tokens WHERE staff_id = $1 AND status = $2 AND token_number < $3',
                [staffId, 'waiting', tokenNumber]
            );

            const waitingAheadCount = Number.parseInt(aheadResult.rows[0]?.count || 0);
            const hasServingAhead = currentServingToken > 0 && currentServingToken < tokenNumber ? 1 : 0;
            aheadCount = waitingAheadCount + hasServingAhead;
        }

        res.json({
            tokenNumber: tokenNumber,
            status: token.status,
            completedAt: token.completed_at,
            currentServingToken,
            aheadCount
        });

    } catch (error) {
        console.error('Error checking token status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Book a token
const bookToken = async (req, res) => {
    const { staffId, customerName, customerPhone, customerId } = req.body;

    if (!staffId) {
        return res.status(400).json({ error: 'Staff ID is required' });
    }

    // For guest users (no customerId), require name and phone
    if (!customerId && (!customerName || !customerPhone)) {
        return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    // Validate phone number format if provided
    if (customerPhone && !/^[0-9]{10}$/.test(customerPhone)) {
        return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check and reset queue if it's a new day
        await checkAndResetQueue(client, staffId);

        // Check if staff is active
        const staffResult = await client.query(
            'SELECT is_active FROM staff WHERE id = $1',
            [staffId]
        );

        if (staffResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Staff not found' });
        }

        if (!staffResult.rows[0].is_active) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'This counter is currently not active' });
        }

        // Get and increment last_issued_token atomically
        const queueResult = await client.query(
            'UPDATE staff_queue SET last_issued_token = last_issued_token + 1 WHERE staff_id = $1 RETURNING last_issued_token',
            [staffId]
        );

        const tokenNumber = queueResult.rows[0].last_issued_token;

        // Insert token record with customer_id if logged in
        await client.query(
            'INSERT INTO tokens (staff_id, token_number, customer_name, customer_phone, customer_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [staffId, tokenNumber, customerName, customerPhone, customerId || null, 'waiting']
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            tokenNumber,
            message: `Token ${tokenNumber} booked successfully`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error booking token:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Get current serving token for a staff
const getCurrentToken = async (req, res) => {
    const staffId = parseInt(req.params.id);

    try {
        const result = await pool.query(
            'SELECT current_serving_token FROM staff_queue WHERE staff_id = $1',
            [staffId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        res.json({
            currentServingToken: result.rows[0].current_serving_token
        });

    } catch (error) {
        console.error('Error getting current token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getActiveStaff,
    getQueueInfo,
    bookToken,
    getCurrentToken,
    checkTokenStatus,
    getCustomerActiveToken
};
