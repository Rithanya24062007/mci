// API Base URL
const API_URL = 'http://localhost:3000/api';


// Load staff members into dropdown for booking
async function loadStaffMembers() {
    const response = await fetch(`${API_URL}/staff`);
    const data = await response.json();
    if (!data.success) throw new Error('Failed to load staff');
    const selectElement = document.getElementById('staffSelect');
    selectElement.innerHTML = '<option value="">-- Select Staff --</option>';
    data.staff.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = `${staff.name} - ${staff.department}`;
        selectElement.appendChild(option);
    });
}
if (document.getElementById('staffSelect')) {
    loadStaffMembers().catch(() => alert('Failed to load staff members'));
}


// Customer Login (with password)
document.getElementById('customerLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    if (!phone || !password) {
        alert('Please fill in all fields');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/auth/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        globalThis.location.href = 'customer-dashboard.html';
    } catch (error) {
        alert(error.message || 'Login failed');
    }
});

// Staff Login
document.getElementById('staffLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const staffId = document.getElementById('staffId').value;
    const password = document.getElementById('staffPassword').value;

    if (!staffId || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ staffId, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store JWT token and user info
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));

        // Redirect to staff dashboard
        globalThis.location.href = 'staff-dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Invalid credentials. Please try again.');
    }
});

// Update queue count from server
async function updateQueueCount() {
    try {
        const response = await fetch(`${API_URL}/queue/count`);
        const data = await response.json();
        document.getElementById('queueCount').textContent = data.count;
    } catch (error) {
        console.error('Error fetching queue count:', error);
    }
}

// Initialize on page load
updateQueueCount();
setInterval(updateQueueCount, 3000); // Update every 3 seconds
