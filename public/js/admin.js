// Admin page logic for staff management
const API_URL = 'http://localhost:3000/api';

const adminLoginForm = document.getElementById('adminLoginForm');
const adminPanel = document.getElementById('adminPanel');
const createStaffForm = document.getElementById('createStaffForm');
const staffList = document.getElementById('staffList');
let adminToken = null;

adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        adminToken = data.token;
        adminLoginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadStaffList();
    } catch (error) {
        alert(error.message || 'Invalid admin credentials');
    }
});

createStaffForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('newStaffId').value;
    const name = document.getElementById('newStaffName').value;
    const password = document.getElementById('newStaffPassword').value;
    const department = document.getElementById('newStaffDepartment').value;
    try {
        const response = await fetch(`${API_URL}/admin/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify({ id, name, password, department })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create staff');
        alert('Staff created successfully!');
        createStaffForm.reset();
        loadStaffList();
    } catch (error) {
        alert(error.message);
    }
});

async function loadStaffList() {
    staffList.innerHTML = '<li>Loading...</li>';
    try {
        const response = await fetch(`${API_URL}/staff`);
        const data = await response.json();
        if (!data.success) throw new Error('Failed to fetch staff');
        staffList.innerHTML = '';
        data.staff.forEach(staff => {
            const li = document.createElement('li');
            li.textContent = `${staff.id} - ${staff.name} (${staff.department})`;
            staffList.appendChild(li);
        });
    } catch (error) {
        staffList.innerHTML = `<li>${error.message}</li>`;
    }
}
