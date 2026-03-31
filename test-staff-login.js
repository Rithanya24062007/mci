// Quick test to verify staff login
const bcrypt = require('bcrypt');
const db = require('./config/database');

async function testStaffLogin() {
    try {
        console.log('Testing staff login credentials...\n');
        
        const staffId = 'staff1';
        const password = 'pass123';
        
        // Simulate login process
        const result = await db.query('SELECT * FROM staff WHERE id = $1', [staffId]);
        
        if (result.rows.length === 0) {
            console.log('❌ Staff not found');
            process.exit(1);
        }
        
        const staff = result.rows[0];
        console.log(`Found staff: ${staff.name} (${staff.department})`);
        console.log(`Stored password hash: ${staff.password.substring(0, 20)}...`);
        
        // Verify password
        const isValid = await bcrypt.compare(password, staff.password);
        
        if (isValid) {
            console.log('\n✅ SUCCESS! Staff login is working!');
            console.log('\nYou can now login with:');
            console.log('  Staff ID: staff1, staff2, staff3, or staff4');
            console.log('  Password: pass123');
        } else {
            console.log('\n❌ FAILED! Password verification failed');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testStaffLogin();
