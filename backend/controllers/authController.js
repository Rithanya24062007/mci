const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login
const login = async (req, res) => {
    const { email, password, staffId, username, identifier } = req.body;
    const loginIdentifier = (identifier || email || staffId || username || '').toString().trim();

    // Validate input
    if (!loginIdentifier || !password) {
        return res.status(400).json({ error: 'Email or Staff ID and password are required' });
    }

    try {
        // Support both email-based login and staff-id style login.
        const result = await pool.query(
            `SELECT u.*,
                    s.is_active AS staff_is_active
             FROM users u
             LEFT JOIN staff s ON s.id = u.staff_id
             WHERE LOWER(u.email) = LOWER($1)
                OR (u.role = 'staff' AND u.staff_id::text = $1)
                OR ($1 = 'admin' AND u.role = 'admin')
             ORDER BY u.id ASC
             LIMIT 1`,
            [loginIdentifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Block inactive staff logins.
        if (user.role === 'staff' && user.staff_is_active === false) {
            return res.status(403).json({ error: 'Staff account is inactive. Contact admin.' });
        }

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '').toString().trim() || '1h';

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                staffId: user.staff_id
            },
            process.env.JWT_SECRET,
            { expiresIn: jwtExpiresIn }
        );

        // Return success response
        res.json({
            token,
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            staffId: user.staff_id
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    login
};
