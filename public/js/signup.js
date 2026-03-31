// Customer Signup JS
const API_URL = 'http://localhost:3000/api';

document.getElementById('customerSignupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    if (!name || !phone || !password) {
        alert('Please fill in all fields');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/auth/customer/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');
        alert('Signup successful! You can now login.');
        globalThis.location.href = 'login.html';
    } catch (error) {
        alert(error.message || 'Signup failed');
    }
});
