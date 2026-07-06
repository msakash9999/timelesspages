/* mapTracking.js */

const MapTracking = {
    map: null,
    activeTileLayer: null,
    markerGroup: null,
    routeGroup: null,
    searchQuery: "",
    statusFilter: "All",
    orders: [],
    markers: {}, // keyed by order._id
    selectedOrderId: null,
    mapTheme: "dark",
    simulationInterval: null,

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
            <div class="panel-card" style="position: relative;">
                <div class="list-head" style="margin-bottom: 20px;">
                    <div>
                        <h2>Live Shipment Tracking</h2>
                        <span style="font-size:12px; color:var(--db-muted);" id="shipmentCountLabel">Tracking 0 Active Shipments</span>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <button id="mapThemeToggle" class="secondary-btn" style="padding: 6px 12px; font-size:12px; display:flex; align-items:center; gap:6px;">
                            <span id="themeToggleIcon">🌙</span> <span id="themeToggleText">Dark Map</span>
                        </button>
                        <button id="mapRecenterBtn" class="secondary-btn" style="padding: 6px 12px; font-size:12px;">
                            📍 Fit Screen
                        </button>
                        <span class="status-pill active" style="background: rgba(39,174,96,.12); color: var(--db-green); padding: 4px 10px; border-radius:999px; font-size:12px; font-weight:600;">LIVE</span>
                    </div>
                </div>

                <!-- Controls: Search & Filters -->
                <div class="tracking-control-panel">
                    <input type="text" id="trackingSearch" class="tracking-search-input" placeholder="Search by Order ID, Customer, or City...">
                    <div class="tracking-filter-group" id="trackingFilters">
                        <button class="tracking-filter-btn active" data-filter="All">All</button>
                        <button class="tracking-filter-btn" data-filter="Packed">Packed</button>
                        <button class="tracking-filter-btn" data-filter="Shipped">Shipped</button>
                        <button class="tracking-filter-btn" data-filter="In Transit">In Transit</button>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 340px; gap:20px;">
                    <div id="liveMap" style="height:550px; border-radius:14px; border:1px solid var(--db-border); z-index:1; overflow:hidden; background:#111;"></div>
                    <div class="tracking-list-wrapper" style="display:flex; flex-direction:column; gap:10px;">
                        <h3 style="font-size:15px; margin-bottom:5px; color:var(--db-text);">Active Deliveries</h3>
                        <div id="shipmentCards" style="display:flex; flex-direction:column; gap:12px; overflow-y:auto; max-height:500px; padding-right:5px;">
                            <!-- Shipments injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initMap();
        this.bindEvents();
        this.fetchAndPlotShipments();
    },

    initMap: function() {
        // Center on India for demo
        this.map = L.map('liveMap').setView([22.5937, 78.9629], 5);
        this.markerGroup = L.layerGroup().addTo(this.map);
        this.routeGroup = L.layerGroup().addTo(this.map);
        this.setMapTheme(this.mapTheme);
    },

    setMapTheme: function(theme) {
        this.mapTheme = theme;
        if (this.activeTileLayer) {
            this.map.removeLayer(this.activeTileLayer);
        }
        
        let url;
        let attribution;
        if (theme === 'dark') {
            url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            attribution = '© OpenStreetMap contributors, © CartoDB';
            document.getElementById('themeToggleIcon').textContent = '🌙';
            document.getElementById('themeToggleText').textContent = 'Dark Map';
        } else {
            url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
            attribution = '© OpenStreetMap contributors, © CartoDB';
            document.getElementById('themeToggleIcon').textContent = '☀️';
            document.getElementById('themeToggleText').textContent = 'Light Map';
        }
        
        this.activeTileLayer = L.tileLayer(url, { attribution }).addTo(this.map);
    },

    bindEvents: function() {
        // Search Filter
        const searchInput = document.getElementById('trackingSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterAndPlot();
            });
        }

        // Status Filter Buttons
        const filterContainer = document.getElementById('trackingFilters');
        if (filterContainer) {
            filterContainer.querySelectorAll('.tracking-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    filterContainer.querySelectorAll('.tracking-filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.statusFilter = e.target.dataset.filter;
                    this.filterAndPlot();
                });
            });
        }

        // Theme Toggle Button
        const themeBtn = document.getElementById('mapThemeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.setMapTheme(this.mapTheme === 'dark' ? 'light' : 'dark');
            });
        }

        // Recenter Button
        const recenterBtn = document.getElementById('mapRecenterBtn');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', () => {
                this.fitAllMarkers();
            });
        }
    },

    fetchAndPlotShipments: async function() {
        try {
            const token = localStorage.getItem('timelessPagesAdminToken');
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allOrders = await res.json();

            if (!res.ok) return;

            // Only track orders that are active (not Delivered and not Cancelled)
            this.orders = allOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'CANCELLED');
            
            this.filterAndPlot();
            this.startSimulation();
        } catch (err) {
            console.error("Map tracking loading error:", err);
            // Inject sample mock shipments if backend cannot connect or is empty to give a rich UI
            this.orders = this.getMockOrders();
            this.filterAndPlot();
            this.startSimulation();
        }
    },

    filterAndPlot: function() {
        // Clear existing markers and paths
        this.markerGroup.clearLayers();
        this.routeGroup.clearLayers();
        this.markers = {};

        // Filter shipments
        const filtered = this.orders.filter(o => {
            const tracking = o.tracking || this.getFallbackTracking(o);
            const orderIdMatches = o._id.toLowerCase().includes(this.searchQuery);
            const customerMatches = (o.address?.fullName || '').toLowerCase().includes(this.searchQuery);
            const cityMatches = (o.address?.city || '').toLowerCase().includes(this.searchQuery);
            const searchMatches = orderIdMatches || customerMatches || cityMatches;

            const statusMatches = this.statusFilter === 'All' || o.orderStatus === this.statusFilter;

            return searchMatches && statusMatches;
        });

        // Update active shipment count label
        const countLabel = document.getElementById('shipmentCountLabel');
        if (countLabel) {
            countLabel.textContent = `Tracking ${filtered.length} Active Shipments`;
        }

        // Plot markers on map
        filtered.forEach(o => {
            const tracking = o.tracking || this.getFallbackTracking(o);
            const pos = [tracking.mapCoordinates.lat, tracking.mapCoordinates.lng];
            
            // Select Emoji & Class based on status
            let emoji = '📦';
            let statusClass = 'status-packed';
            if (o.orderStatus === 'Shipped') {
                emoji = '🚛';
                statusClass = 'status-shipped';
            } else if (o.orderStatus === 'In Transit') {
                emoji = '🚚';
                statusClass = 'status-transit';
            } else if (o.orderStatus === 'Delivered') {
                emoji = '✅';
                statusClass = 'status-delivered';
            }

            const customIcon = L.divIcon({
                className: 'custom-tracking-marker ' + statusClass,
                html: `
                    <div class="marker-pulse"></div>
                    <div class="marker-icon-wrapper">${emoji}</div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker(pos, { icon: customIcon }).addTo(this.markerGroup);
            
            const popupHtml = `
                <div style="font-family: 'Segoe UI', sans-serif; color:#111; padding: 4px; font-size:12px; line-height: 1.5;">
                    <b style="font-size:13px; color:#8B7355; display:block; border-bottom:1px solid #eee; margin-bottom:5px; padding-bottom:2px;">Order #${o._id.slice(-6)}</b>
                    <b>Customer:</b> ${o.address?.fullName || 'N/A'}<br>
                    <b>Destination:</b> ${o.address?.city || 'N/A'}<br>
                    <b>Status:</b> <span style="${this.getStatusBadgeStyle(o.orderStatus)}">${o.orderStatus}</span><br>
                    <b>Courier:</b> ${tracking.courierPartner}<br>
                    <b>Checkpoint:</b> ${tracking.trackingLocation}
                </div>
            `;
            marker.bindPopup(popupHtml);
            
            // Store reference
            this.markers[o._id] = { marker, pos, order: o, tracking };
            
            // Click listener
            marker.on('click', () => {
                this.focusShipment(o._id, true);
            });
        });

        this.renderShipmentCards(filtered);

        // Auto-reselect focused order if it still exists
        if (this.selectedOrderId && this.markers[this.selectedOrderId]) {
            this.focusShipment(this.selectedOrderId, false);
        } else if (filtered.length > 0) {
            // Recenter map on available markers
            this.fitAllMarkers();
        }
    },

    renderShipmentCards: function(filteredOrders) {
        const container = document.getElementById('shipmentCards');
        if (!container) return;

        if (filteredOrders.length === 0) {
            container.innerHTML = '<div style="font-size:13px; color:var(--db-muted); text-align:center; padding:40px;">No shipments match current filters.</div>';
            return;
        }

        container.innerHTML = filteredOrders.map(o => {
            const tracking = o.tracking || this.getFallbackTracking(o);
            return `
                <div class="shipment-card ${o._id === this.selectedOrderId ? 'active' : ''}" data-id="${o._id}" onclick="MapTracking.focusShipment('${o._id}')">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-weight:bold; font-size:14px; color:var(--db-text);">Order #${o._id.slice(-6)}</span>
                        <span class="badge" style="font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; ${this.getStatusPillStyle(o.orderStatus)}">${o.orderStatus}</span>
                    </div>
                    <div style="font-size:13px; color:var(--db-text); margin-bottom:4px; font-weight: 500;">
                        ${o.address?.fullName || 'Customer'}
                    </div>
                    <div style="font-size:12px; color:var(--db-muted);">
                        📍 ${o.address?.city || 'N/A'} • ${tracking.courierPartner}
                    </div>
                    
                    <!-- Expanded Detail Section -->
                    <div class="shipment-card-detail">
                        <div style="font-size:11px; color:var(--db-muted); margin-bottom:8px; display:flex; justify-content:space-between;">
                            <span>ETA: <b>${new Date(tracking.deliveryETA).toLocaleDateString()}</b></span>
                            <span>Progress: <b>${tracking.deliveryProgressLabel || '0%'}</b></span>
                        </div>
                        <div style="font-size:11px; color:var(--db-muted); margin-bottom:12px;">
                            Checkpoint: <b style="color:var(--db-accent);">${tracking.trackingLocation}</b>
                        </div>
                        ${this.getStepperHtml(o.orderStatus)}
                    </div>
                </div>
            `;
        }).join('');
    },

    focusShipment: function(id, fromMarkerClick) {
        this.selectedOrderId = id;
        
        // Highlight in the list
        document.querySelectorAll('.shipment-card').forEach(card => {
            if (card.dataset.id === id) {
                card.classList.add('active');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                card.classList.remove('active');
            }
        });
        
        const data = this.markers[id];
        if (!data) return;
        
        // flyTo map location
        this.map.flyTo(data.pos, 7, {
            animate: true,
            duration: 1.2
        });
        
        if (!fromMarkerClick) {
            data.marker.openPopup();
        }
        
        // Draw route line
        this.routeGroup.clearLayers();
        const routePoints = data.tracking.deliveryRoute || [];
        if (routePoints.length > 0) {
            const latlngs = routePoints.map(p => [p.lat, p.lng]);
            
            // Draw animated flow route polyline
            L.polyline(latlngs, {
                color: '#d4af37',
                weight: 4,
                opacity: 0.8,
                className: 'animated-route-line'
            }).addTo(this.routeGroup);
            
            // Draw pin marker at Warehouse (Delhi Hub)
            const warehousePos = [28.6139, 77.2090];
            L.circleMarker(warehousePos, {
                radius: 6,
                color: '#000',
                fillColor: '#d4af37',
                fillOpacity: 1,
                weight: 2
            }).addTo(this.routeGroup).bindPopup('<b>Warehouse (Delhi Central Hub)</b>');
        }
    },

    fitAllMarkers: function() {
        const markerList = Object.values(this.markers);
        if (markerList.length === 0) {
            this.map.setView([22.5937, 78.9629], 5);
            return;
        }

        const group = L.featureGroup(markerList.map(m => m.marker));
        this.map.fitBounds(group.getBounds().pad(0.15));
    },

    getStepperHtml: function(orderStatus) {
        const statuses = ['Confirmed', 'Packed', 'Shipped', 'In Transit'];
        const currentIndex = statuses.indexOf(orderStatus);
        
        let progressWidth = 0;
        if (currentIndex !== -1) {
            progressWidth = (currentIndex / (statuses.length - 1)) * 100;
        }

        const stepsHtml = statuses.map((status, index) => {
            let className = '';
            let nodeContent = index + 1;
            if (index < currentIndex) {
                className = 'completed';
                nodeContent = '✓';
            } else if (index === currentIndex) {
                className = 'active';
                nodeContent = orderStatus === 'In Transit' ? '🚚' : orderStatus === 'Shipped' ? '🚛' : '📦';
            }
            return `
                <div class="stepper-step ${className}">
                    <div class="step-node">${nodeContent}</div>
                    <div class="step-text">${status}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="tracking-stepper">
                <div class="stepper-progress-line" style="width: ${progressWidth}%;"></div>
                ${stepsHtml}
            </div>
        `;
    },

    startSimulation: function() {
        if (this.simulationInterval) clearInterval(this.simulationInterval);
        
        this.simulationInterval = setInterval(() => {
            if (!this.selectedOrderId) return;
            const data = this.markers[this.selectedOrderId];
            if (!data || data.order.orderStatus !== 'In Transit') return;
            
            // Add a tiny random jitter along coordinates to simulate active motion
            const jitterLat = (Math.random() - 0.5) * 0.006;
            const jitterLng = (Math.random() - 0.5) * 0.006;
            
            data.pos = [data.pos[0] + jitterLat, data.pos[1] + jitterLng];
            
            // Move marker
            data.marker.setLatLng(data.pos);
            
            // Update route line endpoint
            if (data.tracking.deliveryRoute && data.tracking.deliveryRoute.length > 0) {
                const routePoints = data.tracking.deliveryRoute;
                const activeIndex = Math.min(3, routePoints.length - 2); // intermediate index
                if (routePoints[activeIndex]) {
                    routePoints[activeIndex].lat += jitterLat;
                    routePoints[activeIndex].lng += jitterLng;
                }
                
                // Redraw line
                this.routeGroup.clearLayers();
                const latlngs = routePoints.map(p => [p.lat, p.lng]);
                L.polyline(latlngs, {
                    color: '#d4af37',
                    weight: 4,
                    opacity: 0.8,
                    className: 'animated-route-line'
                }).addTo(this.routeGroup);

                const warehousePos = [28.6139, 77.2090];
                L.circleMarker(warehousePos, {
                    radius: 6,
                    color: '#000',
                    fillColor: '#d4af37',
                    fillOpacity: 1,
                    weight: 2
                }).addTo(this.routeGroup).bindPopup('<b>Warehouse (Delhi Central Hub)</b>');
            }
        }, 8000);
    },

    getStatusPillStyle: function(status) {
        if (status === 'Packed') return 'background: rgba(212, 175, 55, 0.15); color: #d4af37;';
        if (status === 'Shipped') return 'background: rgba(52, 152, 219, 0.15); color: #3498db;';
        if (status === 'In Transit') return 'background: rgba(230, 126, 34, 0.15); color: #e67e22;';
        return 'background: rgba(39, 174, 96, 0.15); color: #27ae60;';
    },

    getStatusBadgeStyle: function(status) {
        if (status === 'Packed') return 'color: #d4af37; font-weight: bold;';
        if (status === 'Shipped') return 'color: #3498db; font-weight: bold;';
        if (status === 'In Transit') return 'color: #e67e22; font-weight: bold;';
        return 'color: #27ae60; font-weight: bold;';
    },

    getFallbackTracking: function(o) {
        const cityCoords = {
            'Delhi': [28.6139, 77.2090], 'New Delhi': [28.6139, 77.2090],
            'Mumbai': [19.0760, 72.8777], 'Bangalore': [12.9716, 77.5946],
            'Chennai': [13.0827, 80.2707], 'Kolkata': [22.5726, 88.3639],
            'Hyderabad': [17.3850, 78.4867], 'Pune': [18.5204, 73.8567],
            'Ahmedabad': [23.0225, 72.5714], 'Jaipur': [26.9124, 75.7873],
            'Lucknow': [26.8467, 80.9462], 'Patna': [25.5941, 85.1376],
            'Bhopal': [23.2599, 77.4126], 'Indore': [22.7196, 75.8577]
        };
        const city = o.address?.city || '';
        const dest = cityCoords[city] || [20 + Math.random()*5, 75 + Math.random()*10];
        const warehouse = [28.6139, 77.2090];
        
        let progress = 0.2;
        if (o.orderStatus === 'Packed') progress = 0.32;
        else if (o.orderStatus === 'Shipped') progress = 0.48;
        else if (o.orderStatus === 'In Transit') progress = 0.68;
        else if (o.orderStatus === 'Delivered') progress = 1.0;

        const currentLat = warehouse[0] + (dest[0] - warehouse[0]) * progress;
        const currentLng = warehouse[1] + (dest[1] - warehouse[1]) * progress;

        const route = [
            { lat: warehouse[0], lng: warehouse[1] },
            { lat: warehouse[0] + (dest[0] - warehouse[0])*0.3, lng: warehouse[1] + (dest[1] - warehouse[1])*0.3 + 0.3 },
            { lat: warehouse[0] + (dest[0] - warehouse[0])*0.6, lng: warehouse[1] + (dest[1] - warehouse[1])*0.6 - 0.3 },
            { lat: currentLat, lng: currentLng },
            { lat: dest[0], lng: dest[1] }
        ];

        return {
            mapCoordinates: { lat: currentLat, lng: currentLng },
            destinationCoordinates: { lat: dest[0], lng: dest[1] },
            deliveryRoute: route,
            deliveryProgressLabel: `${Math.round(progress * 100)}%`,
            courierPartner: 'Timeless Express',
            trackingLocation: o.orderStatus === 'In Transit' ? 'City Hub' : o.orderStatus === 'Shipped' ? 'Regional Hub' : 'Warehouse',
            deliveryETA: new Date(Date.now() + 3*24*60*60*1000)
        };
    },

    getMockOrders: function() {
        return [
            {
                _id: "order_mock_001",
                orderStatus: "In Transit",
                address: {
                    fullName: "Akash Sharma",
                    city: "Mumbai",
                    state: "Maharashtra"
                }
            },
            {
                _id: "order_mock_002",
                orderStatus: "Shipped",
                address: {
                    fullName: "Priya Patel",
                    city: "Bangalore",
                    state: "Karnataka"
                }
            },
            {
                _id: "order_mock_003",
                orderStatus: "Packed",
                address: {
                    fullName: "Kabir Singh",
                    city: "Jaipur",
                    state: "Rajasthan"
                }
            },
            {
                _id: "order_mock_004",
                orderStatus: "In Transit",
                address: {
                    fullName: "Ananya Roy",
                    city: "Kolkata",
                    state: "West Bengal"
                }
            }
        ];
    }
};

window.MapTracking = MapTracking;
