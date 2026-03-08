const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Customer registration
const registerCustomer = async (req, res) => {
    const { name, phone, email, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
        return res.status(400).json({ error: 'Name, phone, and password are required' });
    }

    // Validate phone format
    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Check if phone already exists
        const existingCustomer = await pool.query(
            'SELECT id FROM customers WHERE phone = $1',
            [phone]
        );

        if (existingCustomer.rows.length > 0) {
            return res.status(409).json({ error: 'Phone number already registered' });
        }

        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await pool.query(
                'SELECT id FROM customers WHERE email = $1',
                [email]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(409).json({ error: 'Email already registered' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert customer
        const result = await pool.query(
            'INSERT INTO customers (name, phone, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email',
            [name, phone, email || null, hashedPassword]
        );

        const customer = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: customer.id, 
                phone: customer.phone,
                role: 'customer'
            },
            JWT_SECRET,
            { expiresIn: '30d' } // Longer expiry for customers
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            }
        });

    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Customer login
const loginCustomer = async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
    }

    try {
        // Find customer by phone
        const result = await pool.query(
            'SELECT * FROM customers WHERE phone = $1',
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }

        const customer = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, customer.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: customer.id, 
                phone: customer.phone,
                role: 'customer'
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            }
        });

    } catch (error) {
        console.error('Error logging in customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get customer profile
const getCustomerProfile = async (req, res) => {
    const customerId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT id, name, phone, email, created_at FROM customers WHERE id = $1',
            [customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer: result.rows[0] });

    } catch (error) {
        console.error('Error getting customer profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get customer's token history
const getCustomerTokens = async (req, res) => {
    const customerId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT t.id, t.token_number, t.status, t.created_at, 
                    s.name as staff_name, s.counter_name
             FROM tokens t
             JOIN staff s ON t.staff_id = s.id
             WHERE t.customer_id = $1
             ORDER BY t.created_at DESC
             LIMIT 50`,
            [customerId]
        );

        res.json({ tokens: result.rows });

    } catch (error) {
        console.error('Error getting customer tokens:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    getCustomerTokens
};
