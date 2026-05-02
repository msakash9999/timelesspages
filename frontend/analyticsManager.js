/* analyticsManager.js */

const AnalyticsManager = {
    init: function() {
        console.log("Analytics Manager Initialized");
        this.loadChartJS();
    },

    loadChartJS: function() {
        if (window.Chart) {
            this.renderAnalytics();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.renderAnalytics();
            document.head.appendChild(script);
        }
    },

    renderAnalytics: function() {
        const container = document.getElementById('section-analytics-center');
        if (!container) return;

        container.innerHTML = `
            <div class="panel-card">
                <div class="list-head">
                    <h2>Analytics Center</h2>
                    <div class="filter-group" style="display:flex; gap:10px;">
                        <select class="action-btn" id="analyticsPeriod">
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month" selected>This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                <div class="stats-grid" style="margin-top:20px; display:grid; grid-template-columns:repeat(4, 1fr); gap:15px;">
                    <div class="stat-card" style="background:#f0f7ff; border:1px solid #e1effe;">
                        <span style="font-size:12px; color:#1e429f;">TOTAL REVENUE</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px;" id="anaRevenue">₹0</div>
                    </div>
                    <div class="stat-card" style="background:#fdf2f2; border:1px solid #fbd5d5;">
                        <span style="font-size:12px; color:#9b1c1c;">TOTAL ORDERS</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px;" id="anaOrders">0</div>
                    </div>
                    <div class="stat-card" style="background:#f3faf7; border:1px solid #def7ec;">
                        <span style="font-size:12px; color:#03543f;">DELIVERED</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px;" id="anaDelivered">0</div>
                    </div>
                    <div class="stat-card" style="background:#fdf8f3; border:1px solid #f8e3cd;">
                        <span style="font-size:12px; color:#7e3af2;">RETURNS</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px;" id="anaReturns">0</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px; margin-top:30px;">
                    <div class="chart-container">
                        <h3>Revenue Trend</h3>
                        <canvas id="revenueChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Category Performance</h3>
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">
                    <div class="chart-container">
                        <h3>Daily Sales</h3>
                        <canvas id="salesBarChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Stock Distribution</h3>
                        <canvas id="stockPieChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.initCharts();
        this.updateStats();
    },

    initCharts: function() {
        // Revenue Line Chart
        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#8B7355',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(139, 115, 85, 0.1)'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // Category Pie Chart
        new Chart(document.getElementById('categoryChart'), {
            type: 'doughnut',
            data: {
                labels: ['Fiction', 'History', 'Philosophy', 'Science'],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: ['#8B7355', '#a08060', '#6F5B44', '#4e3f2f']
                }]
            },
            options: { responsive: true }
        });

        // Sales Bar Chart
        new Chart(document.getElementById('salesBarChart'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Orders',
                    data: [45, 60, 55, 70, 85, 100, 90],
                    backgroundColor: '#8B7355'
                }]
            }
        });

        // Stock Distribution
        new Chart(document.getElementById('stockPieChart'), {
            type: 'pie',
            data: {
                labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                    data: [120, 30, 15],
                    backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c']
                }]
            }
        });
    },

    updateStats: async function() {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/admin/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('anaRevenue').textContent = '₹' + (data.totalRevenue || 0).toLocaleString();
                document.getElementById('anaOrders').textContent = data.totalOrders || 0;
                document.getElementById('anaDelivered').textContent = data.deliveredOrders || 0;
                document.getElementById('anaReturns').textContent = data.returnedOrders || 0;
            }
        } catch (err) {
            console.error("Analytics fetch error:", err);
        }
    }
};

window.AnalyticsManager = AnalyticsManager;
