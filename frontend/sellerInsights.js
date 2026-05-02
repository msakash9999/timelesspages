/* sellerInsights.js */

const SellerInsights = {
    init: function() {
        console.log("Seller Insights Initialized");
        this.renderInsights();
    },

    renderInsights: function() {
        const container = document.getElementById('section-seller-insights');
        if (!container) return;

        container.innerHTML = `
            <div class="panel-card">
                <div class="list-head">
                    <h2>Seller Insights</h2>
                    <span class="status-pill active">Performance: Excellent</span>
                </div>
                
                <div class="stats-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:15px; margin-top:20px;">
                    <div class="stat-card" style="background:#fff; border:1px solid #eee;">
                        <span style="font-size:12px; color:#777;">SALES VELOCITY</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px; color:#2ecc71;">↑ 15%</div>
                    </div>
                    <div class="stat-card" style="background:#fff; border:1px solid #eee;">
                        <span style="font-size:12px; color:#777;">AVG ORDER VALUE</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px;">₹645</div>
                    </div>
                    <div class="stat-card" style="background:#fff; border:1px solid #eee;">
                        <span style="font-size:12px; color:#777;">RETURN RATE</span>
                        <div style="font-size:24px; font-weight:bold; margin-top:5px; color:#e74c3c;">2.1%</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:30px;">
                    <div class="chart-container" style="background:#fcfcfc;">
                        <h3>Weekly Sales Trend</h3>
                        <canvas id="sellerSalesChart"></canvas>
                    </div>
                    <div class="chart-container" style="background:#fcfcfc;">
                        <h3>Fast Selling Books</h3>
                        <div id="topProductsList" style="margin-top:15px;">
                            <!-- List injected -->
                        </div>
                    </div>
                </div>

                <div class="panel-card" style="margin-top:20px; background:#fff5f5; border:1px solid #fed7d7;">
                    <h3 style="color:#c53030;">Low Stock Alerts</h3>
                    <div id="sellerLowStockList" style="margin-top:10px;">
                        <p style="font-size:13px; color:#666;">All your items are well stocked.</p>
                    </div>
                </div>
            </div>
        `;

        this.initCharts();
        this.loadTopProducts();
    },

    initCharts: function() {
        if (!window.Chart) return;

        new Chart(document.getElementById('sellerSalesChart'), {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [1500, 2300, 1800, 3100, 4200, 5500, 4800],
                    backgroundColor: '#8B7355',
                    borderRadius: 5
                }]
            },
            options: { responsive: true }
        });
    },

    loadTopProducts: function() {
        const container = document.getElementById('topProductsList');
        const mockProducts = [
            { name: 'The Silent Patient', sold: 45, revenue: '₹14,250' },
            { name: 'Atomic Habits', sold: 38, revenue: '₹11,400' },
            { name: 'Ikigai', sold: 32, revenue: '₹9,600' }
        ];

        container.innerHTML = mockProducts.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                <div>
                    <div style="font-weight:600; font-size:14px;">${p.name}</div>
                    <div style="font-size:12px; color:#777;">${p.sold} copies sold</div>
                </div>
                <div style="font-weight:bold; color:#8B7355;">${p.revenue}</div>
            </div>
        `).join('');
    }
};

window.SellerInsights = SellerInsights;
