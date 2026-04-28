/**
 * TimelessPages Dashboard Logic
 * Handles SPA navigation, API calls, and UI updates
 */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const Persistence = window.TimelessPagesUserPersistence;
    const token = Persistence ? Persistence.getCurrentUserToken() : localStorage.getItem("timelessPagesUserToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // --- DOM Elements ---
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('.dashboard-section');
    const currentBreadcrumb = document.getElementById('currentBreadcrumb');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- State ---
    let currentUser = null;

    // --- Navigation Logic ---
    const initNavigation = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                switchSection(sectionId);
            });
        });

        // Handle initial section from URL hash or default to home
        const initialSection = window.location.hash.replace('#', '') || 'home';
        switchSection(initialSection);
    };

    const switchSection = (sectionId) => {
        // Update Sidebar
        navLinks.forEach(l => {
            if (l.getAttribute('data-section') === sectionId) {
                l.classList.add('active');
                currentBreadcrumb.textContent = l.textContent.trim();
            } else {
                l.classList.remove('active');
            }
        });

        // Update Sections
        sections.forEach(sec => {
            if (sec.id === `section-${sectionId}`) {
                sec.classList.add('active');
                sec.style.display = 'block';
            } else {
                sec.classList.remove('active');
                sec.style.display = 'none';
            }
        });

        window.location.hash = sectionId;
        loadSectionData(sectionId);
    };

    const loadSectionData = (sectionId) => {
        switch (sectionId) {
            case 'home':
                fetchDashboardSummary();
                break;
            case 'account':
                fetchAccountDetails();
                break;
            case 'profile':
                fetchProfileData();
                break;
            case 'orders':
                fetchOrders();
                break;
            case 'wishlist':
                fetchWishlist();
                break;
            case 'addresses':
                fetchAddresses();
                break;
            case 'settings':
                fetchSettings();
                break;
        }
    };

    // --- API Helpers ---
    const getApiBase = () => {
        return "http://localhost:5000"; // Simplified for now
    };

    const apiFetch = async (endpoint, options = {}) => {
        const url = `${getApiBase()}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }
            return await response.json();
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
            showToast(err.message, 'error');
            throw err;
        }
    };

    // --- UI Helpers ---
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const showLoading = (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="skeleton-loader">
                    <div class="skeleton-item" style="height: 100px;"></div>
                    <div class="skeleton-item" style="height: 200px; margin-top: 20px;"></div>
                </div>
            `;
        }
    };

    // --- Feature Modules ---

    // 1. HOME TAB
    const fetchDashboardSummary = async () => {
        showLoading('section-home-content');
        try {
            const data = await apiFetch('/api/user/summary');
            renderHome(data);
        } catch (err) {}
    };

    const renderHome = (data) => {
        const container = document.getElementById('section-home-content');
        container.innerHTML = `
            <div class="welcome-header">
                <h1>${data.welcomeMessage}</h1>
                <p>Here's what's happening with your account today.</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon orders"><i data-lucide="package"></i></div>
                    <div class="stat-info">
                        <h3>${data.stats.totalOrders}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon wishlist"><i data-lucide="heart"></i></div>
                    <div class="stat-info">
                        <h3>${data.stats.wishlistCount}</h3>
                        <p>Wishlist Items</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon address"><i data-lucide="map-pin"></i></div>
                    <div class="stat-info">
                        <h3>${data.stats.savedAddressesCount}</h3>
                        <p>Saved Addresses</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon profile"><i data-lucide="user-check"></i></div>
                    <div class="stat-info">
                        <h3>${data.stats.profileCompletion}%</h3>
                        <p>Profile Strength</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-row">
                <div class="dashboard-col">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h3>Recent Activity</h3>
                            <i data-lucide="activity"></i>
                        </div>
                        <div class="activity-timeline">
                            ${data.recentActivity.length > 0 ? data.recentActivity.map(act => `
                                <div class="timeline-item">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <p>Order <strong>#${act._id.slice(-6).toUpperCase()}</strong> placed</p>
                                        <span>${new Date(act.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            `).join('') : '<p class="empty-state">No recent activity found.</p>'}
                        </div>
                    </div>
                </div>
                <div class="dashboard-col">
                    <div class="panel-card">
                        <div class="panel-header">
                            <h3>Account Overview</h3>
                            <i data-lucide="info"></i>
                        </div>
                        <div class="account-summary-list">
                            <div class="summary-item">
                                <span>Last Login</span>
                                <strong>${new Date(data.lastLogin).toLocaleString()}</strong>
                            </div>
                            <div class="summary-item">
                                <span>Security Status</span>
                                <span class="badge badge-success">Secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    };

    // 2. ACCOUNT TAB
    const fetchAccountDetails = async () => {
        showLoading('section-account-content');
        try {
            const data = await apiFetch('/api/user/account');
            renderAccount(data);
        } catch (err) {}
    };

    const renderAccount = (data) => {
        const container = document.getElementById('section-account-content');
        container.innerHTML = `
            <div class="account-details-grid">
                <div class="info-group">
                    <label>Username</label>
                    <p>${data.username}</p>
                </div>
                <div class="info-group">
                    <label>Email Address</label>
                    <p>${data.email}</p>
                </div>
                <div class="info-group">
                    <label>Phone Number</label>
                    <p>${data.phone}</p>
                </div>
                <div class="info-group">
                    <label>Member Since</label>
                    <p>${new Date(data.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="info-group">
                    <label>Account Status</label>
                    <span class="badge badge-primary">${data.accountStatus}</span>
                </div>
                <div class="info-group">
                    <label>Account ID</label>
                    <code>${data.accountId}</code>
                </div>
            </div>
            <div class="action-bar">
                <button class="btn btn-primary" onclick="window.location.hash = 'profile'; location.reload();">Edit Account</button>
            </div>
        `;
    };

    // 3. PROFILE TAB
    const fetchProfileData = async () => {
        showLoading('section-profile-content');
        try {
            const user = await apiFetch('/api/user/profile');
            currentUser = user;
            renderProfile(user);
        } catch (err) {}
    };

    const renderProfile = (user) => {
        const container = document.getElementById('section-profile-content');
        container.innerHTML = `
            <form id="profileForm" class="profile-form">
                <div class="profile-header-edit">
                    <div class="avatar-upload">
                        <div class="avatar-preview">
                            <img id="imagePreview" src="${user.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'}" />
                            <label for="profilePhoto" class="upload-btn">
                                <i data-lucide="camera"></i>
                            </label>
                            <input type="file" id="profilePhoto" accept="image/*" style="display:none">
                        </div>
                    </div>
                    <div class="profile-completion" style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 14px; font-weight: 600;">Profile Strength</label>
                            <span style="font-size: 14px; font-weight: 600; color: var(--primary);">85%</span>
                        </div>
                        <div class="progress-bar" style="height: 8px; background: var(--bg-main); border-radius: 99px; overflow: hidden; border: 1px solid var(--border);">
                            <div class="progress-fill" style="width: 85%; height: 100%; background: var(--primary); transition: width 0.5s ease;"></div>
                        </div>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Complete your profile to get better recommendations.</p>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" value="${user.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select name="gender">
                            <option value="Male" ${user.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${user.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${user.gender === 'Other' ? 'selected' : ''}>Other</option>
                            <option value="Prefer not to say" ${user.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Bio</label>
                        <textarea name="bio" rows="3">${user.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dob" value="${user.dob ? user.dob.split('T')[0] : ''}">
                    </div>
                </div>

                <h3 class="section-subtitle">Social Links</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Twitter</label>
                        <input type="text" name="twitter" value="${user.socialLinks?.twitter || ''}" placeholder="https://twitter.com/username">
                    </div>
                    <div class="form-group">
                        <label>Instagram</label>
                        <input type="text" name="instagram" value="${user.socialLinks?.instagram || ''}" placeholder="https://instagram.com/username">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Profile</button>
                </div>
            </form>
        `;
        lucide.createIcons();

        // Image Preview
        const fileInput = document.getElementById('profilePhoto');
        const imagePreview = document.getElementById('imagePreview');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Upload immediately or on form submit? User said "Support image upload preview" and "Save changes dynamically".
                // I'll handle image upload when form is submitted for simplicity, or separately.
                // Let's do it on submit for now.
            }
        });

        // Form Submit
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                gender: formData.get('gender'),
                bio: formData.get('bio'),
                phone: formData.get('phone'),
                dob: formData.get('dob'),
                socialLinks: {
                    twitter: formData.get('twitter'),
                    instagram: formData.get('instagram')
                }
            };

            try {
                // If there's a file, upload it first
                if (fileInput.files[0]) {
                    const imgData = new FormData();
                    imgData.append('image', fileInput.files[0]);
                    const imgRes = await fetch(`${getApiBase()}/api/user/avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: imgData
                    });
                    const imgResult = await imgRes.json();
                    if (imgRes.ok) {
                        localStorage.setItem("timelessPagesUserProfileImage", imgResult.imageUrl);
                    }
                }

                await apiFetch('/api/user/profile', {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                showToast('Profile updated successfully!');
                fetchProfileData();
            } catch (err) {
                showToast('Failed to update profile', 'error');
            }
        });
    };

    // 4. ADDRESS MANAGEMENT
    const fetchAddresses = async () => {
        showLoading('section-addresses-content');
        try {
            const addresses = await apiFetch('/api/user/address');
            renderAddresses(addresses);
        } catch (err) {}
    };

    const renderAddresses = (addresses) => {
        const container = document.getElementById('section-addresses-content');
        container.innerHTML = `
            <div class="address-header">
                <h2>Saved Addresses</h2>
                <button class="btn btn-outline" id="addAddressBtn">
                    <i data-lucide="plus"></i> Add New Address
                </button>
            </div>
            <div class="address-grid">
                ${addresses.length > 0 ? addresses.map(addr => `
                    <div class="address-card ${addr.isDefault ? 'is-default' : ''}">
                        ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}
                        <div class="address-type-icon">
                            <i data-lucide="${addr.addressType === 'Home' ? 'home' : 'briefcase'}"></i>
                        </div>
                        <h3>${addr.fullName}</h3>
                        <p class="phone">${addr.phone}</p>
                        <p class="address-text">
                            ${addr.houseNumber}, ${addr.street}<br>
                            ${addr.landmark ? addr.landmark + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}<br>
                            ${addr.country}
                        </p>
                        <div class="address-actions">
                            <button class="btn-text edit-addr" data-id="${addr._id}">Edit</button>
                            <button class="btn-text delete-addr" data-id="${addr._id}">Delete</button>
                            ${!addr.isDefault ? `<button class="btn-text make-default" data-id="${addr._id}">Set Default</button>` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <i data-lucide="map-pin"></i>
                        <p>No addresses saved yet.</p>
                    </div>
                `}
            </div>
        `;
        lucide.createIcons();

        // Event Listeners
        document.getElementById('addAddressBtn')?.addEventListener('click', () => showAddressModal());
        
        container.querySelectorAll('.edit-addr').forEach(btn => {
            btn.addEventListener('click', () => {
                const addr = addresses.find(a => a._id === btn.dataset.id);
                showAddressModal(addr);
            });
        });

        container.querySelectorAll('.delete-addr').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this address?')) {
                    try {
                        await apiFetch(`/api/user/address/${btn.dataset.id}`, { method: 'DELETE' });
                        showToast('Address deleted');
                        fetchAddresses();
                    } catch (err) {}
                }
            });
        });

        container.querySelectorAll('.make-default').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await apiFetch(`/api/user/address/${btn.dataset.id}/default`, { method: 'PATCH' });
                    showToast('Default address updated');
                    fetchAddresses();
                } catch (err) {}
            });
        });
    };

    const showAddressModal = (address = null) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${address ? 'Edit Address' : 'Add New Address'}</h2>
                    <button class="close-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="addressForm">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label>Full Name</label>
                            <input type="text" name="fullName" value="${address?.fullName || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" value="${address?.phone || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Address Type</label>
                            <select name="addressType">
                                <option value="Home" ${address?.addressType === 'Home' ? 'selected' : ''}>Home</option>
                                <option value="Office" ${address?.addressType === 'Office' ? 'selected' : ''}>Office</option>
                                <option value="Other" ${address?.addressType === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>House/Flat No.</label>
                            <input type="text" name="houseNumber" value="${address?.houseNumber || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Street/Area</label>
                            <input type="text" name="street" value="${address?.street || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Landmark</label>
                            <input type="text" name="landmark" value="${address?.landmark || ''}">
                        </div>
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" name="city" value="${address?.city || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>State</label>
                            <input type="text" name="state" value="${address?.state || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Pincode</label>
                            <input type="text" name="pincode" value="${address?.pincode || ''}" required>
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <input type="checkbox" name="isDefault" id="isDefault" ${address?.isDefault ? 'checked' : ''}>
                        <label for="isDefault">Set as default address</label>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline close-modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">${address ? 'Update Address' : 'Save Address'}</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        lucide.createIcons();

        const closeModal = () => modal.remove();
        modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));

        document.getElementById('addressForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.isDefault = formData.get('isDefault') === 'on';

            // Basic Validation
            const errors = [];
            if (!data.fullName || data.fullName.length < 3) errors.push('Full Name is too short');
            if (!/^\d{10}$/.test(data.phone)) errors.push('Invalid 10-digit Phone Number');
            if (!/^\d{6}$/.test(data.pincode)) errors.push('Invalid 6-digit Pincode');
            if (!data.city || !data.state) errors.push('City and State are required');

            if (errors.length > 0) {
                showToast(errors[0], 'error');
                return;
            }

            try {
                if (address) {
                    await apiFetch(`/api/user/address/${address._id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    showToast('Address updated');
                } else {
                    await apiFetch('/api/user/address', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    showToast('Address added');
                }
                closeModal();
                fetchAddresses();
            } catch (err) {}
        });
    };

    // 5. SETTINGS MODULE
    const fetchSettings = async () => {
        showLoading('section-settings-content');
        try {
            const data = await apiFetch('/api/user/settings');
            renderSettings(data);
        } catch (err) {}
    };

    const renderSettings = (data) => {
        const container = document.getElementById('section-settings-content');
        container.innerHTML = `
            <div class="settings-sections">
                <div class="settings-card">
                    <div class="settings-card-header">
                        <i data-lucide="user-cog"></i>
                        <h3>Account Settings</h3>
                    </div>
                    <form id="accountSettingsForm" class="settings-form">
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value="${data.user.email}">
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" value="${data.user.phone || ''}">
                        </div>
                        <button type="submit" class="btn btn-outline">Update Info</button>
                    </form>
                </div>

                <div class="settings-card">
                    <div class="settings-card-header">
                        <i data-lucide="lock"></i>
                        <h3>Security</h3>
                    </div>
                    <form id="passwordForm" class="settings-form">
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" name="currentPassword" required>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" name="newPassword" required>
                        </div>
                        <button type="submit" class="btn btn-outline">Change Password</button>
                    </form>
                </div>

                <div class="settings-card">
                    <div class="settings-card-header">
                        <i data-lucide="shield"></i>
                        <h3>Privacy & Sessions</h3>
                    </div>
                    <div class="login-history">
                        <h4>Recent Logins</h4>
                        <ul class="history-list">
                            ${data.loginHistory.map(h => `
                                <li>
                                    <i data-lucide="${h.device === 'Mobile' ? 'smartphone' : 'monitor'}"></i>
                                    <div>
                                        <p>${h.browser || 'Unknown Browser'} on ${h.os || 'Unknown OS'}</p>
                                        <span>${new Date(h.loginTime).toLocaleString()} • ${h.ipAddress}</span>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="action-list">
                        <button class="btn btn-outline btn-full" id="logoutAllDevicesBtn">Logout from all other devices</button>
                        <button class="btn btn-outline btn-full" id="exportDataBtn">Export Data (JSON)</button>
                        <button class="btn btn-outline btn-full" id="clearWishlistBtn">Clear Wishlist</button>
                        <button class="btn btn-outline btn-full" id="clearCartBtn">Clear Cart</button>
                    </div>
                </div>

                <div class="settings-card danger-card">
                    <div class="settings-card-header">
                        <i data-lucide="trash-2"></i>
                        <h3>Danger Zone</h3>
                    </div>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <div class="action-list">
                        <button class="btn btn-danger" id="deleteAccountBtn">Delete Account Permanently</button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();

        // Event Listeners for Settings
        document.getElementById('accountSettingsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                await apiFetch('/api/user/settings', {
                    method: 'PUT',
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                showToast('Settings updated');
            } catch (err) {}
        });

        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                await apiFetch('/api/user/settings', {
                    method: 'PUT',
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                showToast('Password changed successfully');
                e.target.reset();
            } catch (err) {}
        });

        document.getElementById('exportDataBtn').addEventListener('click', async () => {
            window.open(`${getApiBase()}/api/user/export-data?token=${token}`, '_blank');
        });

        document.getElementById('logoutAllDevicesBtn').addEventListener('click', async () => {
            if (confirm('Logout from all other devices?')) {
                try {
                    await apiFetch('/api/user/logout-all-devices', { method: 'POST' });
                    showToast('Logged out from all other devices');
                } catch (err) {}
            }
        });

        document.getElementById('clearWishlistBtn').addEventListener('click', async () => {
            if (confirm('Clear your entire wishlist?')) {
                try {
                    await apiFetch('/api/user/clear-wishlist', { method: 'POST' });
                    showToast('Wishlist cleared');
                } catch (err) {}
            }
        });

        document.getElementById('clearCartBtn').addEventListener('click', async () => {
            if (confirm('Clear your entire cart?')) {
                try {
                    await apiFetch('/api/user/clear-cart', { method: 'POST' });
                    showToast('Cart cleared');
                } catch (err) {}
            }
        });

        document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
            const confirmed = prompt('This will permanently delete your account. Type "DELETE" to confirm:');
            if (confirmed === 'DELETE') {
                try {
                    await apiFetch('/api/user/delete-account', { method: 'DELETE' });
                    alert('Account deleted successfully. Logging out.');
                    logout();
                } catch (err) {}
            }
        });
    };

    // 6. ORDERS TAB
    const fetchOrders = async () => {
        showLoading('section-orders-content');
        try {
            const orders = await apiFetch('/api/order/my-orders');
            renderOrders(orders);
        } catch (err) {}
    };

    const renderOrders = (orders) => {
        const container = document.getElementById('section-orders-content');
        if (!orders || orders.length === 0) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="package"></i><p>No orders found yet.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="orders-table-wrapper">
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>#${order._id.slice(-8).toUpperCase()}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>₹${order.totalAmount || 0}</td>
                                <td><span class="badge badge-success">Confirmed</span></td>
                                <td><button class="btn-text">View Details</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    // 7. WISHLIST TAB
    const fetchWishlist = async () => {
        showLoading('section-wishlist-content');
        try {
            const wishlist = await apiFetch('/api/user/wishlist');
            renderWishlist(wishlist);
        } catch (err) {}
    };

    const renderWishlist = (wishlist) => {
        const container = document.getElementById('section-wishlist-content');
        if (!wishlist || wishlist.length === 0) {
            container.innerHTML = `<div class="empty-state"><i data-lucide="heart"></i><p>Your wishlist is empty.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="product-grid">
                ${wishlist.map(item => `
                    <div class="product-card">
                        <img src="${item.image || 'assets/placeholder.png'}" alt="${item.title}">
                        <div class="product-info">
                            <h4>${item.title}</h4>
                            <p class="price">₹${item.price}</p>
                            <div class="product-actions">
                                <button class="btn btn-primary btn-sm">Add to Cart</button>
                                <button class="btn btn-text btn-sm remove-wishlist-btn" data-id="${item.bookId}">Remove</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();

        container.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const bookId = btn.dataset.id;
                const newWishlist = wishlist.filter(item => item.bookId !== bookId);
                try {
                    await fetch(`${getApiBase()}/api/user/wishlist`, {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ wishlist: newWishlist })
                    });
                    showToast('Removed from wishlist');
                    fetchWishlist();
                } catch (err) {}
            });
        });
    };

    // --- Logout ---
    const logout = () => {
        if (Persistence) {
            Persistence.clearSession({ removeToken: true });
        } else {
            localStorage.clear();
        }
        window.location.href = "index.html";
    };

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // --- Init ---
    initNavigation();
});
