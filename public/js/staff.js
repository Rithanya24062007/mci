// API Base URL
const API_URL = 'http://localhost:3000/api';

// Get auth token
function getToken() {
    return sessionStorage.getItem('token');
}

// Get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// Check if user is logged in as staff
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const token = getToken();
    
    if (!currentUser || !token || currentUser.type !== 'staff') {
        globalThis.location.href = 'login.html';
        return null;
    }
    return currentUser;
}

// Logout function
function logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    globalThis.location.href = 'login.html';
}

// Get staff appointments
async function getStaffAppointments(staffId) {
    try {
        const response = await fetch(`${API_URL}/tokens/staff/${staffId}`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch appointments');
        }
        
        return data.tokens;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
}

// Display current serving token
async function displayCurrentServing(staffId) {
    try {
        const appointments = await getStaffAppointments(staffId);
        const servingToken = appointments.find(t => t.status === 'called');

        const servingDiv = document.getElementById('currentServingToken');

        if (servingToken) {
            servingDiv.innerHTML = `
                <h3>Token #${servingToken.token_number}</h3>
                <p><strong>Customer:</strong> ${servingToken.customer_name}</p>
                <p><strong>Phone:</strong> ${servingToken.customer_phone}</p>
                <p><strong>Purpose:</strong> ${servingToken.purpose || 'Not specified'}</p>
                <button onclick="completeToken(${servingToken.id})" class="btn-success" style="margin-top: 15px;">Complete Service</button>
            `;
        } else {
            servingDiv.innerHTML = '<p>No active token. Click "Call Next Token" to serve the next customer.</p>';
        }
    } catch (error) {
        console.error('Error displaying current serving:', error);
    }
}

// Call next token
async function callNextToken() {
    const user = checkAuth();
    
    try {
        const response = await fetch(`${API_URL}/tokens/call-next/${user.id}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to call next token');
        }

        loadStaffDashboard();
    } catch (error) {
        console.error('Error calling next token:', error);
        alert(error.message || 'No waiting tokens available');
    }
}

// Complete token
async function completeToken(tokenId) {
    if (!confirm('Mark this token as completed?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tokens/${tokenId}/complete`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to complete token');
        }

        loadStaffDashboard();
    } catch (error) {
        console.error('Error completing token:', error);
        alert(error.message || 'Failed to complete token');
    }
}

// Filter tokens
let currentFilter = 'all';

function filterTokens(filter) {
    currentFilter = filter;
    
    // Update button states
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadAppointmentsList();
}

// Load appointments list
async function loadAppointmentsList() {
    const user = checkAuth();
    const appointments = await getStaffAppointments(user.id);
    
    let filteredAppointments = appointments;
    
    if (currentFilter === 'waiting') {
        filteredAppointments = appointments.filter(t => t.status === 'waiting');
    } else if (currentFilter === 'called') {
        filteredAppointments = appointments.filter(t => t.status === 'called');
    } else {
        // Show all except completed
        filteredAppointments = appointments.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    }

    const listDiv = document.getElementById('appointmentsList');

    if (filteredAppointments.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No appointments found.</p>';
        return;
    }

    listDiv.innerHTML = filteredAppointments.map(token => `
        <div class="appointment-card">
            <div class="appointment-info">
                <h4>Token #${token.token_number}</h4>
                <p><strong>Customer:</strong> ${token.customer_name}</p>
                <p><strong>Phone:</strong> ${token.customer_phone}</p>
                <p><strong>Purpose:</strong> ${token.purpose || 'Not specified'}</p>
                <p><strong>Status:</strong> <span style="color: ${
                    token.status === 'waiting' ? '#ffc107' : 
                    token.status === 'called' ? '#28a745' : '#6c757d'
                }; font-weight: 600;">${token.status.toUpperCase()}</span></p>
                <p><strong>Booked at:</strong> ${new Date(token.created_at).toLocaleTimeString()}</p>
            </div>
            <div class="appointment-actions">
                ${token.status === 'waiting' ? 
                    `<button onclick="callSpecificToken(${token.id})" class="btn-primary">Call Now</button>` : 
                    token.status === 'called' ? 
                    `<button onclick="completeToken(${token.id})" class="btn-success">Complete</button>` : 
                    ''
                }
            </div>
        </div>
    `).join('');
}

// Call specific token
async function callSpecificToken(tokenId) {
    const user = checkAuth();
    
    try {
        const response = await fetch(`${API_URL}/tokens/${tokenId}/call`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ staffId: user.id })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to call token');
        }

        loadStaffDashboard();
    } catch (error) {
        console.error('Error calling token:', error);
        alert(error.message || 'Failed to call token');
    }
}

// Update statistics
async function updateStatistics(staffId) {
    try {
        const appointments = await getStaffAppointments(staffId);
        
        const pending = appointments.filter(t => t.status === 'waiting' || t.status === 'called').length;
        const completed = appointments.filter(t => t.status === 'completed').length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('completedCount').textContent = completed;

        // Get queue count from server
        const response = await fetch(`${API_URL}/queue/count`);
        const data = await response.json();
        document.getElementById('queueCount').textContent = data.count;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Load staff dashboard
async function loadStaffDashboard() {
    const user = checkAuth();
    await displayCurrentServing(user.id);
    await loadAppointmentsList();
    await updateStatistics(user.id);
}

// Initialize page
const currentUser = checkAuth();
if (currentUser) {
    document.getElementById('staffNameDisplay').textContent = `${currentUser.name} (${currentUser.department})`;
    loadStaffDashboard();
    
    // Auto-refresh every 5 seconds
    setInterval(() => {
        loadStaffDashboard();
    }, 5000);
}
