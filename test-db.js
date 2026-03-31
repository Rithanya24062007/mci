// Quick database connection test
require('dotenv').config();
const db = require('./config/database');

async function testConnection() {
    console.log('Testing database connection...\n');
    
    try {
        // Test basic connection
        const timeResult = await db.query('SELECT NOW()');
        console.log('✓ Database connection successful!');
        console.log('  Server time:', timeResult.rows[0].now);
        
        // Check tables
        const tablesResult = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n✓ Tables found:');
        tablesResult.rows.forEach(row => {
            console.log('  -', row.table_name);
        });
        
        // Check staff count
        const staffResult = await db.query('SELECT COUNT(*) FROM staff');
        console.log('\n✓ Staff members:', staffResult.rows[0].count);
        
        // Check queue count
        const queueResult = await db.query('SELECT current_count FROM queue_count WHERE id = 1');
        console.log('✓ Current queue count:', queueResult.rows[0]?.current_count || 0);
        
        console.log('\n🎉 Database is ready to use!');
        process.exit(0);
    } catch (error) {
        console.error('\n✗ Database connection failed:');
        console.error('  Error:', error.message);
        console.error('\nPlease check:');
        console.error('  1. PostgreSQL is running');
        console.error('  2. Database "token_reservation" exists');
        console.error('  3. Credentials in .env file are correct');
        console.error('  4. Schema has been loaded (run database/schema.sql)');
        process.exit(1);
    }
}

testConnection();
