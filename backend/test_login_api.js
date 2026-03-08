const fetch = require('node-fetch');

async function testLogin() {
    console.log('Testing admin login via API...\n');
    
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@queuepro.com',
                password: 'admin123'
            })
        });
        
        console.log('Response Status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('\n✓ LOGIN SUCCESSFUL!');
            console.log('Token:', data.token);
            console.log('Role:', data.role);
            console.log('Name:', data.name);
        } else {
            console.log('\n✗ LOGIN FAILED!');
            console.log('Error:', data.error);
        }
        
    } catch (error) {
        console.error('\n✗ CONNECTION ERROR!');
        console.error('Error:', error.message);
        console.error('\nIs the backend server running?');
        console.error('Run: cd backend && npm start');
    }
}

testLogin();
