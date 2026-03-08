const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', req.path.endsWith('.html') ? req.path : 'index.html'));
});

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('✓ Frontend server is running!');
    console.log('='.repeat(60));
    console.log('');
    console.log('  Open these URLs in your browser:');
    console.log('');
    console.log('  Public Display:     http://localhost:8080/');
    console.log('  Staff/Admin Login:  http://localhost:8080/login.html');
    console.log('  Customer Portal:    http://localhost:8080/customer-auth.html');
    console.log('  Test Login Page:    http://localhost:8080/test-login.html');
    console.log('');
    console.log('='.repeat(60));
    console.log('  Backend API is on:  http://localhost:3000');
    console.log('='.repeat(60));
});
