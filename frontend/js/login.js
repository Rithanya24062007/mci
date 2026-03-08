// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded - JavaScript is running');
    
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }
    
    console.log('Login form found, attaching event listener');
    
    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const loginBtn = document.getElementById('loginBtn');
        const btnSpan = loginBtn.querySelector('span');
        
        // Clear previous errors
        errorMessage.classList.add('hidden');
        if (errorText) {
            errorText.textContent = '';
        }
        
        // Disable login button
        loginBtn.disabled = true;
        if (btnSpan) {
            btnSpan.textContent = 'Signing in...';
        } else {
            loginBtn.textContent = 'Signing in...';
        }
        
        console.log('Attempting login with:', email);
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            console.log('Login response:', data);
            
            if (response.ok) {
                // Store token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId.toString());
                localStorage.setItem('userName', data.name);
                
                if (data.staffId) {
                    localStorage.setItem('staffId', data.staffId.toString());
                }
                
                console.log('Stored to localStorage successfully');
                
                // Small delay to ensure localStorage is written
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Redirect based on role
                if (data.role === 'admin') {
                    console.log('Redirecting to admin dashboard...');
                    window.location.href = 'admin-dashboard.html';
                } else if (data.role === 'staff') {
                    console.log('Redirecting to staff dashboard...');
                    window.location.href = 'staff-dashboard.html';
                } else {
                    console.error('Unknown role:', data.role);
                    const msg = 'Invalid user role. Please contact administrator.';
                    if (errorText) {
                        errorText.textContent = msg;
                    } else {
                        errorMessage.textContent = msg;
                    }
                    errorMessage.classList.remove('hidden');
                    loginBtn.disabled = false;
                    if (btnSpan) {
                        btnSpan.textContent = 'Sign In to Dashboard';
                    }
                }
            } else {
                // Show error message
                const msg = data.error || 'Login failed. Please try again.';
                console.error('Login failed:', msg);
                if (errorText) {
                    errorText.textContent = msg;
                } else {
                    errorMessage.textContent = msg;
                }
                errorMessage.classList.remove('hidden');
                
                // Re-enable button
                loginBtn.disabled = false;
                if (btnSpan) {
                    btnSpan.textContent = 'Sign In to Dashboard';
                } else {
                    loginBtn.textContent = 'Sign In to Dashboard';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            const msg = 'Network error. Please check your connection and try again.';
            if (errorText) {
                errorText.textContent = msg;
            } else {
                errorMessage.textContent = msg;
            }
            errorMessage.classList.remove('hidden');
            
            // Re-enable button
            loginBtn.disabled = false;
            if (btnSpan) {
                btnSpan.textContent = 'Sign In to Dashboard';
            } else {
                loginBtn.textContent = 'Sign In to Dashboard';
            }
        }
    });
});
