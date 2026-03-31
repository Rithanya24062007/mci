// Script to generate bcrypt hash and update staff passwords
const bcrypt = require('bcrypt');
const db = require('./config/database');

async function updateStaffPasswords() {
    try {
        console.log('Generating bcrypt hash for password "pass123"...\n');
        
        const password = 'pass123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Generated hash:', hashedPassword);
        console.log('\nUpdating all staff passwords...\n');
        
        const staffIds = ['staff1', 'staff2', 'staff3', 'staff4'];
        
        for (const staffId of staffIds) {
            const result = await db.query(
                'UPDATE staff SET password = $1 WHERE id = $2 RETURNING id, name',
                [hashedPassword, staffId]
            );
            
            if (result.rows.length > 0) {
                console.log(`✓ Updated ${result.rows[0].id}: ${result.rows[0].name}`);
            }
        }
        
        console.log('\n✅ All staff passwords updated successfully!');
        console.log('Password for all staff: pass123');
        
        // Test login
        console.log('\nTesting staff1 login...');
        const testResult = await db.query('SELECT * FROM staff WHERE id = $1', ['staff1']);
        const staff = testResult.rows[0];
        const isValid = await bcrypt.compare('pass123', staff.password);
        
        if (isValid) {
            console.log('✅ Password verification successful!');
        } else {
            console.log('❌ Password verification failed!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

updateStaffPasswords();
