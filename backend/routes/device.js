const express = require('express');
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to validate device API key
const validateDeviceKey = (req, res, next) => {
    const deviceKey = req.headers['x-device-key'];
    
    if (!deviceKey || deviceKey !== process.env.DEVICE_API_KEY) {
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid device key' 
        });
    }
    
    next();
};

// ESP32 device update endpoint
router.post('/update', validateDeviceKey, [
    body('device_id').notEmpty().trim(),
    body('entry_sensor_value').isInt({ min: 0 }),
    body('exit_sensor_value').isInt({ min: 0 }),
    body('timestamp').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid sensor data format' 
            });
        }

        const { device_id, entry_sensor_value, exit_sensor_value, timestamp } = req.body;

        // Find device and mapped staff
        const deviceResult = await query(
            'SELECT mapped_staff_id FROM devices WHERE device_id = $1',
            [device_id]
        );

        if (deviceResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Device not registered' 
            });
        }

        const mappedStaffId = deviceResult.rows[0].mapped_staff_id;

        if (!mappedStaffId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Device not mapped to any staff member' 
            });
        }

        // Check if live tracking is enabled for this staff
        const staffResult = await query(
            'SELECT live_tracking_enabled FROM staff WHERE id = $1',
            [mappedStaffId]
        );

        if (!staffResult.rows[0]?.live_tracking_enabled) {
            return res.status(403).json({ 
                success: false, 
                error: 'Live tracking not enabled for this staff member' 
            });
        }

        // Calculate occupancy
        const calculatedOccupancy = entry_sensor_value - exit_sensor_value;

        // Save tracking data
        await query(
            `INSERT INTO live_tracking_data 
             (staff_id, entry_sensor_value, exit_sensor_value, calculated_occupancy, timestamp) 
             VALUES ($1, $2, $3, $4, $5)`,
            [mappedStaffId, entry_sensor_value, exit_sensor_value, calculatedOccupancy, timestamp]
        );

        res.json({
            success: true,
            message: 'Sensor data saved successfully',
            data: {
                staff_id: mappedStaffId,
                entry: entry_sensor_value,
                exit: exit_sensor_value,
                occupancy: calculatedOccupancy
            }
        });

    } catch (error) {
        console.error('Device update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save sensor data' 
        });
    }
});

// Get device status (for testing/debugging)
router.get('/status/:device_id', validateDeviceKey, async (req, res) => {
    try {
        const { device_id } = req.params;

        const result = await query(
            `SELECT d.device_id, d.mapped_staff_id, s.name as staff_name, s.live_tracking_enabled,
                    d.created_at
             FROM devices d
             LEFT JOIN staff s ON s.id = d.mapped_staff_id
             WHERE d.device_id = $1`,
            [device_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Device not found' 
            });
        }

        res.json({
            success: true,
            device: result.rows[0]
        });

    } catch (error) {
        console.error('Get device status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch device status' 
        });
    }
});

module.exports = router;
