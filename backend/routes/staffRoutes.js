const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    getStaffQueue,
    nextToken,
    getTrackingStatus,
    getLiveTrackingData
} = require('../controllers/staffController');

// All routes require authentication
router.use(verifyToken);

// Get staff's own queue
router.get('/queue', getStaffQueue);

// Move to next token
router.post('/next', nextToken);

// Get tracking status
router.get('/:id/tracking-status', getTrackingStatus);

// Get live tracking data
router.get('/:id/live-data', getLiveTrackingData);

module.exports = router;
