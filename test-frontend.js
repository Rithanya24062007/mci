// Comprehensive frontend functionality test
const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (err) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('==================================================');
    console.log('Queue Management System - Comprehensive Test');
    console.log('==================================================\n');

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1: Server Health
    try {
        console.log('Test 1: Server Health Check');
        const res = await makeRequest('GET', '/health');
        if (res.status === 200) {
            console.log('✅ PASS: Server is healthy\n');
            results.passed++;
        } else {
            console.log('❌ FAIL: Server health check failed\n');
            results.failed++;
        }
    } catch (err) {
        console.log('❌ FAIL: Server health check failed:', err.message, '\n');
        results.failed++;
    }

    // Test 2: Staff List (Public endpoint)
    try {
        console.log('Test 2: Public Staff List');
        const res = await makeRequest('GET', '/api/customer/staff/list');
        if (res.status === 200 && res.data.success && res.data.staff.length > 0) {
            console.log(`✅ PASS: Staff list retrieved (${res.data.staff.length} staff)\n`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Staff list request failed\n');
            results.failed++;
        }
    } catch (err) {
        console.log('❌ FAIL: Staff list request failed:', err.message, '\n');
        results.failed++;
    }

    // Test 3: Admin Login (CRITICAL - was broken before)
    let adminToken = null;
    try {
        await delay(1000); // Avoid rate limiting
        console.log('Test 3: Admin Login (bcrypt hash verification)');
        const res = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });
        
        if (res.status === 200 && res.data.success && res.data.token) {
            adminToken = res.data.token;
            console.log('✅ PASS: Admin login successful (bcrypt hash working!)');
            console.log(`   Token: ${adminToken.substring(0, 20)}...\n`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Admin login failed');
            console.log('   Response:', JSON.stringify(res.data, null, 2), '\n');
            results.failed++;
        }
    } catch (err) {
        console.log('❌ FAIL: Admin login failed:', err.message, '\n');
        results.failed++;
    }

    // Test 4: Staff Login
    let staffToken = null;
    try {
        await delay(1000); // Avoid rate limiting
        console.log('Test 4: Staff Login');
        const res = await makeRequest('POST', '/api/auth/login', {
            email: 'sarah.johnson@example.com',
            password: 'admin123'
        });
        
        if (res.status === 200 && res.data.success && res.data.token) {
            staffToken = res.data.token;
            console.log('✅ PASS: Staff login successful');
            console.log(`   Token: ${staffToken.substring(0, 20)}...\n`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Staff login failed');
            console.log('   Response:', JSON.stringify(res.data, null, 2), '\n');
            results.failed++;
        }
    } catch (err) {
        console.log('❌ FAIL: Staff login failed:', err.message, '\n');
        results.failed++;
    }

    // Test 5: Token Authentication (Protected endpoint)
    if (adminToken) {
        try {
            await delay(500); // Avoid rate limiting
            console.log('Test 5: Admin Protected Endpoint Access');
            const res = await makeRequest('GET', '/api/admin/staff', null, adminToken);
            
            if (res.status === 200 && res.data.success) {
                console.log(`✅ PASS: Admin can access protected endpoints\n`);
                results.passed++;
            } else {
                console.log('❌ FAIL: Admin cannot access protected endpoints\n');
                results.failed++;
            }
        } catch (err) {
            console.log('❌ FAIL: Admin protected endpoint failed:', err.message, '\n');
            results.failed++;
        }
    } else {
        console.log('⏭️  SKIP: Test 5 (no admin token)\n');
    }

    // Test 6: Token Booking (Public endpoint)
    try {
        await delay(1000); // Avoid rate limiting
        console.log('Test 6: Customer Token Booking');
        const res = await makeRequest('POST', '/api/customer/token/book', {
            staff_id: 1,
            customer_name: 'Test Customer',
            customer_phone: '1234567890'
        });
        
        if ((res.status === 200 || res.status === 201) && res.data.success && res.data.token) {
            console.log('✅ PASS: Token booking successful');
            console.log(`   Token Number: ${res.data.token.token_number}`);
            console.log(`   Staff ID: ${res.data.token.staff_id}\n`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Token booking failed');
            console.log('   Response:', JSON.stringify(res.data, null, 2), '\n');
            results.failed++;
        }
    } catch (err) {
        console.log('❌ FAIL: Token booking failed:', err.message, '\n');
        results.failed++;
    }

    // Test 7: Staff Queue Status
    if (staffToken) {
        try {
            await delay(500); // Avoid rate limiting
            console.log('Test 7: Staff Queue Status');
            const res = await makeRequest('GET', '/api/staff/queue', null, staffToken);
            
            if (res.status === 200 && res.data.success) {
                console.log('✅ PASS: Staff can view queue status');
                console.log(`   Current Token: ${res.data.queue.current_serving_token || 'None'}`);
                console.log(`   Waiting: ${res.data.queue.waiting_tokens.length}\n`);
                results.passed++;
            } else {
                console.log('❌ FAIL: Staff queue status failed\n');
                results.failed++;
            }
        } catch (err) {
            console.log('❌ FAIL: Staff queue status failed:', err.message, '\n');
            results.failed++;
        }
    } else {
        console.log('⏭️  SKIP: Test 7 (no staff token)\n');
    }

    // Final Results
    console.log('==================================================');
    console.log('Test Results Summary');
    console.log('==================================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);

    if (results.failed === 0) {
        console.log('🎉 All tests passed! The application is working correctly.\n');
        console.log('You can now access:');
        console.log('   Customer Portal: http://localhost:3000');
        console.log('   Staff/Admin Login: http://localhost:3000/login.html\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.\n');
        process.exit(1);
    }
}

console.log('Starting tests in 2 seconds...\n');
setTimeout(runTests, 2000);
