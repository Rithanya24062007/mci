const pool = require('./config/database');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Table: live count per device (entry - exit running total)
        await client.query(`
            CREATE TABLE IF NOT EXISTS live_count (
                device_id    VARCHAR(100) PRIMARY KEY,
                staff_id     INTEGER REFERENCES staff(id) ON DELETE CASCADE,
                count        INTEGER NOT NULL DEFAULT 0,
                updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Table: individual sensor event log
        await client.query(`
            CREATE TABLE IF NOT EXISTS sensor_events (
                id           SERIAL PRIMARY KEY,
                device_id    VARCHAR(100) NOT NULL,
                staff_id     INTEGER REFERENCES staff(id) ON DELETE SET NULL,
                event_type   VARCHAR(10) NOT NULL CHECK (event_type IN ('entry', 'exit')),
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query('COMMIT');
        console.log('Migration successful: live_count and sensor_events tables created.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err.message);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
