const bcrypt = require('bcrypt');
const pool = require('./config/database');

async function testAdminLogin() {
    try {
        console.log('=== Testing Admin Login ===\n');
        
        // 1. Generate correct hash for admin123
        const correctHash = await bcrypt.hash('admin123', 10);
        console.log('1. Newly generated hash for "admin123":');
        console.log(correctHash);
        console.log();
        
        // 2. Test if "admin123" matches the hash in database
        const dbHash = '$2b$10$jeWozsKmtFFGxFAqdVvaauBn.RZbJl6FT3upJNf8IpOqQFQETI66G';
        const isValidOldHash = await bcrypt.compare('admin123', dbHash);
        console.log('2. Does "admin123" match the hash in SQL file?');
        console.log('   Result:', isValidOldHash ? '✓ YES' : '✗ NO');
        console.log();
        
        // 3. Check database for admin user
        console.log('3. Checking database for admin user...');
        const result = await pool.query(
            "SELECT id, name, email, password_hash, role FROM users WHERE email = 'admin@queuepro.com'"
        );
        
        if (result.rows.length === 0) {
            console.log('   ✗ Admin user NOT FOUND in database!');
            console.log('   → Run the database setup SQL first');
        } else {
            const admin = result.rows[0];
            console.log('   ✓ Admin user found:');
            console.log('     ID:', admin.id);
            console.log('     Name:', admin.name);
            console.log('     Email:', admin.email);
            console.log('     Role:', admin.role);
            console.log('     Password Hash:', admin.password_hash);
            console.log();
            
            // 4. Test if password in DB works with "admin123"
            const isValidDBPassword = await bcrypt.compare('admin123', admin.password_hash);
            console.log('4. Does "admin123" match the password hash in database?');
            console.log('   Result:', isValidDBPassword ? '✓ YES - Login should work!' : '✗ NO - Password hash is wrong!');
            
            if (!isValidDBPassword) {
                console.log('\n5. FIXING: Updating admin password to admin123...');
                await pool.query(
                    'UPDATE users SET password_hash = $1 WHERE email = $2',
                    [correctHash, 'admin@queuepro.com']
                );
                console.log('   ✓ Admin password updated successfully!');
                console.log('   → Try logging in again with admin@queuepro.com / admin123');
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

testAdminLogin();
