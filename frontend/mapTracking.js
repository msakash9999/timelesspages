/* mapTracking.js */

const MapTracking = {
    init: function() {
        console.log("Map Tracking Initialized");
        this.loadLeaflet();
    },

    loadLeaflet: function() {
        if (window.L) {
            this.renderMapSection();
        } else {
            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => this.renderMapSection();
            document.head.appendChild(script);
        }
    },

    renderMapSection: function() {
        const container = document.getElementById('section-live-tracking');
        if (!container) return;

        container.innerHTML = `
            <div class="panel-card">
                <div class="list-head">
                    <h2>Live Shipment Tracking</h2>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span class="status-pill active">LIVE</span>
                        <span style="font-size:12px; color:#666;">Tracking 12 Active Shipments</span>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 300px; gap:20px; margin-top:20px;">
                    <div id="liveMap" style="height:500px; border-radius:12px; border:1px solid #ddd; z-index:1;"></div>
                    <div class="tracking-list" style="overflow-y:auto; max-height:500px;">
                        <h3>Active Deliveries</h3>
                        <div id="shipmentCards" style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">
                            <!-- Shipments injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initMap();
        this.renderShipments();
    },

    initMap: function() {
        // Center on India for demo
        this.map = L.map('liveMap').setView([20.5937, 78.9629], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.fetchAndPlotShipments();
    },

    fetchAndPlotShipments: async function() {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const orders = await res.json();

            if (!res.ok) return;

            const cityCoords = {
                'Delhi': [28.6139, 77.2090], 'New Delhi': [28.6139, 77.2090],
                'Mumbai': [19.0760, 72.8777], 'Bangalore': [12.9716, 77.5946],
                'Chennai': [13.0827, 80.2707], 'Kolkata': [22.5726, 88.3639],
                'Hyderabad': [17.3850, 78.4867], 'Pune': [18.5204, 73.8567],
                'Ahmedabad': [23.0225, 72.5714], 'Jaipur': [26.9124, 75.7873],
                'Lucknow': [26.8467, 80.9462], 'Patna': [25.5941, 85.1376],
                'Bhopal': [23.2599, 77.4126], 'Indore': [22.7196, 75.8577]
            };

            const activeOrders = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'CANCELLED');
            
            activeOrders.forEach(o => {
                const city = o.address?.city || '';
                const pos = cityCoords[city] || [20 + Math.random()*5, 75 + Math.random()*10]; // Random fallback in India
                
                const marker = L.marker(pos).addTo(this.map);
                marker.bindPopup(`<b>Order #${o._id.slice(-6)}</b><br>${o.address?.fullName}<br>${city}<br>Status: ${o.orderStatus}`);
            });

            this.renderShipments(activeOrders);
        } catch (err) {
            console.error("Map tracking error:", err);
        }
    },

    renderShipments: function(orders) {
        const container = document.getElementById('shipmentCards');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div style="font-size:12px; color:#999; text-align:center; padding:20px;">No active shipments.</div>';
            return;
        }

        container.innerHTML = orders.map(o => {
            const progress = o.orderStatus === 'Packed' ? 20 : o.orderStatus === 'Shipped' ? 50 : o.orderStatus === 'In Transit' ? 80 : 10;
            return `
                <div class="stat-card" style="padding:15px; border:1px solid #eee; background:#fcfcfc; cursor:pointer;" onclick="MapTracking.focusShipment('${o._id}')">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="font-weight:bold; font-size:14px;">#${o._id.slice(-6)}</span>
                        <span style="font-size:11px; color:#8B7355; background:#fdf2f2; padding:2px 6px; border-radius:4px;">${o.orderStatus}</span>
                    </div>
                    <div style="font-size:13px; color:#555; margin-bottom:8px;">${o.address?.fullName || 'User'} • ${o.address?.city || 'N/A'}</div>
                    <div style="width:100%; height:4px; background:#eee; border-radius:2px;">
                        <div style="width:${progress}%; height:100%; background:#8B7355; border-radius:2px;"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    focusShipment: function(id) {
        console.log("Focusing on shipment:", id);
        // Map animation logic would go here
    }
};

window.MapTracking = MapTracking;
