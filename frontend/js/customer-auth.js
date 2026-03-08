// API Configuration
const API_BASE_URL = 'http://localhost:3000/customer';

// Clear session on page load
document.addEventListener('DOMContentLoaded', () => {
    // Clear customer session when visiting auth page
    localStorage.removeItem('customerAuthToken');
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerPhone');
    localStorage.removeItem('queueTokenNumber');
    localStorage.removeItem('customerStaffId');
    localStorage.removeItem('customerStaffName');
});

// Helper: show error
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    const textEl = document.getElementById(elementId + 'Text');
    if (textEl) textEl.textContent = message;
    else el.textContent = message;
    el.classList.add('visible');
    el.classList.remove('hidden');
}

// Helper: hide error
function hideError(elementId) {
    const el = document.getElementById(elementId);
    el.classList.remove('visible');
    el.classList.add('hidden');
}

// Tab switching
document.getElementById('tabLogin').addEventListener('click', () => {
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Welcome back';
    document.getElementById('formSubtitle').textContent = 'Sign in to your account to continue';
    hideError('loginError');
    hideError('registerError');
});

document.getElementById('tabRegister').addEventListener('click', () => {
    document.getElementById('tabRegister').classList.add('active');
    document.getElementById('tabLogin').classList.remove('active');
    document.getElementById('registerForm').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Create an account';
    document.getElementById('formSubtitle').textContent = 'Get started with your free account today';
    hideError('loginError');
    hideError('registerError');
});

// Handle login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    hideError('loginError');
    loginBtn.disabled = true;
    loginBtn.querySelector('span').textContent = 'Signing in...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store customer info
            localStorage.setItem('customerAuthToken', data.token);
            localStorage.setItem('customerId', data.customer.id);
            localStorage.setItem('customerName', data.customer.name);
            localStorage.setItem('customerPhone', data.customer.phone);
            
            // Redirect to customer portal
            window.location.href = 'index.html';
        } else {
            showError('loginError', data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Network error. Please check your connection.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.querySelector('span').textContent = 'Sign In';
    }
});

// Handle registration form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    hideError('registerError');
    
    // Validate phone
    if (!/^[0-9]{10}$/.test(phone)) {
        showError('registerError', 'Please enter a valid 10-digit phone number');
        return;
    }
    
    // Validate password
    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters');
        return;
    }
    
    registerBtn.disabled = true;
    registerBtn.querySelector('span').textContent = 'Creating account...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                phone, 
                email: email || undefined, 
                password 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store customer info
            localStorage.setItem('customerAuthToken', data.token);
            localStorage.setItem('customerId', data.customer.id);
            localStorage.setItem('customerName', data.customer.name);
            localStorage.setItem('customerPhone', data.customer.phone);
            
            // Redirect to customer portal
            window.location.href = 'index.html';
        } else {
            showError('registerError', data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerError', 'Network error. Please check your connection.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.querySelector('span').textContent = 'Create Account';
    }
});
