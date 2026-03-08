// API Configuration
const API_BASE_URL = 'http://localhost:3000/admin';

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log('Admin Dashboard - Checking auth:', {
        token: token ? 'present (length: ' + token.length + ')' : 'missing',
        role: role
    });
    
    if (!token || role !== 'admin') {
        console.error('Authentication failed - redirecting to login');
        console.log('Token exists:', !!token);
        console.log('Role is admin:', role === 'admin');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Authentication successful - loading dashboard');
    
    // Display admin name
    const adminName = localStorage.getItem('userName');
    document.getElementById('adminName').textContent = adminName || 'Admin';
    
    // Load initial data
    loadStaffList();
    loadStaffDropdown();
    loadCustomerList();
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('staffId');
    window.location.href = 'login.html';
});

// Create Staff Form
document.getElementById('createStaffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('staffName').value.trim();
    const counterName = document.getElementById('counterName').value.trim();
    const email = document.getElementById('staffEmail').value.trim();
    const password = document.getElementById('staffPassword').value;
    const messageDiv = document.getElementById('createStaffMessage');
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, counterName, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, 'success', 'Staff created successfully!');
            document.getElementById('createStaffForm').reset();
            loadStaffList();
            loadStaffDropdown();
        } else {
            showMessage(messageDiv, 'error', data.error || 'Failed to create staff');
        }
    } catch (error) {
        console.error('Error creating staff:', error);
        showMessage(messageDiv, 'error', 'Network error. Please try again.');
    }
});

// Load and display staff list
async function loadStaffList() {
    const tableBody = document.getElementById('staffTableBody');
    const messageDiv = document.getElementById('staffListMessage');
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff/list`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.staff) {
            if (data.staff.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No staff members found</td></tr>';
                return;
            }
            
            tableBody.innerHTML = data.staff.map(staff => `
                <tr>
                    <td>${staff.id}</td>
                    <td>${escapeHtml(staff.name)}</td>
                    <td><strong>${escapeHtml(staff.counter_name || 'N/A')}</strong></td>
                    <td>
                        <span class="status-badge ${staff.is_active ? 'status-active' : 'status-inactive'}">
                            ${staff.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${staff.live_tracking_enabled ? 'status-enabled' : 'status-disabled'}">
                            ${staff.live_tracking_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-primary" 
                                    onclick="openEditModal(${staff.id}, '${escapeHtml(staff.name)}', '${escapeHtml(staff.counter_name || '')}', '${escapeHtml(staff.email || '')}')">
                                Edit
                            </button>
                            <button class="btn-${staff.is_active ? 'danger' : 'success'}" 
                                    onclick="toggleStaffStatus(${staff.id}, ${staff.is_active})">
                                ${staff.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn-${staff.live_tracking_enabled ? 'danger' : 'success'}" 
                                    onclick="toggleLiveTracking(${staff.id}, ${staff.live_tracking_enabled})">
                                ${staff.live_tracking_enabled ? 'Disable' : 'Enable'} Tracking
                            </button>
                            <button class="btn-danger" 
                                    onclick="deleteStaff(${staff.id}, '${escapeHtml(staff.name)}')">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            showMessage(messageDiv, 'error', data.error || 'Failed to load staff list');
        }
    } catch (error) {
        console.error('Error loading staff list:', error);
        showMessage(messageDiv, 'error', 'Network error. Please try again.');
    }
}

// Toggle staff active status
async function toggleStaffStatus(staffId, currentStatus) {
    const messageDiv = document.getElementById('staffListMessage');
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ is_active: !currentStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, 'success', `Staff ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
            loadStaffList();
        } else {
            showMessage(messageDiv, 'error', data.error || 'Failed to update staff status');
        }
    } catch (error) {
        console.error('Error updating staff status:', error);
        showMessage(messageDiv, 'error', 'Network error. Please try again.');
    }
}

// Toggle live tracking
async function toggleLiveTracking(staffId, currentStatus) {
    const messageDiv = document.getElementById('staffListMessage');
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/toggle-tracking`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ live_tracking_enabled: !currentStatus })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, 'success', `Live tracking ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
            loadStaffList();
        } else {
            showMessage(messageDiv, 'error', data.error || 'Failed to update tracking status');
        }
    } catch (error) {
        console.error('Error updating tracking status:', error);
        showMessage(messageDiv, 'error', 'Network error. Please try again.');
    }
}

// Load staff dropdown for device mapping
async function loadStaffDropdown() {
    const select = document.getElementById('mappedStaffId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/staff/list`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.staff) {
            select.innerHTML = '<option value="">Select Staff</option>' + 
                data.staff
                    .filter(staff => staff.is_active)
                    .map(staff => `<option value="${staff.id}">${escapeHtml(staff.name)}</option>`)
                    .join('');
        }
    } catch (error) {
        console.error('Error loading staff dropdown:', error);
    }
}

