const pool = require('./config/database');

async function checkDatabase() {
    try {
        console.log('=== Checking Database Setup ===\n');
        
        // Check if users table exists
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('1. Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log('   -', row.table_name);
        });
        console.log();
        
        // Check users table
        const usersResult = await pool.query('SELECT * FROM users');
        console.log('2. Users in database:', usersResult.rows.length);
        if (usersResult.rows.length === 0) {
            console.log('   ✗ NO USERS FOUND!');
            console.log('   → You need to run the database setup SQL file');
            console.log('   → psql -U postgres -d queue_management -f ../database/complete_database.sql');
        } else {
            console.log('   Users found:');
            usersResult.rows.forEach(user => {
                console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
            });
        }
        console.log();
        
        // Check staff table
        const staffResult = await pool.query('SELECT * FROM staff');
        console.log('3. Staff members:', staffResult.rows.length);
        console.log();
        
        // Check staff_queue table
        const queueResult = await pool.query('SELECT * FROM staff_queue');
        console.log('4. Staff queues:', queueResult.rows.length);
        console.log();
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === '42P01') {
            console.log('\n✗ Table does not exist!');
            console.log('→ Run the database setup SQL:');
            console.log('  psql -U postgres -d queue_management -f ../database/complete_database.sql');
        }
    } finally {
        await pool.end();
        process.exit();
    }
}

checkDatabase();
