const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for simplicity
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for vanilla JS
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow loading resources
});

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for token booking
const bookingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // Limit each IP to 3 bookings per minute
    message: {
        success: false,
        error: 'Too many booking attempts, please slow down'
    },
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
});

// Device API rate limiter (more permissive for IoT devices)
const deviceLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 updates per minute (every 2 seconds)
    message: {
        success: false,
        error: 'Device update rate limit exceeded'
    },
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any null bytes from strings
    const sanitize = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].replace(/\0/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
};

module.exports = {
    securityHeaders,
    loginLimiter,
    bookingLimiter,
    apiLimiter,
    deviceLimiter,
    sanitizeInput
};
