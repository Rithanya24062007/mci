const pool = require('./config/database');

async function migrate() {
    try {
        // Add completed_at column to tokens table
        await pool.query(`
            ALTER TABLE tokens 
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
        `);
        console.log('✓ Added completed_at column to tokens table');

        // Check current columns
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tokens' 
            ORDER BY ordinal_position
        `);
        console.log('\nTokens table columns:');
        result.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error.message);
        process.exit(1);
    }
}

migrate();