// Device mapping form
document.getElementById('deviceMappingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deviceId = document.getElementById('deviceId').value.trim();
    const staffId = document.getElementById('mappedStaffId').value;
    const messageDiv = document.getElementById('deviceMappingMessage');
    
    if (!staffId) {
        showMessage(messageDiv, 'error', 'Please select a staff member');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/device/map`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                device_id: deviceId, 
                mapped_staff_id: parseInt(staffId) 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, 'success', 'Device mapped successfully!');
            document.getElementById('deviceMappingForm').reset();
        } else {
            showMessage(messageDiv, 'error', data.error || 'Failed to map device');
        }
    } catch (error) {
        console.error('Error mapping device:', error);
        showMessage(messageDiv, 'error', 'Network error. Please try again.');
    }
});

// Delete staff
async function deleteStaff(staffId, staffName) {
    if (!confirm(`Are you sure you want to delete staff member "${staffName}"? This action cannot be undone and will delete all associated data.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Staff deleted successfully');
            loadStaffList();
            loadStaffDropdown();
        } else {
            alert(data.error || 'Failed to delete staff');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Network error. Please try again.');
    }
}

// Open edit staff modal
function openEditModal(staffId, staffName, counterName, email) {
    document.getElementById('editStaffId').value = staffId;
    document.getElementById('editStaffName').value = staffName;
    document.getElementById('editCounterName').value = counterName;
    document.getElementById('editStaffEmail').value = email;
    document.getElementById('editStaffPassword').value = '';
    document.getElementById('editStaffMessage').classList.add('hidden');
    document.getElementById('editStaffModal').style.display = 'flex';
}

// Close edit staff modal
function closeEditModal() {
    document.getElementById('editStaffModal').style.display = 'none';
    document.getElementById('editStaffForm').reset();
}

// Handle edit staff form submission
document.getElementById('editStaffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const staffId = document.getElementById('editStaffId').value;
    const name = document.getElementById('editStaffName').value.trim();
    const counterName = document.getElementById('editCounterName').value.trim();
    const email = document.getElementById('editStaffEmail').value.trim();
    const password = document.getElementById('editStaffPassword').value.trim();
    
    const messageElement = document.getElementById('editStaffMessage');

    if (!name || !counterName || !email) {
        showMessage(messageElement, 'error', 'All fields except password are required');
        return;
    }

    const payload = { name, counterName, email };
    if (password) {
        payload.password = password;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/edit`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageElement, 'success', 'Staff updated successfully');
            setTimeout(() => {
                closeEditModal();
                loadStaffList();
            }, 1500);
        } else {
            showMessage(messageElement, 'error', data.error || 'Failed to update staff');
        }
    } catch (error) {
        console.error('Error updating staff:', error);
        showMessage(messageElement, 'error', 'Network error. Please try again.');
    }
});

// Refresh staff list button
document.getElementById('refreshStaffBtn').addEventListener('click', () => {
    loadStaffList();
});

// Utility function to show messages
function showMessage(element, type, message) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load customer list
async function loadCustomerList() {
    try {
        const response = await fetch(`${API_BASE_URL}/customers/list`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayCustomers(data.customers);
        } else {
            console.error('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Display customers in table
function displayCustomers(customers) {
    const tbody = document.getElementById('customerTableBody');
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-secondary);">
                    No registered customers yet
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => {
        const registeredDate = new Date(customer.created_at).toLocaleDateString();
        const lastVisit = customer.last_visit 
            ? new Date(customer.last_visit).toLocaleDateString() 
            : 'Never';
        
        return `
            <tr>
                <td>${customer.id}</td>
                <td>${escapeHtml(customer.name)}</td>
                <td>${escapeHtml(customer.phone)}</td>
                <td>${customer.email ? escapeHtml(customer.email) : '-'}</td>
                <td><span class="badge badge-info">${customer.total_tokens || 0}</span></td>
                <td><span class="badge badge-success">${customer.completed_tokens || 0}</span></td>
                <td>${lastVisit}</td>
                <td>${registeredDate}</td>
            </tr>
        `;
    }).join('');
}

// Refresh customers list button
document.getElementById('refreshCustomersBtn').addEventListener('click', () => {
    loadCustomerList();
});
