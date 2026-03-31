/**
 * Utility Functions for Queue Management System
 * Reusable helpers for API calls, UI interactions, and data formatting
 */

const API_BASE_URL = window.location.origin + '/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Enhanced fetch wrapper with authentication and error handling
 */
async function apiFetch(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            // Handle token expiration
            if (response.status === 401 && data.error === 'Token expired') {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
                throw new Error('Token expired');
            }
            
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} slide-in`;
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span style="font-size: 1.25rem;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show modal dialog
 */
function showModal(title, content, options = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${options.cancelText ? `<button class="btn btn-outline" data-action="cancel">${options.cancelText}</button>` : ''}
                    <button class="btn btn-primary" data-action="confirm">${options.confirmText || 'OK'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Handle button clicks
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('modal-close')) {
                overlay.remove();
                resolve(false);
            }
            
            if (e.target.dataset.action === 'confirm') {
                overlay.remove();
                resolve(true);
            }
            
            if (e.target.dataset.action === 'cancel') {
                overlay.remove();
                resolve(false);
            }
        });
        
        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

/**
 * Animate number counting
 */
function animateNumber(element, start, end, duration = 500) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + range * easeOut);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Debounce function
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Show loading spinner
 */
function showLoading(show = true) {
    let loader = document.getElementById('global-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'loading-bar';
            document.body.appendChild(loader);
        }
    } else {
        if (loader) {
            loader.remove();
        }
    }
}

/**
 * Format time to HH:MM AM/PM
 */
function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Get user info from token
 */
function getUserInfo() {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        // Decode JWT (simple base64 decode - not secure, just for reading)
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('customerToken');
    window.location.href = '/login.html';
}

/**
 * Check authentication and redirect if needed
 */
function requireAuth(requiredRole = null) {
    const token = getAuthToken();
    
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    
    const userInfo = getUserInfo();
    
    if (requiredRole && userInfo.role !== requiredRole) {
        showToast('Unauthorized access', 'error');
        setTimeout(logout, 1500);
        return false;
    }
    
    return true;
}

/**
 * Create skeleton loader
 */
function createSkeleton(type = 'card', count = 1) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        skeletons.push(skeleton);
    }
    return skeletons;
}

/**
 * Handle offline/online status
 */
let offlineBanner = null;

window.addEventListener('offline', () => {
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.className = 'alert-banner alert-warning';
        offlineBanner.innerHTML = '<span>⚠</span><span>Connection lost - Retrying...</span>';
        offlineBanner.style.top = '0';
        document.body.appendChild(offlineBanner);
    }
});

window.addEventListener('online', () => {
    if (offlineBanner) {
        offlineBanner.remove();
        offlineBanner = null;
        showToast('Connection restored', 'success');
    }
});

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success', 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
    }
}

/**
 * Format date to readable string
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiFetch,
        showToast,
        showModal,
        formatRelativeTime,
        animateNumber,
        debounce,
        showLoading,
        formatTime,
        isValidEmail,
        getUserInfo,
        logout,
        requireAuth,
        createSkeleton,
        copyToClipboard,
        formatDate,
        getAuthToken
    };
}
