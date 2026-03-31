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

// Check if user is logged in
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const token = getToken();
    
    if (!currentUser || !token || currentUser.type !== 'customer') {
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

// Load staff members into dropdown
async function loadStaffMembers() {
    try {
        const response = await fetch(`${API_URL}/staff`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to load staff');
        }
        
        const selectElement = document.getElementById('staffSelect');
        selectElement.innerHTML = '<option value="">-- Select Staff --</option>';
        
        data.staff.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = `${staff.name} - ${staff.department}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading staff:', error);
        alert('Failed to load staff members');
    }
}

// Display current token if exists
async function displayCurrentToken(user) {
    try {
        const response = await fetch(`${API_URL}/tokens/my-token`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Failed to fetch token');
        }
        
        if (data.token) {
            // Show current token section
            document.getElementById('currentTokenSection').style.display = 'block';
            document.getElementById('bookingFormSection').style.display = 'none';

            // Fill in token details
            const token = data.token;
            document.getElementById('currentTokenNumber').textContent = token.token_number;
            document.getElementById('tokenStaff').textContent = token.staff_name;
            document.getElementById('peopleAhead').textContent = token.people_ahead;
            document.getElementById('estimatedTime').textContent = token.estimated_wait;
            document.getElementById('tokenStatus').textContent = token.status.toUpperCase();
            document.getElementById('tokenStatus').style.background = 
                token.status === 'called' ? 'rgba(40, 167, 69, 0.8)' : 'rgba(255, 193, 7, 0.8)';
            
            // Store token ID for cancellation
            document.getElementById('currentTokenSection').dataset.tokenId = token.id;
        } else {
            // Show booking form
            document.getElementById('currentTokenSection').style.display = 'none';
            document.getElementById('bookingFormSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching token:', error);
        // Show booking form on error
        document.getElementById('currentTokenSection').style.display = 'none';
        document.getElementById('bookingFormSection').style.display = 'block';
    }
}

// Cancel token
async function cancelToken() {
    if (!confirm('Are you sure you want to cancel your token?')) {
        return;
    }

    try {
        const tokenId = document.getElementById('currentTokenSection').dataset.tokenId;
        
        const response = await fetch(`${API_URL}/tokens/${tokenId}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to cancel token');
        }

        alert('Token cancelled successfully');
        location.reload();
    } catch (error) {
        console.error('Error cancelling token:', error);
        alert(error.message || 'Failed to cancel token');
    }
}

// Update queue information
async function updateQueueInfo() {
    try {
        // Get queue count from server
        const queueResponse = await fetch(`${API_URL}/queue/count`);
        const queueData = await queueResponse.json();
        document.getElementById('currentQueue').textContent = queueData.count;

        // Get today's statistics
        const statsResponse = await fetch(`${API_URL}/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            document.getElementById('totalTokens').textContent = statsData.stats.total;
        }
    } catch (error) {
        console.error('Error fetching queue info:', error);
    }
}

// Book token form submission
document.getElementById('tokenBookingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const staffId = document.getElementById('staffSelect').value;
    const purpose = document.getElementById('purpose').value;

    if (!staffId) {
        alert('Please select a staff member');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tokens`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ staffId, purpose })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to book token');
        }

        alert(`Token #${data.token.token_number} booked successfully!`);
        location.reload();
    } catch (error) {
        console.error('Error booking token:', error);
        alert(error.message || 'Failed to book token');
    }
});

// Initialize page
const currentUser = checkAuth();
if (currentUser) {
    document.getElementById('customerNameDisplay').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('bookingName').value = currentUser.name;
    document.getElementById('bookingPhone').value = currentUser.phone;
    
    loadStaffMembers();
    displayCurrentToken(currentUser);
    updateQueueInfo();
    
    // Auto-refresh every 5 seconds
    setInterval(() => {
        displayCurrentToken(currentUser);
        updateQueueInfo();
    }, 5000);
}
