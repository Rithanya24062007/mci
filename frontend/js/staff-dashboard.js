// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Global state
let staffId = null;
let currentServingToken = null;
let pollingInterval = null;
let liveTrackingInterval = null;
let isTrackingEnabled = false;

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    staffId = localStorage.getItem('staffId');
    
    if (!token || role !== 'staff' || !staffId) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display staff name
    const staffName = localStorage.getItem('userName');
    document.getElementById('staffName').textContent = staffName || 'Staff';
    
    // Check if live tracking is enabled
    checkLiveTracking();
    
    // Load initial data
    loadQueueData();
    
    // Start polling every 3 seconds
    pollingInterval = setInterval(loadQueueData, 3000);
});

// Check if live tracking is enabled for this staff
async function checkLiveTracking() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/tracking-status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            isTrackingEnabled = data.liveTrackingEnabled;
            
            if (isTrackingEnabled) {
                document.getElementById('liveTrackingSection').style.display = 'block';
                startLiveTrackingPolling();
            }
        }
    } catch (error) {
        console.error('Error checking tracking status:', error);
    }
}

// Start polling for live tracking data
function startLiveTrackingPolling() {
    loadLiveTrackingData();
    liveTrackingInterval = setInterval(loadLiveTrackingData, 3000);
}

// Load live tracking data
async function loadLiveTrackingData() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/live-data`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.latestReading) {
                document.getElementById('sensorValue').textContent = data.latestReading.sensor_value;
                const lastUpdate = new Date(data.latestReading.timestamp).toLocaleTimeString();
                document.getElementById('lastUpdate').textContent = lastUpdate;
            }
        }
    } catch (error) {
        console.error('Error loading live tracking data:', error);
    }
}

// Load queue data
async function loadQueueData() {
    try {
        const response = await fetch(`${API_BASE_URL}/staff/queue`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateQueueDisplay(data);
        } else {
            console.error('Failed to load queue data');
        }
    } catch (error) {
        console.error('Error loading queue data:', error);
    }
}

// Update queue display
function updateQueueDisplay(data) {
    // Update current serving token
    currentServingToken = data.currentServingToken;
    document.getElementById('currentToken').textContent = currentServingToken != null ? currentServingToken : '---';
    
    // Update stats
    document.getElementById('totalWaiting').textContent = data.waitingTokens.length;
    document.getElementById('totalCompleted').textContent = data.completedToday || 0;
    
    // Update queue list
    const queueList = document.getElementById('queueList');
    
    if (data.waitingTokens.length === 0) {
        queueList.innerHTML = '<p class="empty-state">No tokens in queue</p>';
    } else {
        queueList.innerHTML = data.waitingTokens.map(token => {
            const bookingTime = new Date(token.created_at).toLocaleTimeString();
            return `
                <div class="queue-item">
                    <div class="queue-token">
                        <span class="token-badge">${token.token_number}</span>
                        <div class="customer-info">
                            <span class="customer-name">${token.customer_name || 'Anonymous'}</span>
                            ${token.customer_phone ? `<span class="customer-phone">📱 ${token.customer_phone}</span>` : ''}
                        </div>
                    </div>
                    <div class="queue-time">${bookingTime}</div>
                </div>
            `;
        }).join('');
    }
}

// Next Token Button
document.getElementById('nextBtn').addEventListener('click', async () => {
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    nextBtn.textContent = 'Processing...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff/next`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Immediately update the display
            loadQueueData();
        } else {
            alert(data.error || 'Failed to move to next token');
        }
    } catch (error) {
        console.error('Error moving to next token:', error);
        alert('Error processing request');
    } finally {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Next Token';
    }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Clear intervals
    if (pollingInterval) clearInterval(pollingInterval);
    if (liveTrackingInterval) clearInterval(liveTrackingInterval);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('staffId');
    
    window.location.href = 'login.html';
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (liveTrackingInterval) clearInterval(liveTrackingInterval);
});
