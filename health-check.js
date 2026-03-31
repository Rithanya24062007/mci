// Quick validation script to check if everything is working
const http = require('http');

console.log('🔍 Queue Management System - Health Check\n');

// Test server is running
const testServer = () => {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/health', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Server is running on http://localhost:3000');
                    resolve(true);
                } else {
                    console.log('❌ Server returned status:', res.statusCode);
                    reject(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log('❌ Server is not running');
            console.log('   Run: npm start');
            reject(err);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
};

// Test staff list endpoint
const testStaffList = () => {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/api/customer/staff/list', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success && json.staff.length > 0) {
                        console.log(`✅ Staff list endpoint working (${json.staff.length} staff found)`);
                        resolve(true);
                    } else {
                        console.log('⚠️  Staff list is empty');
                        resolve(false);
                    }
                } catch (err) {
                    console.log('❌ Staff list endpoint error:', err.message);
                    reject(err);
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
};

// Run tests
(async () => {
    try {
        await testServer();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
        await testStaffList();
        
        console.log('\n✅ All checks passed!');
        console.log('\n📱 Access Points:');
        console.log('   Customer: http://localhost:3000');
        console.log('   Login:    http://localhost:3000/login.html');
        console.log('\n👤 Test Credentials:');
        console.log('   Admin: admin@example.com / admin123');
        console.log('   Staff: sarah.johnson@example.com / admin123');
        
        process.exit(0);
    } catch (err) {
        console.log('\n❌ Health check failed');
        process.exit(1);
    }
})();
