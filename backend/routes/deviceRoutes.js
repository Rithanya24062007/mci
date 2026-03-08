const express = require('express');
const router = express.Router();
const { verifyDeviceKey } = require('../middleware/auth');
const { recordSensorEvent, getDeviceCount } = require('../controllers/deviceController');

// ESP32 posts sensor event (entry or exit)
// Header required: x-device-key: <ESP32_API_KEY from .env>
router.post('/event', verifyDeviceKey, recordSensorEvent);

// Get current people count for a device (no auth needed for convenience)
router.get('/count/:device_id', getDeviceCount);

module.exports = router;
