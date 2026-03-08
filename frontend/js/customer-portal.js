// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Global state
let selectedStaffId = null;
let selectedStaffName = null;
let currentToken = null;
let pollingInterval = null;
let isLoggedIn = false;
let customerId = null;
let customerName = null;
let customerPhone = null;

// Load active staff on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if customer is logged in
    const authToken = localStorage.getItem('customerAuthToken');
    customerId = localStorage.getItem('customerId');
    customerName = localStorage.getItem('customerName');
    customerPhone = localStorage.getItem('customerPhone');
    
    // Redirect to auth page if not logged in
    if (!authToken || !customerId) {
        window.location.href = 'customer-auth.html';
        return;
    }
    
    isLoggedIn = true;
    updateAuthUI();
    
    // Check if there's a saved queue token number in localStorage
    const savedQueueToken = localStorage.getItem('queueTokenNumber');
    const savedStaffId = localStorage.getItem('customerStaffId');
    const savedStaffName = localStorage.getItem('customerStaffName');
    
    if (savedQueueToken && savedStaffId) {
        // Resume token display from localStorage
        selectedStaffId = parseInt(savedStaffId);
        selectedStaffName = savedStaffName;
        currentToken = parseInt(savedQueueToken);
        showTokenDisplay();
    } else {
        // Check if customer has an active token in the database
        checkForActiveToken();
    }
});

// Update UI based on login status
function updateAuthUI() {
    const welcomeElement = document.getElementById('customerWelcome');
    const authLink = document.getElementById('authLink');
    
    if (isLoggedIn && customerName) {
        welcomeElement.textContent = `Welcome, ${customerName}!`;
        welcomeElement.style.display = 'inline';
        authLink.textContent = 'Logout';
        authLink.href = '#';
        authLink.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    } else {
        welcomeElement.style.display = 'none';
        authLink.textContent = 'Login / Register';
        authLink.href = 'customer-auth.html';
        authLink.onclick = null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('customerAuthToken');
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerPhone');
    localStorage.removeItem('queueTokenNumber');
    localStorage.removeItem('customerStaffId');
    localStorage.removeItem('customerStaffName');
    window.location.reload();
}

// Check for active token in database
async function checkForActiveToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/customer/${customerId}/active-token`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.hasActiveToken) {
                // Restore active token
                selectedStaffId = data.staffId;
                selectedStaffName = data.staffName;
                currentToken = data.tokenNumber;
                
                // Save to localStorage
                localStorage.setItem('queueTokenNumber', currentToken);
                localStorage.setItem('customerStaffId', selectedStaffId);
                localStorage.setItem('customerStaffName', selectedStaffName);
                
                // Show token display
                showTokenDisplay();
            } else {
                // No active token, show staff selection
                loadActiveStaff();
            }
        } else {
            loadActiveStaff();
        }
    } catch (error) {
        console.error('Error checking for active token:', error);
        loadActiveStaff();
    }
}

// Load active staff members
async function loadActiveStaff() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/staff/active`);
        
        if (response.ok) {
            const data = await response.json();
            displayStaffGrid(data.staff);
        } else {
            showError('Unable to load counters. Please try again later.');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        showError('Connection error. Please check your internet connection.');
    }
}

// Display staff grid
function displayStaffGrid(staff) {
    const staffGrid = document.getElementById('staffGrid');
    
    if (staff.length === 0) {
        staffGrid.innerHTML = `
            <div class="loading-state" style="border-style:dashed;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="width:36px;height:36px;color:#cbd5e1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                </svg>
                <p>No counters available at the moment</p>
                <p style="font-size:12px;color:#94a3b8;">Please check back later or contact admin</p>
            </div>
        `;
        return;
    }
    
    staffGrid.innerHTML = staff.map(s => `
        <div class="staff-card" onclick="selectStaff(${s.id}, '${s.counter_name}', '${s.name}')">
            <div class="staff-card-top">
                <div class="staff-avatar">${(s.counter_name || 'C').charAt(0).toUpperCase()}</div>
                <div class="staff-info">
                    <h3>${s.counter_name}</h3>
                    <p>${s.name}</p>
                </div>
            </div>
            <div class="staff-card-meta">
                <span class="meta-chip active-chip">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;color:#16a34a"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>
                    Active
                </span>
                <span class="meta-chip">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                    ${s.waiting_count || 0} waiting
                </span>
            </div>
            <div class="staff-card-footer">
                <span style="font-size:12.5px;color:#64748b;">Serving: <strong style="color:#0f172a">${s.current_serving_token || '--'}</strong></span>
                <button class="select-counter-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                    Select
                </button>
            </div>
        </div>
    `).join('');
}

