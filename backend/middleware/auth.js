const jwt = require('jsonwebtoken');

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user info to request
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// Verify admin role middleware
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Verify staff role middleware
const verifyStaff = (req, res, next) => {
    if (req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Staff only.' });
    }
    next();
};

// Verify staff accessing own data
const verifyStaffOwnership = (req, res, next) => {
    const requestedStaffId = parseInt(req.params.id || req.body.staff_id);
    
    if (req.user.role === 'admin') {
        // Admin can access all staff data
        next();
    } else if (req.user.role === 'staff') {
        // Staff can only access their own data
        if (req.user.staffId !== requestedStaffId) {
            return res.status(403).json({ error: 'Access denied. Cannot access other staff data.' });
        }
        next();
    } else {
        return res.status(403).json({ error: 'Access denied.' });
    }
};

// Verify ESP32 device key
const verifyDeviceKey = (req, res, next) => {
    const deviceKey = req.headers['x-device-key'];

    if (!deviceKey || deviceKey !== process.env.ESP32_API_KEY) {
        return res.status(401).json({ error: 'Invalid device key.' });
    }
    next();
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyStaff,
    verifyStaffOwnership,
    verifyDeviceKey
};
