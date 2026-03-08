const express = require('express');
const router = express.Router();
const {
    getActiveStaff,
    getQueueInfo,
    bookToken,
    getCurrentToken,
    checkTokenStatus,
    getCustomerActiveToken
} = require('../controllers/publicController');

// Public routes (no authentication required)

// Get active staff list
router.get('/staff/active', getActiveStaff);

// Get queue info for specific staff
router.get('/staff/:id/queue-info', getQueueInfo);

// Get current serving token
router.get('/staff/:id/current-token', getCurrentToken);

// Check specific token status
router.get('/staff/:staffId/token/:tokenNumber/status', checkTokenStatus);

// Get customer's active token
router.get('/customer/:customerId/active-token', getCustomerActiveToken);

// Book a token
router.post('/token/book', bookToken);

module.exports = router;