// Select staff
function selectStaff(staffId, counterName, staffName) {
    selectedStaffId = staffId;
    selectedStaffName = counterName;
    
    document.getElementById('selectedStaffName').textContent = staffName;
    document.getElementById('staffSelectionSection').style.display = 'none';
    document.getElementById('bookingSection').style.display = 'block';
    
    // Auto-fill customer details (always logged in)
    document.getElementById('customerName').value = customerName;
    document.getElementById('customerPhone').value = customerPhone;
    document.getElementById('customerName').readOnly = true;
    document.getElementById('customerPhone').readOnly = true;
    
    // Load current queue info
    loadQueueInfo();
    
    // Start polling
    pollingInterval = setInterval(loadQueueInfo, 3000);
}

// Load queue information for selected staff
async function loadQueueInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/public/staff/${selectedStaffId}/queue-info`);
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('currentServingToken').textContent = data.currentServingToken || '--';
            document.getElementById('waitingCount').textContent = data.waitingCount || 0;
        }
    } catch (error) {
        console.error('Error loading queue info:', error);
    }
}

// Book token form
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate phone number
    if (!customerName || !customerPhone) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (!/^[0-9]{10}$/.test(customerPhone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/public/token/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                staffId: selectedStaffId,
                customerName: customerName,
                customerPhone: customerPhone,
                customerId: parseInt(customerId)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentToken = data.tokenNumber;
            
            // Save to localStorage
            localStorage.setItem('queueTokenNumber', currentToken);
            localStorage.setItem('customerStaffId', selectedStaffId);
            localStorage.setItem('customerStaffName', selectedStaffName);
            
            // Clear polling for booking section
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
            
            // Show token display
            showTokenDisplay();
        } else {
            alert(data.error || 'Failed to book token. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Get Token';
        }
    } catch (error) {
        console.error('Error booking token:', error);
        alert('Connection error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get Token';
    }
});

// Show token display
function showTokenDisplay() {
    document.getElementById('staffSelectionSection').style.display = 'none';
    document.getElementById('bookingSection').style.display = 'none';
    document.getElementById('tokenDisplaySection').style.display = 'block';
    
    document.getElementById('yourTokenNumber').textContent = currentToken;
    document.getElementById('tokenStaffName').textContent = selectedStaffName;
    
    // Start polling for status
    updateTokenStatus();
    pollingInterval = setInterval(updateTokenStatus, 3000);
}

// Update token status
async function updateTokenStatus() {
    try {
        // First check if token is completed
        const statusResponse = await fetch(`${API_BASE_URL}/public/staff/${selectedStaffId}/token/${currentToken}/status`);
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            // If token is completed, show completion message and stop polling
            if (statusData.status === 'completed') {
                showCompletedStatus(statusData.completedAt);
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                return;
            }
        }
        
        // Otherwise, get queue info and update status
        const response = await fetch(`${API_BASE_URL}/public/staff/${selectedStaffId}/queue-info`);
        
        if (response.ok) {
            const data = await response.json();
            const currentServing = data.currentServingToken || 0;
            const waitingCount = data.waitingCount || 0;
            
            document.getElementById('displayCurrentServing').textContent = currentServing;
            
            // Calculate difference: positive means ahead, 0 means your turn, negative means passed
            const difference = currentToken - currentServing;
            const tokensAhead = Math.max(0, difference - 1); // tokens between current and yours
            
            document.getElementById('tokensAhead').textContent = tokensAhead;
            
            // Calculate and display estimated time
            updateEstimatedTime(tokensAhead);
            
            // Update status based on difference
            updateStatusDisplay(difference, tokensAhead);
        }
    } catch (error) {
        console.error('Error updating token status:', error);
    }
}

// Update estimated time
function updateEstimatedTime(tokensAhead) {
    const estimatedTimeElement = document.getElementById('estimatedTime');
    if (!estimatedTimeElement) return;
    
    if (tokensAhead === 0) {
        estimatedTimeElement.textContent = 'Your turn now!';
        estimatedTimeElement.style.color = '#16a34a';
    } else {
        // Assume 3-5 minutes per token (average 4 minutes)
        const avgTimePerToken = 4; // minutes
        const estimatedMinutes = tokensAhead * avgTimePerToken;
        
        if (estimatedMinutes < 5) {
            estimatedTimeElement.textContent = 'Less than 5 minutes';
        } else if (estimatedMinutes < 60) {
            estimatedTimeElement.textContent = `~${estimatedMinutes} minutes`;
        } else {
            const hours = Math.floor(estimatedMinutes / 60);
            const mins = estimatedMinutes % 60;
            estimatedTimeElement.textContent = `~${hours}h ${mins}m`;
        }
        estimatedTimeElement.style.color = '#64748b';
    }
}

// Update status display based on difference
function updateStatusDisplay(difference, tokensAhead) {
    const statusElement = document.getElementById('tokenStatus');
    
    // Your turn RIGHT NOW
    if (difference <= 0) {
        statusElement.innerHTML = `
            <div class="token-status-box serving">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <div>
                    <div class="token-status-title">🎉 It's Your Turn!</div>
                    <div class="token-status-msg" id="statusMessage">Please proceed to ${selectedStaffName} now</div>
                </div>
            </div>
        `;
        playNotificationSound();
        
    // Next in line (1-2 tokens ahead)
    } else if (tokensAhead <= 1) {
        statusElement.innerHTML = `
            <div class="token-status-box" style="background:rgba(29,78,216,.07);border:1px solid rgba(29,78,216,.2);">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;color:#1d4ed8;flex-shrink:0;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <div>
                    <div class="token-status-title">⚡ You're Next!</div>
                    <div class="token-status-msg" id="statusMessage">Please get ready and stay near the counter</div>
                </div>
            </div>
        `;
        
    // Still waiting (3+ tokens ahead)
    } else {
        statusElement.innerHTML = `
            <div class="token-status-box waiting">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                    <div class="token-status-title">Please Wait</div>
                    <div class="token-status-msg" id="statusMessage">${tokensAhead} token${tokensAhead !== 1 ? 's' : ''} ahead of you</div>
                </div>
            </div>
        `;
    }
}

// Show completed status
function showCompletedStatus(completedAt) {
    const statusElement = document.getElementById('tokenStatus');
    const estimatedTimeElement = document.getElementById('estimatedTime');
    
    // Format completion time
    let timeText = 'just now';
    if (completedAt) {
        const completedDate = new Date(completedAt);
        const now = new Date();
        const diffMinutes = Math.floor((now - completedDate) / (1000 * 60));
        
        if (diffMinutes < 1) {
            timeText = 'just now';
        } else if (diffMinutes < 60) {
            timeText = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            timeText = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
    }
    
    statusElement.innerHTML = `
        <div class="token-status-box" style="background:rgba(22,163,74,.07);border:1px solid rgba(22,163,74,.2);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;color:#16a34a;flex-shrink:0;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
                <div class="token-status-title">✅ Service Completed</div>
                <div class="token-status-msg" id="statusMessage">Your service was completed ${timeText}</div>
            </div>
        </div>
    `;
    
    // Update estimated time
    if (estimatedTimeElement) {
        estimatedTimeElement.textContent = 'Completed';
        estimatedTimeElement.style.color = '#16a34a';
    }
    
    // Update tokens ahead
    document.getElementById('tokensAhead').textContent = '0';
}

// Play notification sound
function playNotificationSound() {
    // Simple beep using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio notification not supported');
    }
}

// Back button
document.getElementById('backBtn').addEventListener('click', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    selectedStaffId = null;
    selectedStaffName = null;
    
    document.getElementById('bookingSection').style.display = 'none';
    document.getElementById('staffSelectionSection').style.display = 'block';
    document.getElementById('customerName').value = '';
    
    loadActiveStaff();
});

// Cancel token button
document.getElementById('cancelTokenBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel your token?')) {
        clearTokenData();
        resetToStaffSelection();
    }
});

// New token button
document.getElementById('newTokenBtn').addEventListener('click', () => {
    clearTokenData();
    resetToStaffSelection();
});

// Clear token data
function clearTokenData() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerStaffId');
    localStorage.removeItem('customerStaffName');
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    currentToken = null;
    selectedStaffId = null;
    selectedStaffName = null;
}

// Reset to staff selection
function resetToStaffSelection() {
    document.getElementById('tokenDisplaySection').style.display = 'none';
    document.getElementById('bookingSection').style.display = 'none';
    document.getElementById('staffSelectionSection').style.display = 'block';
    
    loadActiveStaff();
}

// Show error message
function showError(message) {
    const staffGrid = document.getElementById('staffGrid');
    staffGrid.innerHTML = `
        <div class="loading-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="width:36px;height:36px;color:#dc2626">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p style="color:#b91c1c;font-weight:600;">${message}</p>
            <button onclick="loadActiveStaff()" style="margin-top:6px;padding:7px 18px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-family:Inter,sans-serif;font-size:13px;font-weight:600;cursor:pointer;">Retry</button>
        </div>
    `;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
