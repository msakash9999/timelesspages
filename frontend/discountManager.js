/* discountManager.js */

const DiscountManager = {
    init: function() {
        console.log("Discount Manager Initialized");
        this.renderManager();
    },

    renderManager: function() {
        const container = document.getElementById('section-discounts');
        if (!container) return;

        container.innerHTML = `
            <div class="panel-card">
                <div class="list-head">
                    <h2>Discount Manager</h2>
                    <button class="primary-btn" onclick="DiscountManager.showCreateModal()">+ Create New Discount</button>
                </div>
                <p class="panel-description">Manage book-wise, category-wise, and global discounts.</p>
                
                <div class="tab-bar" style="margin-top: 20px;">
                    <button class="tab-btn active" onclick="DiscountManager.filterDiscounts('all')">All</button>
                    <button class="tab-btn" onclick="DiscountManager.filterDiscounts('active')">Active</button>
                    <button class="tab-btn" onclick="DiscountManager.filterDiscounts('expired')">Expired</button>
                </div>

                <div class="panel-table-wrapper" style="margin-top: 20px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Validity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="discountsTableBody">
                            <tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">Loading discounts...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.loadDiscounts();
    },

    loadDiscounts: async function() {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/admin/discounts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const discounts = await res.json();
            
            if (!res.ok) throw new Error(discounts.message || "Failed to load discounts");

            const tbody = document.getElementById('discountsTableBody');
            if (discounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;">No discounts found.</td></tr>';
                return;
            }

            tbody.innerHTML = discounts.map(d => `
                <tr>
                    <td><strong>${d.name}</strong></td>
                    <td><span class="badge" style="background:#eee; color:#333; padding:2px 8px; border-radius:4px; font-size:11px; text-transform:uppercase;">${d.type}</span></td>
                    <td style="color:#e74c3c; font-weight:bold;">${d.value}% Off</td>
                    <td>${d.startDate} to ${d.endDate}</td>
                    <td><span class="status-pill ${d.status}">${d.status}</span></td>
                    <td>
                        <button class="action-btn" style="color:#8B7355;" onclick="DiscountManager.editDiscount('${d.id}')">Edit</button>
                        <button class="action-btn" style="color:#e74c3c;" onclick="DiscountManager.deleteDiscount('${d.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error("Error loading discounts:", error);
        }
    },

    showCreateModal: function() {
        const modalHtml = `
            <div class="modal-overlay active" id="discountModal">
                <div class="modal-card">
                    <h2 class="modal-title">Create New Discount</h2>
                    <form id="discountForm">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Campaign Name</label>
                                <input type="text" id="discName" placeholder="e.g. Summer Sale" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Discount Type</label>
                                <select id="discType" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                                    <option value="global">Global (All Books)</option>
                                    <option value="category">Category Wise</option>
                                    <option value="book">Book Wise</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin-bottom:15px;">
                            <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Discount Percentage (%)</label>
                            <input type="number" id="discPercent" min="1" max="99" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">Start Date</label>
                                <input type="date" id="discStart" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; color:#666; margin-bottom:5px;">End Date</label>
                                <input type="date" id="discEnd" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                            </div>
                        </div>

                        <div style="display:flex; gap:15px; margin-bottom:20px;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" id="isFlash"> Flash Sale
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" id="isFestival"> Festival Sale
                            </label>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="modal-btn secondary" onclick="document.getElementById('discountModal').remove()">Cancel</button>
                            <button type="submit" class="modal-btn primary">Save Campaign</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('discountForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveDiscount();
        };
    },

    saveDiscount: async function() {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";

            const payload = {
                name: document.getElementById('discName').value,
                type: document.getElementById('discType').value,
                value: Number(document.getElementById('discPercent').value),
                startDate: document.getElementById('discStart').value,
                endDate: document.getElementById('discEnd').value,
                isFlash: document.getElementById('isFlash').checked,
                isFestival: document.getElementById('isFestival').checked,
                status: 'active'
            };

            const res = await fetch(`${apiBase}/api/admin/discounts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to save discount");
            }

            alert("Discount campaign saved successfully!");
            document.getElementById('discountModal').remove();
            this.loadDiscounts();
        } catch (err) {
            alert("Error: " + err.message);
        }
    }
};

window.DiscountManager = DiscountManager;
