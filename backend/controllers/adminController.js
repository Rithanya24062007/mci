const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Create new staff
const createStaff = async (req, res) => {
    const { name, counterName, email, password } = req.body;

    // Validate input
    if (!name || !counterName || !email || !password) {
        return res.status(400).json({ error: 'Name, counter name, email, and password are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if email already exists
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Create staff entry
        const staffResult = await client.query(
            'INSERT INTO staff (name, counter_name, is_active, live_tracking_enabled) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, counterName, true, false]
        );

        const staffId = staffResult.rows[0].id;

        // Initialize staff queue
        await client.query(
            'INSERT INTO staff_queue (staff_id, last_issued_token, current_serving_token) VALUES ($1, 0, 0)',
            [staffId]
        );

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user account
        await client.query(
            'INSERT INTO users (name, email, password_hash, role, staff_id) VALUES ($1, $2, $3, $4, $5)',
            [name, email, passwordHash, 'staff', staffId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Staff created successfully',
            staffId: staffId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Get all staff
const getAllStaff = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, counter_name, is_active, live_tracking_enabled, created_at FROM staff ORDER BY created_at DESC'
        );

        res.json({ staff: result.rows });

    } catch (error) {
        console.error('Get all staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update staff status (enable/disable)
const updateStaffStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    try {
        const result = await pool.query(
            'UPDATE staff SET is_active = $1 WHERE id = $2 RETURNING *',
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        res.json({
            message: 'Staff status updated successfully',
            staff: result.rows[0]
        });

    } catch (error) {
        console.error('Update staff status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Toggle live tracking
const toggleLiveTracking = async (req, res) => {
    const { id } = req.params;
    const { live_tracking_enabled } = req.body;

    if (typeof live_tracking_enabled !== 'boolean') {
        return res.status(400).json({ error: 'live_tracking_enabled must be a boolean' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // If enabling tracking for this staff, disable for all others (prototype limitation)
        if (live_tracking_enabled) {
            await client.query('UPDATE staff SET live_tracking_enabled = false WHERE id != $1', [id]);
        }

        // Update the target staff
        const result = await client.query(
            'UPDATE staff SET live_tracking_enabled = $1 WHERE id = $2 RETURNING *',
            [live_tracking_enabled, id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Staff not found' });
        }

        await client.query('COMMIT');

        res.json({
            message: 'Live tracking updated successfully',
            staff: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Toggle live tracking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Map device to staff
const mapDevice = async (req, res) => {
    const { device_id, mapped_staff_id } = req.body;

    if (!device_id || !mapped_staff_id) {
        return res.status(400).json({ error: 'device_id and mapped_staff_id are required' });
    }

    try {
        // Check if staff exists
        const staffCheck = await pool.query('SELECT id FROM staff WHERE id = $1', [mapped_staff_id]);

        if (staffCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Insert or update device mapping
        const result = await pool.query(
            `INSERT INTO devices (device_id, mapped_staff_id) 
             VALUES ($1, $2) 
             ON CONFLICT (device_id) 
             DO UPDATE SET mapped_staff_id = $2 
             RETURNING *`,
            [device_id, mapped_staff_id]
        );

        res.json({
            message: 'Device mapped successfully',
            device: result.rows[0]
        });

    } catch (error) {
        console.error('Map device error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update staff details
const updateStaffDetails = async (req, res) => {
    const { id } = req.params;
    const { name, counterName, email, password } = req.body;

    if (!name || !counterName || !email) {
        return res.status(400).json({ error: 'Name, counter name, and email are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if staff exists
        const staffCheck = await client.query(
            'SELECT staff_id FROM users WHERE staff_id = $1',
            [id]
        );

        if (staffCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Staff not found' });
        }

        const userId = staffCheck.rows[0].staff_id;

        // Check if email is taken by another user
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1 AND staff_id != $2',
            [email, id]
        );

        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Update staff table
        await client.query(
            'UPDATE staff SET name = $1, counter_name = $2 WHERE id = $3',
            [name, counterName, id]
        );

        // Update user table
        if (password && password.trim() !== '') {
            // If password provided, hash and update it
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            await client.query(
                'UPDATE users SET name = $1, email = $2, password_hash = $3 WHERE staff_id = $4',
                [name, email, passwordHash, id]
            );
        } else {
            // Update without changing password
            await client.query(
                'UPDATE users SET name = $1, email = $2 WHERE staff_id = $3',
                [name, email, id]
            );
        }

        await client.query('COMMIT');

        res.json({ message: 'Staff updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update staff details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Delete staff
const deleteStaff = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if staff exists
        const checkResult = await pool.query(
            'SELECT id FROM staff WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Delete staff (CASCADE will delete related records)
        await pool.query('DELETE FROM staff WHERE id = $1', [id]);

        res.json({ message: 'Staff deleted successfully' });

    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                c.id, 
                c.name, 
                c.phone, 
                c.email, 
                c.created_at,
                COUNT(t.id) as total_tokens,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tokens,
                MAX(t.created_at) as last_visit
             FROM customers c
             LEFT JOIN tokens t ON c.id = t.customer_id
             GROUP BY c.id, c.name, c.phone, c.email, c.created_at
             ORDER BY c.created_at DESC`
        );

        res.json({ customers: result.rows });

    } catch (error) {
        console.error('Get all customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get customer details
const getCustomerDetails = async (req, res) => {
    const customerId = parseInt(req.params.id);

    if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    try {
        // Get customer info
        const customerResult = await pool.query(
            'SELECT id, name, phone, email, created_at FROM customers WHERE id = $1',
            [customerId]
        );

        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get customer's token history
        const tokensResult = await pool.query(
            `SELECT 
                t.id,
                t.token_number,
                t.status,
                t.created_at,
                s.name as staff_name,
                s.counter_name
             FROM tokens t
             JOIN staff s ON t.staff_id = s.id
             WHERE t.customer_id = $1
             ORDER BY t.created_at DESC
             LIMIT 50`,
            [customerId]
        );

        res.json({
            customer: customerResult.rows[0],
            tokens: tokensResult.rows
        });

    } catch (error) {
        console.error('Get customer details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createStaff,
    getAllStaff,
    updateStaffStatus,
    updateStaffDetails,
    toggleLiveTracking,
    mapDevice,
    deleteStaff,
    getAllCustomers,
    getCustomerDetails
};
