const pool = require('./config/database');

async function migrate() {
    try {
        console.log('Starting migration: Add last_reset_date to staff_queue...');

        // Add last_reset_date column
        await pool.query(`
            ALTER TABLE staff_queue 
            ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
        `);

        console.log('✓ Added last_reset_date column to staff_queue');
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
