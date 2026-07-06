/* analyticsManager.js */

const AnalyticsManager = {
    revenueChart: null,
    categoryChart: null,
    salesBarChart: null,
    stockPieChart: null,

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
            <div class="panel-card" style="background: var(--db-card); border: 1px solid var(--db-border);">
                <div class="list-head" style="margin-bottom: 25px;">
                    <div>
                        <h2 style="color: var(--db-text); font-size: 20px; font-weight: 800;">Analytics Center</h2>
                        <span style="font-size:12px; color:var(--db-muted);">Real-time performance graphs and inventory analysis</span>
                    </div>
                    <div class="filter-group" style="display:flex; gap:10px;">
                        <div class="custom-dropdown" id="analyticsPeriodDropdown">
                            <button type="button" class="dropdown-trigger" id="dropdownBtn">
                                <span id="selectedPeriodText">This Month</span>
                                <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/>
                                </svg>
                            </button>
                            <ul class="dropdown-menu" id="dropdownMenu">
                                <li class="dropdown-item" data-value="today">Today</li>
                                <li class="dropdown-item" data-value="week">This Week</li>
                                <li class="dropdown-item active" data-value="month">This Month</li>
                                <li class="dropdown-item" data-value="year">This Year</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards with Premium Dark Themes & Glows -->
                <div class="stats-grid" style="margin-top:20px; display:grid; grid-template-columns:repeat(4, 1fr); gap:16px;">
                    <div class="stat-card" style="background: linear-gradient(135deg, #1e1b12, #141414); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 18px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <span style="font-size:11px; font-weight: 700; letter-spacing: 0.05em; color: var(--db-accent);">TOTAL REVENUE</span>
                        <div style="font-size:26px; font-weight:800; margin-top:8px; color: var(--db-text);" id="anaRevenue">₹0</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #12181e, #141414); border: 1px solid rgba(52, 152, 219, 0.25); border-radius: 18px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <span style="font-size:11px; font-weight: 700; letter-spacing: 0.05em; color: var(--db-blue);">TOTAL ORDERS</span>
                        <div style="font-size:26px; font-weight:800; margin-top:8px; color: var(--db-text);" id="anaOrders">0</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #121e16, #141414); border: 1px solid rgba(39, 174, 96, 0.25); border-radius: 18px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <span style="font-size:11px; font-weight: 700; letter-spacing: 0.05em; color: var(--db-green);">DELIVERED</span>
                        <div style="font-size:26px; font-weight:800; margin-top:8px; color: var(--db-text);" id="anaDelivered">0</div>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #1c151e, #141414); border: 1px solid rgba(231, 76, 60, 0.25); border-radius: 18px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                        <span style="font-size:11px; font-weight: 700; letter-spacing: 0.05em; color: var(--db-red);">RETURNS</span>
                        <div style="font-size:26px; font-weight:800; margin-top:8px; color: var(--db-text);" id="anaReturns">0</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px; margin-top:30px;">
                    <div class="chart-container" style="background: #141414; padding: 20px; border-radius:16px; border: 1px solid var(--db-border); height:350px;">
                        <h3 style="font-size:14px; font-weight:600; color:var(--db-text); margin-bottom:15px;">Revenue Trend</h3>
                        <div style="position: relative; height: calc(100% - 30px);"><canvas id="revenueChart"></canvas></div>
                    </div>
                    <div class="chart-container" style="background: #141414; padding: 20px; border-radius:16px; border: 1px solid var(--db-border); height:350px;">
                        <h3 style="font-size:14px; font-weight:600; color:var(--db-text); margin-bottom:15px;">Category Sales Share</h3>
                        <div style="position: relative; height: calc(100% - 30px);"><canvas id="categoryChart"></canvas></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">
                    <div class="chart-container" style="background: #141414; padding: 20px; border-radius:16px; border: 1px solid var(--db-border); height:300px;">
                        <h3 style="font-size:14px; font-weight:600; color:var(--db-text); margin-bottom:15px;">Order Counts Trend</h3>
                        <div style="position: relative; height: calc(100% - 30px);"><canvas id="salesBarChart"></canvas></div>
                    </div>
                    <div class="chart-container" style="background: #141414; padding: 20px; border-radius:16px; border: 1px solid var(--db-border); height:300px;">
                        <h3 style="font-size:14px; font-weight:600; color:var(--db-text); margin-bottom:15px;">Stock Distribution</h3>
                        <div style="position: relative; height: calc(100% - 30px);"><canvas id="stockPieChart"></canvas></div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.updateStats('month');
    },

    bindEvents: function() {
        const btn = document.getElementById('dropdownBtn');
        const menu = document.getElementById('dropdownMenu');
        const selectedText = document.getElementById('selectedPeriodText');
        
        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('open');
                menu.classList.toggle('open');
            });
            
            menu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = item.dataset.value;
                    const label = item.textContent;
                    
                    selectedText.textContent = label;
                    
                    menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    
                    btn.classList.remove('open');
                    menu.classList.remove('open');
                    
                    this.updateStats(value);
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                btn.classList.remove('open');
                menu.classList.remove('open');
            });
        }
    },

    updateStats: async function(period = 'month') {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/admin/analytics?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) return;

            // Render stats card numbers
            document.getElementById('anaRevenue').textContent = '₹' + (data.totalRevenue || 0).toLocaleString();
            document.getElementById('anaOrders').textContent = data.totalOrders || 0;
            document.getElementById('anaDelivered').textContent = data.deliveredOrders || 0;
            document.getElementById('anaReturns').textContent = data.returnedOrders || 0;

            // Update or initialize the charts
            this.updateCharts(data, period);
        } catch (err) {
            console.error("Analytics fetch error:", err);
        }
    },

    updateCharts: function(data, period) {
        // --- 1. Revenue Trend Chart (Line) ---
        const revLabels = (data.revenueTrend || []).map(d => d.label);
        const revData = (data.revenueTrend || []).map(d => d.value);

        if (this.revenueChart) {
            this.revenueChart.data.labels = revLabels;
            this.revenueChart.data.datasets[0].data = revData;
            this.revenueChart.update();
        } else {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(212, 175, 55, 0.3)');
            gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

            this.revenueChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: revLabels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: revData,
                        borderColor: '#d4af37',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        backgroundColor: gradient,
                        pointBackgroundColor: '#d4af37'
                    }]
                },
                options: this.getChartOptions(false)
            });
        }

        // --- 2. Category Share Chart (Doughnut) ---
        const catLabels = (data.categoryPerformance || []).map(d => d.category);
        const catData = (data.categoryPerformance || []).map(d => d.count);

        if (this.categoryChart) {
            this.categoryChart.data.labels = catLabels;
            this.categoryChart.data.datasets[0].data = catData;
            this.categoryChart.update();
        } else {
            const ctx = document.getElementById('categoryChart').getContext('2d');
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: catLabels,
                    datasets: [{
                        data: catData,
                        backgroundColor: ['#d4af37', '#9b59b6', '#3498db', '#2ecc71', '#e74c3c', '#807a70'],
                        borderWidth: 1,
                        borderColor: '#141414'
                    }]
                },
                options: this.getPieOptions()
            });
        }

        // --- 3. Order Counts Trend Chart (Bar) ---
        const salesLabels = (data.dailySales || []).map(d => d.label);
        const salesData = (data.dailySales || []).map(d => d.count);

        if (this.salesBarChart) {
            this.salesBarChart.data.labels = salesLabels;
            this.salesBarChart.data.datasets[0].data = salesData;
            this.salesBarChart.update();
        } else {
            const ctx = document.getElementById('salesBarChart').getContext('2d');
            this.salesBarChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: salesLabels,
                    datasets: [{
                        label: 'Orders',
                        data: salesData,
                        backgroundColor: '#d4af37',
                        borderRadius: 6
                    }]
                },
                options: this.getChartOptions(true)
            });
        }

        // --- 4. Stock Distribution (Pie) ---
        const stockData = [
            data.stockDistribution?.inStock || 0,
            data.stockDistribution?.lowStock || 0,
            data.stockDistribution?.outOfStock || 0
        ];

        if (this.stockPieChart) {
            this.stockPieChart.data.datasets[0].data = stockData;
            this.stockPieChart.update();
        } else {
            const ctx = document.getElementById('stockPieChart').getContext('2d');
            this.stockPieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['In Stock (>5)', 'Low Stock (1-5)', 'Out of Stock'],
                    datasets: [{
                        data: stockData,
                        backgroundColor: ['#27ae60', '#f39c12', '#e74c3c'],
                        borderWidth: 1,
                        borderColor: '#141414'
                    }]
                },
                options: this.getPieOptions()
            });
        }
    },

    getChartOptions: function(displayLegend = false) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: displayLegend,
                    labels: {
                        color: '#f0ece4',
                        font: { family: "'Segoe UI', sans-serif", size: 11 }
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#d4af37',
                    bodyColor: '#f0ece4',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#807a70', font: { family: "'Segoe UI', sans-serif", size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#807a70', font: { family: "'Segoe UI', sans-serif", size: 10 } }
                }
            }
        };
    },

    getPieOptions: function() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#f0ece4',
                        font: { family: "'Segoe UI', sans-serif", size: 11 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#d4af37',
                    bodyColor: '#f0ece4',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    cornerRadius: 8
                }
            }
        };
    }
};

window.AnalyticsManager = AnalyticsManager;
