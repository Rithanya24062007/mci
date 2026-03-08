const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    getCustomerTokens
} = require('../controllers/customerController');

// Public routes (no authentication)
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Protected routes (require customer authentication)
router.get('/profile', verifyToken, getCustomerProfile);
router.get('/tokens', verifyToken, getCustomerTokens);

module.exports = router;
