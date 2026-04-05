const pool = require('../config/database');

const normalizeDeviceId = (value) => {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().toUpperCase();
};

/**
 * POST /device/event
 * Called by ESP32 with header x-device-key and body { device_id, sensor: "entry"|"exit" }
 * - entry  → increment people count
 * - exit   → decrement people count (min 0)
 */
const recordSensorEvent = async (req, res) => {
    const { device_id, sensor } = req.body;
    const normalizedDeviceId = normalizeDeviceId(device_id);

    if (!normalizedDeviceId || !sensor) {
        return res.status(400).json({ error: 'device_id and sensor ("entry" or "exit") are required' });
    }

    if (sensor !== 'entry' && sensor !== 'exit') {
        return res.status(400).json({ error: 'sensor must be "entry" or "exit"' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Look up which staff this device is mapped to
        const deviceResult = await client.query(
            'SELECT mapped_staff_id FROM devices WHERE UPPER(TRIM(device_id)) = $1',
            [normalizedDeviceId]
        );

        if (deviceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Device not mapped. Register it in the admin panel first.' });
        }

        const staffId = deviceResult.rows[0].mapped_staff_id;
        const delta = sensor === 'entry' ? 1 : -1;

        // Upsert live_count: insert if first time, otherwise adjust count (never below 0)
        const countResult = await client.query(
            `INSERT INTO live_count (device_id, staff_id, count, updated_at)
             VALUES ($1, $2, GREATEST(0, $3), CURRENT_TIMESTAMP)
             ON CONFLICT (device_id)
             DO UPDATE SET
                 count      = GREATEST(0, live_count.count + $3),
                 updated_at = CURRENT_TIMESTAMP
             RETURNING count`,
            [normalizedDeviceId, staffId, delta]
        );

        const newCount = countResult.rows[0].count;

        // Log the individual sensor event
        await client.query(
            'INSERT INTO sensor_events (device_id, staff_id, event_type) VALUES ($1, $2, $3)',
            [normalizedDeviceId, staffId, sensor]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            device_id: normalizedDeviceId,
            event: sensor,
            people_count: newCount
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Device event error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

/**
 * GET /device/count/:device_id
 * Returns current people count for a device (for testing/admin)
 */
const getDeviceCount = async (req, res) => {
    const { device_id } = req.params;
    const normalizedDeviceId = normalizeDeviceId(device_id);

    if (!normalizedDeviceId) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    try {
        const result = await pool.query(
            'SELECT count, updated_at FROM live_count WHERE UPPER(TRIM(device_id)) = $1',
            [normalizedDeviceId]
        );
        if (result.rows.length === 0) {
            return res.json({ device_id: normalizedDeviceId, people_count: 0, updated_at: null });
        }
        res.json({
            device_id: normalizedDeviceId,
            people_count: result.rows[0].count,
            updated_at: result.rows[0].updated_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { recordSensorEvent, getDeviceCount };
