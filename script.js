// ====== CONFIG ======
const users = [
    { username: 'admin', password: 'admin123' },
    { username: 'user', password: 'password123' },
    { username: 'test', password: 'test123' }
];

// ====== STATE ======
let mainMap = null;
let userMarker = null;
let userCircle = null;
let destMarker = null;
let routePolyline = null;
let currentLocation = null;
let mapReady = false;
let mapTheme = 'light';
let lightTile = null;
let darkTile = null;
let markerLayers = {};
let watchId = null;
let navMode = 'safe';
let routeHazards = [];

// ====== CITIES DATA ======
const indianCities = [
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025, state: 'Delhi' },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
    { name: 'Lucknow', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
    { name: 'Chandigarh', lat: 30.7333, lon: 76.7794, state: 'Chandigarh' },
    { name: 'Indore', lat: 22.7196, lon: 75.8577, state: 'Madhya Pradesh' },
    { name: 'Surat', lat: 21.1458, lon: 72.8336, state: 'Gujarat' },
    { name: 'Ghaziabad', lat: 28.6692, lon: 77.4538, state: 'Uttar Pradesh' },
    { name: 'Nagpur', lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
    { name: 'Bhopal', lat: 23.1815, lon: 79.9864, state: 'Madhya Pradesh' },
    { name: 'Kochi', lat: 9.9312, lon: 76.2673, state: 'Kerala' },
    { name: 'Visakhapatnam', lat: 17.6869, lon: 83.2185, state: 'Andhra Pradesh' },
];

// ====== INIT ======
window.addEventListener('DOMContentLoaded', function () {
    if (isLoggedIn()) {
        showApp();
    }
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            switchSection(this.dataset.section);
        });
    });
});

// ====== AUTH ======
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}
function getCurrentUser() {
    const u = localStorage.getItem('currentUser');
    return u ? JSON.parse(u) : null;
}
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const err = document.getElementById('errorMessage');

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify({ username, loginTime: new Date().toISOString() }));
        showApp();
    } else {
        err.textContent = 'Invalid username or password';
        err.classList.add('show');
        setTimeout(() => err.classList.remove('show'), 4000);
    }
}
function handleLogout() {
    if (confirm('Logout?')) {
        localStorage.removeItem('currentUser');
        location.reload();
    }
}
function toggleSignup(e) {
    e.preventDefault();
    alert('Sign up coming soon!\n\nTest credentials:\nadmin / admin123\nuser / password123');
}

// ====== SHOW APP ======
function showApp() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userGreeting').textContent = 'Hi, ' + user.username;
        document.getElementById('welcomeTitle').textContent = 'Welcome, ' + user.username + '!';
    }
    detectUserCity();
}

// ====== SECTION SWITCHING ======
function switchSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const section = document.getElementById('section-' + name);
    if (section) section.classList.add('active');
    const link = document.querySelector('.nav-link[data-section="' + name + '"]');
    if (link) link.classList.add('active');

    if (name === 'maps' && !mapReady) {
        setTimeout(initMainMap, 100);
    }
    if (name === 'maps' && mainMap) {
        setTimeout(() => mainMap.invalidateSize(), 150);
    }
    if (name === 'community' && !communityReports.length) {
        setTimeout(initCommunity, 100);
    }
}

// ====================================================================
//  AI-POWERED LIVE ROAD SAFETY MAP
// ====================================================================

// Hazard data around Indian cities
const mapIncidents = [
    { id:1, type:'accident', title:'Multi-vehicle collision', desc:'3-car pileup on NH-44 near toll plaza. 2 lanes blocked.', lat:12.9352, lon:77.6245, severity:'critical', time:Date.now()-180000, confirmations:24, city:'Bangalore' },
    { id:2, type:'accident', title:'Two-wheeler accident', desc:'Bike skidded on wet road near MG Road metro station.', lat:12.9756, lon:77.6021, severity:'high', time:Date.now()-600000, confirmations:12, city:'Bangalore' },
    { id:3, type:'pothole', title:'Deep pothole on ORR', desc:'Large pothole on Outer Ring Road near Marathahalli. Two-wheelers at risk.', lat:12.9568, lon:77.7010, severity:'high', time:Date.now()-1200000, confirmations:38, city:'Bangalore' },
    { id:4, type:'pothole', title:'Multiple potholes', desc:'Series of potholes on Hosur Road near Madiwala.', lat:12.9210, lon:77.6176, severity:'medium', time:Date.now()-3600000, confirmations:15, city:'Bangalore' },
    { id:5, type:'traffic', title:'Heavy congestion', desc:'Traffic backed up 3km on Silk Board junction. Expected delay 40 min.', lat:12.9177, lon:77.6238, severity:'high', time:Date.now()-300000, confirmations:52, city:'Bangalore' },
    { id:6, type:'traffic', title:'Slow moving traffic', desc:'Waterlogging causing slowdown on Bellary Road near Hebbal.', lat:13.0358, lon:77.5970, severity:'medium', time:Date.now()-900000, confirmations:19, city:'Bangalore' },
    { id:7, type:'flood', title:'Road flooded', desc:'Underpass completely submerged. Vehicles stranded.', lat:12.9900, lon:77.5560, severity:'critical', time:Date.now()-400000, confirmations:43, city:'Bangalore' },
    { id:8, type:'construction', title:'Metro construction zone', desc:'Metro work blocking 2 lanes. Follow diversion signs.', lat:12.9344, lon:77.6101, severity:'low', time:Date.now()-7200000, confirmations:28, city:'Bangalore' },
    { id:9, type:'construction', title:'Flyover work', desc:'Flyover construction near KR Puram. Single lane open.', lat:13.0012, lon:77.6868, severity:'medium', time:Date.now()-5400000, confirmations:9, city:'Bangalore' },
    { id:10, type:'accident', title:'Bus-auto collision', desc:'BMTC bus and auto collision near Majestic.', lat:12.9770, lon:77.5722, severity:'high', time:Date.now()-1500000, confirmations:17, city:'Bangalore' },
    { id:11, type:'unsafe', title:'Reckless driving zone', desc:'Multiple overspeeding and wrong-side driving reported.', lat:12.8456, lon:77.6603, severity:'critical', time:Date.now()-2700000, confirmations:31, city:'Bangalore' },
    { id:12, type:'accident', title:'Truck overturned', desc:'Cargo truck overturned on Delhi-Gurgaon Expressway.', lat:28.4595, lon:77.0725, severity:'critical', time:Date.now()-900000, confirmations:35, city:'Delhi' },
    { id:13, type:'pothole', title:'Crater-sized pothole', desc:'Massive pothole on Ring Road near AIIMS flyover.', lat:28.5689, lon:77.2105, severity:'critical', time:Date.now()-1800000, confirmations:56, city:'Delhi' },
    { id:14, type:'flood', title:'Waterlogging on NH-48', desc:'Heavy water accumulation causing traffic chaos.', lat:19.1136, lon:72.8697, severity:'high', time:Date.now()-600000, confirmations:29, city:'Mumbai' },
    { id:15, type:'traffic', title:'Signal failure jam', desc:'Traffic signal failure at major junction. Complete gridlock.', lat:19.0760, lon:72.8777, severity:'high', time:Date.now()-1200000, confirmations:44, city:'Mumbai' },
];

const safetyServices = {
    hospitals: [
        { name:'Apollo Hospital', lat:12.9478, lon:77.5965, dist:1.2 },
        { name:'Manipal Hospital', lat:12.9620, lon:77.5979, dist:2.1 },
        { name:'Columbia Asia', lat:12.9782, lon:77.7198, dist:3.5 },
        { name:'Fortis Hospital', lat:12.9626, lon:77.7133, dist:2.8 },
        { name:'Narayana Health', lat:12.8742, lon:77.5958, dist:5.4 },
    ],
    police: [
        { name:'Koramangala PS', lat:12.9352, lon:77.6245, dist:0.8 },
        { name:'HSR Layout PS', lat:12.9121, lon:77.6446, dist:1.5 },
        { name:'Whitefield PS', lat:12.9698, lon:77.7499, dist:4.2 },
        { name:'Indiranagar PS', lat:12.9784, lon:77.6408, dist:2.0 },
        { name:'MG Road PS', lat:12.9756, lon:77.6065, dist:1.9 },
    ]
};

const aiAlerts = [
    { text: 'AI Warning: Accident zone detected 500m ahead on ORR. Reduce speed.', icon: 'fa-car-burst', color: 'red' },
    { text: 'AI Alert: Heavy rain expected in 30 min. Roads may get slippery.', icon: 'fa-cloud-rain', color: 'blue' },
    { text: 'Safety Alert: 3 potholes reported in next 2 km stretch.', icon: 'fa-road-circle-exclamation', color: 'orange' },
    { text: 'AI: Night driving risk is HIGH in this area. Low visibility detected.', icon: 'fa-moon', color: 'yellow' },
    { text: 'Community: 12 users confirmed road flooding at underpass ahead.', icon: 'fa-water', color: 'blue' },
];

const notifData = [
    { icon: 'fa-car-burst', color: 'red', title: 'Accident on ORR', text: 'Multi-vehicle collision near Marathahalli bridge.', time: '2 min ago' },
    { icon: 'fa-water', color: 'blue', title: 'Flooding Alert', text: 'Underpass near Hebbal is completely flooded.', time: '8 min ago' },
    { icon: 'fa-road-circle-exclamation', color: 'orange', title: 'Pothole Alert', text: 'Deep pothole reported on Hosur Road.', time: '15 min ago' },
];

const typeToIcon = {
    accident: 'fa-car-burst', pothole: 'fa-road-circle-exclamation', traffic: 'fa-car',
    flood: 'fa-water', construction: 'fa-helmet-safety', police: 'fa-shield',
    hospital: 'fa-hospital', unsafe: 'fa-skull-crossbones'
};

const typeToClass = {
    accident: 'marker-accident', pothole: 'marker-pothole', traffic: 'marker-traffic',
    flood: 'marker-flood', construction: 'marker-construction', police: 'marker-police',
    hospital: 'marker-hospital', unsafe: 'marker-unsafe'
};

// ====== INIT MAP ======
function initMainMap() {
    mainMap = L.map('mainMap', { zoomControl: false }).setView([20.5937, 78.9629], 5);

    L.control.zoom({ position: 'bottomright' }).addTo(mainMap);

    darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, &copy; CARTO', maxZoom: 19
    });
    lightTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19
    });

    lightTile.addTo(mainMap);
    document.querySelector('.map-dashboard').setAttribute('data-map-theme','light');
    mapReady = true;

    // Init marker layer groups
    ['accidents','potholes','traffic','floods','construction','police','hospitals','unsafe'].forEach(k => {
        markerLayers[k] = L.layerGroup().addTo(mainMap);
    });

    // Setup search
    const searchInput = document.getElementById('mapSearchInput');
    searchInput.addEventListener('input', debounce(function(){ handleMapSearch(this.value); }.bind(searchInput), 400));
    searchInput.addEventListener('blur', () => setTimeout(() => document.getElementById('mapSearchResults').classList.remove('show'), 250));

    // Setup nav autocomplete
    const navTo = document.getElementById('navTo');
    navTo.addEventListener('input', debounce(function(){ handleNavAutocomplete(this.value); }.bind(navTo), 400));
    navTo.addEventListener('blur', () => setTimeout(() => document.getElementById('navAutocomplete').classList.remove('show'), 250));

    // Set avatar
    const user = getCurrentUser();
    if (user) {
        document.getElementById('mtbAvatar').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('navFrom').value = 'Detecting your location...';
    }

    // Populate notifications
    populateNotifications();

    // start location tracking
    detectUserLocation();

    // Place hazard markers
    setTimeout(placeAllMarkers, 500);

    // Start AI alerts
    setTimeout(startAiAlerts, 3000);

    // Update analytics
    setTimeout(updateAnalytics, 1000);

    // Simulate weather
    simulateWeather();
}

// ====== DETECT & TRACK USER LOCATION ======
function detectUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            const lat = pos.coords.latitude, lon = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            currentLocation = { lat, lon };
            mainMap.setView([lat, lon], 14);
            updateUserMarker(lat, lon, acc);
            reverseGeocode(lat, lon, function(addr) {
                document.getElementById('navFrom').value = addr;
            });
            // Start continuous tracking
            watchId = navigator.geolocation.watchPosition(
                function(p) {
                    currentLocation = { lat: p.coords.latitude, lon: p.coords.longitude };
                    updateUserMarker(p.coords.latitude, p.coords.longitude, Math.round(p.coords.accuracy));
                },
                function(){},
                { enableHighAccuracy: true, maximumAge: 5000 }
            );
        },
        function () {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateUserMarker(lat, lon, acc) {
    if (userMarker) mainMap.removeLayer(userMarker);
    if (userCircle) mainMap.removeLayer(userCircle);
    userMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div class="gps-marker" style="width:18px;height:18px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(66,133,244,.6)"></div>',
            iconSize: [24, 24], iconAnchor: [12, 12], className: ''
        }),
        zIndexOffset: 1000
    }).addTo(mainMap).bindPopup('<b>Your Location</b>');
    userCircle = L.circle([lat, lon], { radius: Math.min(acc, 300), color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.1, weight: 1.5 }).addTo(mainMap);
}

function reLocateUser() {
    if (currentLocation) {
        mainMap.flyTo([currentLocation.lat, currentLocation.lon], 16, { duration: 1 });
    } else {
        detectUserLocation();
    }
}

// ====== MAP SEARCH (Nominatim) ======
function handleMapSearch(val) {
    const results = document.getElementById('mapSearchResults');
    const clearBtn = document.getElementById('mapSearchClear');
    if (val.length < 2) { results.classList.remove('show'); clearBtn.classList.add('hidden'); return; }
    clearBtn.classList.remove('hidden');

    let url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(val) + '&limit=8&countrycodes=in&addressdetails=1';
    if (currentLocation) {
        const d = 0.27;
        url += '&viewbox=' + (currentLocation.lon - d) + ',' + (currentLocation.lat + d) + ',' + (currentLocation.lon + d) + ',' + (currentLocation.lat - d);
        url += '&bounded=0';
    }

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.length) { results.innerHTML = '<div class="msd-item" style="color:var(--text2)">No results found</div>'; results.classList.add('show'); return; }
            window._searchResults = data.map(d => {
                const parts = d.display_name.split(',');
                return { lat: parseFloat(d.lat), lon: parseFloat(d.lon), name: parts[0].trim(), type: d.type, cls: d.class, sub: parts.slice(1, 3).join(',').trim() };
            });
            results.innerHTML = window._searchResults.map((r, i) => {
                const icon = getPlaceIcon(r.type, r.cls);
                return '<div class="msd-item" onclick="pickSearchResult(' + i + ')">' +
                    '<i class="fas ' + icon + '" style="min-width:16px"></i>' +
                    '<div style="display:flex;flex-direction:column;gap:1px"><span>' + escapeHtml(r.name) + '</span>' +
                    (r.sub ? '<span style="font-size:11px;color:var(--text2)">' + escapeHtml(r.sub.substring(0, 50)) + '</span>' : '') +
                    '</div></div>';
            }).join('');
            results.classList.add('show');
        }).catch(() => {});
}

function pickSearchResult(index) {
    const r = window._searchResults[index];
    if (r) selectMapLocation(r.lat, r.lon, r.name);
}

function selectMapLocation(lat, lon, name) {
    document.getElementById('mapSearchInput').value = name;
    document.getElementById('mapSearchResults').classList.remove('show');
    mainMap.flyTo([lat, lon], 15, { duration: 1.2 });
}

function clearMapSearch() {
    document.getElementById('mapSearchInput').value = '';
    document.getElementById('mapSearchResults').classList.remove('show');
    document.getElementById('mapSearchClear').classList.add('hidden');
}

// ====== PLACE ALL MARKERS ======
function placeAllMarkers() {
    // Incidents
    mapIncidents.forEach(inc => {
        const layerKey = inc.type === 'accident' ? 'accidents' : inc.type === 'pothole' ? 'potholes' : inc.type === 'traffic' ? 'traffic' : inc.type === 'flood' ? 'floods' : inc.type === 'construction' ? 'construction' : 'unsafe';
        const icon = typeToIcon[inc.type];
        const cls = typeToClass[inc.type];

        const marker = L.marker([inc.lat, inc.lon], {
            icon: L.divIcon({
                html: '<div class="custom-marker ' + cls + '"><i class="fas ' + icon + '"></i></div>',
                iconSize: [34, 34], iconAnchor: [17, 17], className: ''
            })
        });
        marker.bindPopup(buildIncidentPopup(inc));
        markerLayers[layerKey].addLayer(marker);
    });

    // Hospitals
    safetyServices.hospitals.forEach(h => {
        const marker = L.marker([h.lat, h.lon], {
            icon: L.divIcon({
                html: '<div class="custom-marker marker-hospital"><i class="fas fa-hospital"></i></div>',
                iconSize: [32, 32], iconAnchor: [16, 16], className: ''
            })
        });
        marker.bindPopup('<div class="mp-popup"><div class="mp-popup-title">' + escapeHtml(h.name) + '</div><div class="mp-popup-meta"><span><i class="fas fa-route"></i> ' + h.dist + ' km away</span></div><div class="mp-popup-btns"><button class="mp-nav-btn" onclick="navigateTo(' + h.lat + ',' + h.lon + ',\'' + escapeAttr(h.name) + '\')"><i class="fas fa-route"></i> Navigate</button></div></div>');
        markerLayers.hospitals.addLayer(marker);
    });

    // Police
    safetyServices.police.forEach(p => {
        const marker = L.marker([p.lat, p.lon], {
            icon: L.divIcon({
                html: '<div class="custom-marker marker-police"><i class="fas fa-shield"></i></div>',
                iconSize: [32, 32], iconAnchor: [16, 16], className: ''
            })
        });
        marker.bindPopup('<div class="mp-popup"><div class="mp-popup-title">' + escapeHtml(p.name) + '</div><div class="mp-popup-meta"><span><i class="fas fa-route"></i> ' + p.dist + ' km away</span></div><div class="mp-popup-btns"><button class="mp-nav-btn" onclick="navigateTo(' + p.lat + ',' + p.lon + ',\'' + escapeAttr(p.name) + '\')"><i class="fas fa-route"></i> Navigate</button></div></div>');
        markerLayers.police.addLayer(marker);
    });

    updateAnalytics();
}

function buildIncidentPopup(inc) {
    const sevColors = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    const distText = currentLocation ? haversine(currentLocation, { lat: inc.lat, lon: inc.lon }).toFixed(1) + ' km away' : 'Distance unknown';
    const typeLabel = inc.type.charAt(0).toUpperCase() + inc.type.slice(1);

    return '<div class="mp-popup">' +
        '<div class="mp-popup-type" style="color:var(--accent)">' + typeLabel + '</div>' +
        '<div class="mp-popup-title">' + escapeHtml(inc.title) + '</div>' +
        '<span class="mp-popup-sev ' + (sevColors[inc.severity] || 'medium') + '">' + inc.severity + '</span>' +
        '<p class="mp-popup-desc">' + escapeHtml(inc.desc) + '</p>' +
        '<div class="mp-popup-meta">' +
        '<span><i class="fas fa-clock"></i> ' + timeAgo(inc.time) + '</span>' +
        '<span><i class="fas fa-route"></i> ' + distText + '</span>' +
        '<span><i class="fas fa-check-circle"></i> ' + inc.confirmations + ' confirmed</span>' +
        '</div>' +
        '<div class="mp-popup-btns">' +
        '<button class="mp-nav-btn" onclick="navigateTo(' + inc.lat + ',' + inc.lon + ',\'' + escapeAttr(inc.title) + '\')"><i class="fas fa-route"></i> Navigate</button>' +
        '<button class="mp-report-btn" onclick="openMapReport()"><i class="fas fa-flag"></i> Report</button>' +
        '</div></div>';
}

// ====== TOGGLE MARKER LAYERS ======
function toggleMarkerLayer(key) {
    if (mainMap.hasLayer(markerLayers[key])) {
        mainMap.removeLayer(markerLayers[key]);
    } else {
        mainMap.addLayer(markerLayers[key]);
    }
}

// ====== THEME TOGGLE ======
function toggleMapTheme() {
    const dashboard = document.querySelector('.map-dashboard');
    if (mapTheme === 'dark') {
        mainMap.removeLayer(darkTile);
        lightTile.addTo(mainMap);
        mapTheme = 'light';
        dashboard.setAttribute('data-map-theme', 'light');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    } else {
        mainMap.removeLayer(lightTile);
        darkTile.addTo(mainMap);
        mapTheme = 'dark';
        dashboard.removeAttribute('data-map-theme');
        document.getElementById('themeIcon').className = 'fas fa-circle-half-stroke';
    }
}

// ====== NAVIGATION ======
function openNavPanel() {
    document.getElementById('navPanel').classList.remove('hidden');
    if (currentLocation) {
        reverseGeocode(currentLocation.lat, currentLocation.lon, function(addr) {
            document.getElementById('navFrom').value = addr;
        });
    }
}
function closeNavPanel() {
    document.getElementById('navPanel').classList.add('hidden');
}

function handleNavAutocomplete(val) {
    const list = document.getElementById('navAutocomplete');
    if (val.length < 2) { list.classList.remove('show'); return; }

    // Build Nominatim query biased to user's current location for nearby POI results
    let url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(val) + '&limit=8&countrycodes=in&addressdetails=1';
    if (currentLocation) {
        // Viewbox: ~30km around user for local results, but allow broader
        const d = 0.27; // ~30km in degrees
        url += '&viewbox=' + (currentLocation.lon - d) + ',' + (currentLocation.lat + d) + ',' + (currentLocation.lon + d) + ',' + (currentLocation.lat - d);
        url += '&bounded=0'; // prefer viewbox but allow outside
    }

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.length) {
                list.innerHTML = '<div class="msd-item" style="color:var(--text2);pointer-events:none"><i class="fas fa-circle-info"></i><span>No places found</span></div>';
                list.classList.add('show');
                return;
            }
            // Store results globally so onclick can reference by index
            window._navResults = data.map(d => {
                const parts = d.display_name.split(',');
                return { lat: parseFloat(d.lat), lon: parseFloat(d.lon), name: parts[0].trim(), type: d.type, cls: d.class, sub: parts.slice(1, 3).join(',').trim() };
            });
            list.innerHTML = window._navResults.map((r, i) => {
                const icon = getPlaceIcon(r.type, r.cls);
                return '<div class="msd-item" onclick="pickNavResult(' + i + ')">' +
                    '<i class="fas ' + icon + '" style="min-width:16px"></i>' +
                    '<div style="display:flex;flex-direction:column;gap:1px"><span>' + escapeHtml(r.name) + '</span>' +
                    (r.sub ? '<span style="font-size:11px;color:var(--text2)">' + escapeHtml(r.sub.substring(0, 45)) + '</span>' : '') +
                    '</div></div>';
            }).join('');
            list.classList.add('show');
        }).catch(() => {});
}

function pickNavResult(index) {
    const r = window._navResults[index];
    if (r) selectNavDest(r.lat, r.lon, r.name);
}

function getPlaceIcon(type, cls) {
    if (cls === 'amenity' && /hospital|clinic|doctor/i.test(type)) return 'fa-hospital';
    if (cls === 'amenity' && /school|college|university/i.test(type)) return 'fa-graduation-cap';
    if (cls === 'amenity' && /restaurant|cafe|fast_food/i.test(type)) return 'fa-utensils';
    if (cls === 'amenity' && /fuel|charging/i.test(type)) return 'fa-gas-pump';
    if (cls === 'amenity' && /bank|atm/i.test(type)) return 'fa-building-columns';
    if (cls === 'amenity' && /place_of_worship|temple|mosque|church/i.test(type)) return 'fa-place-of-worship';
    if (cls === 'amenity' && /police/i.test(type)) return 'fa-shield';
    if (cls === 'shop') return 'fa-store';
    if (cls === 'tourism') return 'fa-camera';
    if (cls === 'leisure') return 'fa-tree';
    if (cls === 'railway' || cls === 'station') return 'fa-train';
    if (cls === 'aeroway') return 'fa-plane';
    if (type === 'bus_stop' || type === 'bus_station') return 'fa-bus';
    if (cls === 'highway' || type === 'road' || type === 'residential') return 'fa-road';
    if (cls === 'place' || type === 'suburb' || type === 'neighbourhood') return 'fa-map-pin';
    return 'fa-location-dot';
}

function selectNavDest(lat, lon, name) {
    document.getElementById('navTo').value = name;
    document.getElementById('navAutocomplete').classList.remove('show');

    if (!currentLocation) { alert('Waiting for your location...'); return; }

    // Place red destination marker immediately
    if (destMarker) { mainMap.removeLayer(destMarker); destMarker = null; }
    destMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#E53935"/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>',
            iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -40], className: ''
        })
    }).addTo(mainMap).bindPopup('<b>' + escapeHtml(name) + '</b>').openPopup();

    // Fetch route via OSRM
    fetchRouteForNav(currentLocation.lat, currentLocation.lon, lat, lon, name);
}

function fetchRouteForNav(fromLat, fromLon, toLat, toLon, destName) {
    if (routePolyline) { mainMap.removeLayer(routePolyline); routePolyline = null; }
    clearRouteHazards();

    const url = 'https://router.project-osrm.org/route/v1/driving/' +
        fromLon + ',' + fromLat + ';' + toLon + ',' + toLat +
        '?overview=full&geometries=geojson';

    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data || data.code !== 'Ok' || !data.routes || !data.routes.length) {
                console.error('OSRM routing failed:', data);
                // Still show a straight line fallback
                routePolyline = L.polyline([[fromLat, fromLon], [toLat, toLon]], {
                    color: '#4285F4', weight: 5, opacity: 0.7,
                    dashArray: '10, 10', lineCap: 'round'
                }).addTo(mainMap);
                mainMap.fitBounds(routePolyline.getBounds(), { padding: [80, 80] });
                return;
            }
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

            routePolyline = L.polyline(coords, {
                color: '#4285F4', weight: 6, opacity: 0.85,
                lineCap: 'round', lineJoin: 'round'
            }).addTo(mainMap);

            // Ensure destination marker exists
            if (!destMarker) {
                destMarker = L.marker([toLat, toLon], {
                    icon: L.divIcon({
                        html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#E53935"/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>',
                        iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -40], className: ''
                    })
                }).addTo(mainMap).bindPopup('<b>' + escapeHtml(destName) + '</b>');
            }

            mainMap.fitBounds(routePolyline.getBounds(), { padding: [80, 80] });

            // Place demo hazard markers along the route
            placeRouteHazards(coords);

            const distKm = (route.distance / 1000).toFixed(1);
            const durMin = Math.round(route.duration / 60);

            document.getElementById('nriDist').textContent = distKm + ' km';
            document.getElementById('nriTime').textContent = durMin + ' min';
            document.getElementById('nriSafety').textContent = navMode === 'safe' ? 'Safe' : navMode === 'fast' ? 'Fast' : 'Low Risk';
            document.getElementById('navRouteInfo').classList.remove('hidden');
            document.getElementById('navGoBtn').classList.remove('hidden');

            // Route info pill
            document.getElementById('routeInfoText').textContent = distKm + ' km · ' + durMin + ' min via ' + (navMode === 'safe' ? 'Safest' : navMode === 'fast' ? 'Fastest' : 'Low Risk') + ' Route';
            document.getElementById('routeInfoPill').classList.remove('hidden');

            // AI voice alert
            speakAlert('Route calculated. ' + distKm + ' kilometers, estimated ' + durMin + ' minutes.');
        })
        .catch(err => {
            console.error('Route fetch error:', err);
            // Fallback: draw straight line
            routePolyline = L.polyline([[fromLat, fromLon], [toLat, toLon]], {
                color: '#4285F4', weight: 5, opacity: 0.7,
                dashArray: '10, 10', lineCap: 'round'
            }).addTo(mainMap);
            mainMap.fitBounds(routePolyline.getBounds(), { padding: [80, 80] });
        });
}

function navigateTo(lat, lon, name) {
    mainMap.closePopup();
    openNavPanel();
    document.getElementById('navTo').value = name;
    // Place red destination marker
    if (destMarker) { mainMap.removeLayer(destMarker); destMarker = null; }
    destMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#E53935"/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>',
            iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -40], className: ''
        })
    }).addTo(mainMap).bindPopup('<b>' + escapeHtml(name) + '</b>');
    if (currentLocation) fetchRouteForNav(currentLocation.lat, currentLocation.lon, lat, lon, name);
}

function setNavMode(mode) {
    navMode = mode;
    document.querySelectorAll('.navp-opt').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

function startNavigation() {
    closeNavPanel();
    speakAlert('Navigation started. Drive safely.');
    showAiAlert('Navigation active. AI is monitoring your route for hazards.');
}

function clearRoute() {
    if (routePolyline) { mainMap.removeLayer(routePolyline); routePolyline = null; }
    if (destMarker) { mainMap.removeLayer(destMarker); destMarker = null; }
    clearRouteHazards();
    document.getElementById('routeInfoPill').classList.add('hidden');
    document.getElementById('navRouteInfo').classList.add('hidden');
    document.getElementById('navGoBtn').classList.add('hidden');
    document.getElementById('navTo').value = '';
    if (currentLocation) mainMap.flyTo([currentLocation.lat, currentLocation.lon], 14, { duration: 0.8 });
}

// ====== ROUTE HAZARD MARKERS ======
const routeHazardTypes = [
    { type: 'pothole', label: 'Pothole', icon: 'fa-road-circle-exclamation', color: '#FF9800', bg: '#FFF3E0', desc: 'Deep pothole reported. Slow down and stay alert.' },
    { type: 'blocked', label: 'Road Blocked', icon: 'fa-road-barrier', color: '#F44336', bg: '#FFEBEE', desc: 'Road partially blocked due to debris/construction.' },
    { type: 'waterlog', label: 'Water Congestion', icon: 'fa-water', color: '#2196F3', bg: '#E3F2FD', desc: 'Waterlogging reported. Avoid during heavy rain.' },
];

function placeRouteHazards(routeCoords) {
    clearRouteHazards();
    if (!routeCoords || routeCoords.length < 10) return;

    // Pick 1 point along the route (not at start/end)
    const total = routeCoords.length;
    const hazardCount = 1;
    const usedIndices = [];

    for (let h = 0; h < hazardCount; h++) {
        // Spread hazards between 15% and 85% of route
        const minIdx = Math.floor(total * 0.15);
        const maxIdx = Math.floor(total * 0.85);
        let idx;
        let tries = 0;
        do {
            idx = minIdx + Math.floor(Math.random() * (maxIdx - minIdx));
            tries++;
        } while (usedIndices.some(u => Math.abs(u - idx) < Math.floor(total * 0.08)) && tries < 20);
        usedIndices.push(idx);

        // Offset slightly from exact route point so markers are visible
        const lat = routeCoords[idx][0] + (Math.random() - 0.5) * 0.001;
        const lon = routeCoords[idx][1] + (Math.random() - 0.5) * 0.001;
        const hazard = routeHazardTypes[h % routeHazardTypes.length];

        const marker = L.marker([lat, lon], {
            icon: L.divIcon({
                html: '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:' + hazard.bg + ';border:2px solid ' + hazard.color + ';box-shadow:0 2px 8px rgba(0,0,0,.25)"><i class="fas ' + hazard.icon + '" style="color:' + hazard.color + ';font-size:14px"></i></div>',
                iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18], className: ''
            }),
            zIndexOffset: 500
        }).addTo(mainMap);

        marker.bindPopup(
            '<div style="min-width:180px;padding:4px">' +
            '<div style="font-weight:700;font-size:14px;color:' + hazard.color + ';margin-bottom:4px"><i class="fas ' + hazard.icon + '"></i> ' + hazard.label + '</div>' +
            '<div style="font-size:12px;color:#555;margin-bottom:6px">' + hazard.desc + '</div>' +
            '<div style="font-size:11px;color:#999"><i class="fas fa-clock"></i> Reported ' + Math.floor(Math.random() * 30 + 5) + ' min ago · ' + Math.floor(Math.random() * 20 + 5) + ' confirmations</div>' +
            '</div>'
        );

        routeHazards.push(marker);
    }
}

function clearRouteHazards() {
    routeHazards.forEach(m => mainMap.removeLayer(m));
    routeHazards = [];
}

// ====== AI ALERTS ======
let aiAlertIdx = 0;
function startAiAlerts() {
    showNextAiAlert();
    setInterval(showNextAiAlert, 15000);
}
function showNextAiAlert() {
    const alert = aiAlerts[aiAlertIdx % aiAlerts.length];
    aiAlertIdx++;
    showAiAlert(alert.text);
}
function showAiAlert(text) {
    document.getElementById('aiAlertText').textContent = text;
    document.getElementById('aiAlertBanner').classList.remove('hidden');
}
function dismissAiAlert() {
    document.getElementById('aiAlertBanner').classList.add('hidden');
}

// ====== VOICE ALERTS ======
function speakAlert(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1; utter.pitch = 1; utter.volume = 0.8;
    speechSynthesis.speak(utter);
}

// ====== NOTIFICATIONS ======
function populateNotifications() {
    const list = document.getElementById('npList');
    list.innerHTML = notifData.map(n =>
        '<div class="np-item"><div class="np-icon ' + n.color + '"><i class="fas ' + n.icon + '"></i></div><div class="np-text"><strong>' + n.title + '</strong>' + n.text + '<div class="np-time">' + n.time + '</div></div></div>'
    ).join('');
}
function toggleNotifPanel() {
    document.getElementById('notifPanel').classList.toggle('hidden');
}

// ====== ANALYTICS ======
function updateAnalytics() {
    const counts = { accidents: 0, potholes: 0, traffic: 0, floods: 0, construction: 0 };
    mapIncidents.forEach(inc => {
        if (inc.type === 'accident') counts.accidents++;
        else if (inc.type === 'pothole') counts.potholes++;
        else if (inc.type === 'traffic') counts.traffic++;
        else if (inc.type === 'flood') counts.floods++;
        else if (inc.type === 'construction') counts.construction++;
    });
    document.getElementById('statAccidents').textContent = counts.accidents;
    document.getElementById('statPotholes').textContent = counts.potholes;
    document.getElementById('statTraffic').textContent = counts.traffic;
    document.getElementById('statFloods').textContent = counts.floods;
    document.getElementById('statConstruction').textContent = counts.construction;

    // Safety score
    const total = mapIncidents.length;
    const critical = mapIncidents.filter(i => i.severity === 'critical').length;
    const score = Math.max(10, Math.round(100 - (critical * 15) - (total * 2)));
    const offset = 327 - (327 * score / 100);
    const ring = document.getElementById('ringFill');
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('ringValue').textContent = score;
    const label = document.getElementById('safetyLabel');
    label.textContent = score >= 70 ? 'Safe Area' : score >= 40 ? 'Exercise Caution' : 'High Risk Zone';
    label.style.color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

    // Traffic
    const trafficLevel = Math.min(100, 20 + counts.traffic * 20 + total * 3);
    document.getElementById('trafficFill').style.width = trafficLevel + '%';
    const tl = document.getElementById('trafficLabel');
    tl.textContent = trafficLevel < 40 ? 'Light' : trafficLevel < 70 ? 'Moderate' : 'Heavy';
    tl.style.color = trafficLevel < 40 ? 'var(--green)' : trafficLevel < 70 ? 'var(--yellow)' : 'var(--red)';
}

// ====== WEATHER ======
function simulateWeather() {
    const conditions = [
        { icon: 'fa-sun', label: 'Clear', detail: 'Good driving conditions', temp: '32°C' },
        { icon: 'fa-cloud-sun', label: 'Partly Cloudy', detail: 'Moderate visibility', temp: '28°C' },
        { icon: 'fa-cloud-rain', label: 'Rainy', detail: 'Slippery roads – drive slow', temp: '24°C' },
        { icon: 'fa-cloud-bolt', label: 'Thunderstorm', detail: 'Avoid travel if possible', temp: '22°C' },
    ];
    function update() {
        const w = conditions[Math.floor(Math.random() * conditions.length)];
        document.querySelector('#mtbWeather i').className = 'fas ' + w.icon;
        document.querySelector('#mtbWeather span').textContent = w.temp;
        document.querySelector('#weatherAlertInfo i').className = 'fas ' + w.icon;
        document.getElementById('weatherCondition').textContent = w.label;
        document.getElementById('weatherDetail').textContent = w.detail;
    }
    update();
    setInterval(update, 20000);
}

// ====== PANELS ======
function toggleAnalytics() {
    const panel = document.getElementById('analyticsPanel');
    const icon = document.getElementById('apToggleIcon');
    panel.classList.toggle('collapsed');
    icon.className = panel.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
}

function toggleLayers() {
    document.getElementById('layersDropdown').classList.toggle('hidden');
}

// Emergency panel
function openEmergencyPanel() { document.getElementById('emergencyPanel').classList.remove('hidden'); showEmergencyTab('hospitals'); }
function closeEmergencyPanel() { document.getElementById('emergencyPanel').classList.add('hidden'); }
function showEmergencyTab(tab) {
    document.querySelectorAll('.emp-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.emp-tab[onclick*="' + tab + '"]').classList.add('active');
    const list = document.getElementById('empList');
    const items = safetyServices[tab];
    list.innerHTML = items.map(item =>
        '<div class="emp-item">' +
        '<div class="emp-item-icon ' + (tab === 'hospitals' ? 'hospital' : 'police') + '"><i class="fas ' + (tab === 'hospitals' ? 'fa-hospital' : 'fa-shield') + '"></i></div>' +
        '<div class="emp-item-info"><div class="emp-item-name">' + escapeHtml(item.name) + '</div><div class="emp-item-dist">' + item.dist + ' km away</div></div>' +
        '<button class="emp-item-nav" onclick="navigateTo(' + item.lat + ',' + item.lon + ',\'' + escapeAttr(item.name) + '\')"><i class="fas fa-route"></i></button>' +
        '</div>'
    ).join('');
}

// Quick report
function openMapReport() { document.getElementById('quickReport').classList.remove('hidden'); }
function closeMapReport() { document.getElementById('quickReport').classList.add('hidden'); }
function quickReportSubmit(type) {
    closeMapReport();
    if (!currentLocation) { showToast('Location not available. Report saved.'); return; }

    const newInc = {
        id: Date.now(), type: type.toLowerCase().replace(/ /g, ''),
        title: type + ' reported', desc: 'Reported by community user at this location.',
        lat: currentLocation.lat + (Math.random() - 0.5) * 0.01,
        lon: currentLocation.lon + (Math.random() - 0.5) * 0.01,
        severity: 'medium', time: Date.now(), confirmations: 1, city: 'Nearby'
    };
    mapIncidents.push(newInc);

    const layerMap = { 'accident': 'accidents', 'pothole': 'potholes', 'trafficjam': 'traffic', 'roadflooding': 'floods', 'construction': 'construction', 'brokensignal': 'traffic', 'unsafedriving': 'unsafe', 'roadblock': 'construction' };
    const layerKey = layerMap[newInc.type] || 'unsafe';
    const icon = typeToIcon[Object.keys(typeToIcon).find(k => newInc.type.includes(k)) || 'unsafe'] || 'fa-circle-exclamation';
    const cls = typeToClass[Object.keys(typeToClass).find(k => newInc.type.includes(k)) || 'unsafe'] || 'marker-unsafe';

    const marker = L.marker([newInc.lat, newInc.lon], {
        icon: L.divIcon({
            html: '<div class="custom-marker ' + cls + '"><i class="fas ' + icon + '"></i></div>',
            iconSize: [34, 34], iconAnchor: [17, 17], className: ''
        })
    });
    marker.bindPopup(buildIncidentPopup(newInc));
    if (markerLayers[layerKey]) markerLayers[layerKey].addLayer(marker);

    updateAnalytics();
    showToast(type + ' reported successfully!');
    speakAlert(type + ' reported near your location. Stay alert.');
}

// ====== UTILITY ======
function reverseGeocode(lat, lon, callback) {
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon)
        .then(r => r.json())
        .then(d => callback(d.address.city || d.address.town || d.address.village || d.display_name.split(',')[0] || 'Unknown'))
        .catch(() => callback(lat.toFixed(4) + ', ' + lon.toFixed(4)));
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
}

function haversine(a, b) {
    const R = 6371, toRad = x => x * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function debounce(fn, ms) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ====== MODALS ======
function openModal(id) {
    document.getElementById(id).classList.add('show');
    if (id === 'statsModal') populateCityStats();
}
function closeModal(e, id) { if (e.target === e.currentTarget) document.getElementById(id).classList.remove('show'); }
function closeModalDirect(id) { document.getElementById(id).classList.remove('show'); }

// ====== CITY STATISTICS DATA ======
let userCity = null;
const cityStatsData = {
    'Bangalore': {
        stats: [
            { num: '7,800+', desc: 'Accidents reported annually', color: '' },
            { num: '850+', desc: 'Lives lost every year', color: 'red' },
            { num: '42%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '28%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '35%', desc: 'Accidents at night', color: '' }
        ],
        source: 'Source: Bangalore Traffic Police & NCRB Data'
    },
    'Mumbai': {
        stats: [
            { num: '3,200+', desc: 'Accidents reported annually', color: '' },
            { num: '1,200+', desc: 'Lives lost every year', color: 'red' },
            { num: '38%', desc: 'Pedestrian fatalities', color: 'yellow' },
            { num: '25%', desc: 'Due to drunk driving', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '22%', desc: 'Hit & run incidents', color: '' }
        ],
        source: 'Source: Mumbai Traffic Police & NCRB Data'
    },
    'Delhi': {
        stats: [
            { num: '6,200+', desc: 'Accidents reported annually', color: '' },
            { num: '1,500+', desc: 'Lives lost every year', color: 'red' },
            { num: '44%', desc: 'Pedestrian & cyclist fatalities', color: 'yellow' },
            { num: '31%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '40%', desc: 'Hit & run cases', color: '' }
        ],
        source: 'Source: Delhi Traffic Police & NCRB Data'
    },
    'Chennai': {
        stats: [
            { num: '6,400+', desc: 'Accidents reported annually', color: '' },
            { num: '1,100+', desc: 'Lives lost every year', color: 'red' },
            { num: '40%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '27%', desc: 'Due to signal violations', color: 'red' },
            { num: '20-40', desc: 'Most affected age group', color: 'yellow' },
            { num: '30%', desc: 'Accidents at intersections', color: '' }
        ],
        source: 'Source: Chennai Traffic Police & NCRB Data'
    },
    'Hyderabad': {
        stats: [
            { num: '4,500+', desc: 'Accidents reported annually', color: '' },
            { num: '700+', desc: 'Lives lost every year', color: 'red' },
            { num: '45%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '30%', desc: 'Due to reckless driving', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '25%', desc: 'Accidents on highways', color: '' }
        ],
        source: 'Source: Hyderabad Traffic Police & NCRB Data'
    },
    'Kolkata': {
        stats: [
            { num: '3,800+', desc: 'Accidents reported annually', color: '' },
            { num: '500+', desc: 'Lives lost every year', color: 'red' },
            { num: '35%', desc: 'Pedestrian fatalities', color: 'yellow' },
            { num: '22%', desc: 'Due to wrong-side driving', color: 'red' },
            { num: '25-45', desc: 'Most affected age group', color: 'yellow' },
            { num: '18%', desc: 'Heavy vehicle involved', color: '' }
        ],
        source: 'Source: Kolkata Traffic Police & NCRB Data'
    },
    'Pune': {
        stats: [
            { num: '5,100+', desc: 'Accidents reported annually', color: '' },
            { num: '750+', desc: 'Lives lost every year', color: 'red' },
            { num: '48%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '33%', desc: 'Due to speeding', color: 'red' },
            { num: '18-30', desc: 'Most affected age group', color: 'yellow' },
            { num: '28%', desc: 'Accidents on ring road', color: '' }
        ],
        source: 'Source: Pune Traffic Police & NCRB Data'
    },
    'Ahmedabad': {
        stats: [
            { num: '3,900+', desc: 'Accidents reported annually', color: '' },
            { num: '600+', desc: 'Lives lost every year', color: 'red' },
            { num: '38%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '26%', desc: 'Due to signal jumping', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '32%', desc: 'Accidents at night', color: '' }
        ],
        source: 'Source: Ahmedabad Traffic Police & NCRB Data'
    },
    'Jaipur': {
        stats: [
            { num: '5,500+', desc: 'Accidents reported annually', color: '' },
            { num: '900+', desc: 'Lives lost every year', color: 'red' },
            { num: '50%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '35%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '40%', desc: 'Accidents on highways', color: '' }
        ],
        source: 'Source: Jaipur Traffic Police & NCRB Data'
    },
    'Lucknow': {
        stats: [
            { num: '4,200+', desc: 'Accidents reported annually', color: '' },
            { num: '800+', desc: 'Lives lost every year', color: 'red' },
            { num: '36%', desc: 'Pedestrian fatalities', color: 'yellow' },
            { num: '29%', desc: 'Due to overloading', color: 'red' },
            { num: '20-40', desc: 'Most affected age group', color: 'yellow' },
            { num: '33%', desc: 'Heavy vehicle involved', color: '' }
        ],
        source: 'Source: Lucknow Traffic Police & NCRB Data'
    },
    'Chandigarh': {
        stats: [
            { num: '1,400+', desc: 'Accidents reported annually', color: '' },
            { num: '180+', desc: 'Lives lost every year', color: 'red' },
            { num: '42%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '34%', desc: 'Due to speeding', color: 'red' },
            { num: '18-30', desc: 'Most affected age group', color: 'yellow' },
            { num: '20%', desc: 'Due to drunk driving', color: '' }
        ],
        source: 'Source: Chandigarh Traffic Police & NCRB Data'
    },
    'Indore': {
        stats: [
            { num: '2,800+', desc: 'Accidents reported annually', color: '' },
            { num: '500+', desc: 'Lives lost every year', color: 'red' },
            { num: '44%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '30%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '25%', desc: 'Accidents at night', color: '' }
        ],
        source: 'Source: Indore Traffic Police & NCRB Data'
    },
    'Surat': {
        stats: [
            { num: '2,100+', desc: 'Accidents reported annually', color: '' },
            { num: '350+', desc: 'Lives lost every year', color: 'red' },
            { num: '40%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '28%', desc: 'Due to reckless driving', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '22%', desc: 'Hit & run cases', color: '' }
        ],
        source: 'Source: Surat Traffic Police & NCRB Data'
    },
    'Nagpur': {
        stats: [
            { num: '2,500+', desc: 'Accidents reported annually', color: '' },
            { num: '450+', desc: 'Lives lost every year', color: 'red' },
            { num: '38%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '26%', desc: 'Due to speeding', color: 'red' },
            { num: '20-40', desc: 'Most affected age group', color: 'yellow' },
            { num: '30%', desc: 'Accidents on highways', color: '' }
        ],
        source: 'Source: Nagpur Traffic Police & NCRB Data'
    },
    'Bhopal': {
        stats: [
            { num: '3,100+', desc: 'Accidents reported annually', color: '' },
            { num: '550+', desc: 'Lives lost every year', color: 'red' },
            { num: '42%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '31%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '27%', desc: 'Accidents at night', color: '' }
        ],
        source: 'Source: Bhopal Traffic Police & NCRB Data'
    },
    'Kochi': {
        stats: [
            { num: '4,800+', desc: 'Accidents reported annually', color: '' },
            { num: '650+', desc: 'Lives lost every year', color: 'red' },
            { num: '46%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '24%', desc: 'Due to reckless overtaking', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '35%', desc: 'Accidents during rain', color: '' }
        ],
        source: 'Source: Kerala Traffic Police & NCRB Data'
    },
    'Visakhapatnam': {
        stats: [
            { num: '2,300+', desc: 'Accidents reported annually', color: '' },
            { num: '400+', desc: 'Lives lost every year', color: 'red' },
            { num: '39%', desc: 'Two-wheeler accidents', color: 'yellow' },
            { num: '27%', desc: 'Due to speeding', color: 'red' },
            { num: '20-40', desc: 'Most affected age group', color: 'yellow' },
            { num: '30%', desc: 'Accidents on national highways', color: '' }
        ],
        source: 'Source: Visakhapatnam Traffic Police & NCRB Data'
    },
    'Ghaziabad': {
        stats: [
            { num: '2,000+', desc: 'Accidents reported annually', color: '' },
            { num: '350+', desc: 'Lives lost every year', color: 'red' },
            { num: '36%', desc: 'Pedestrian fatalities', color: 'yellow' },
            { num: '32%', desc: 'Due to speeding', color: 'red' },
            { num: '18-35', desc: 'Most affected age group', color: 'yellow' },
            { num: '38%', desc: 'Heavy vehicle involved', color: '' }
        ],
        source: 'Source: Ghaziabad Traffic Police & NCRB Data'
    }
};

function detectUserCity() {
    if (userCity) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos) {
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude)
            .then(r => r.json())
            .then(d => {
                const city = d.address.city || d.address.town || d.address.village || '';
                // Match with known cities (fuzzy – e.g. "Bengaluru" → "Bangalore")
                const aliases = { 'Bengaluru': 'Bangalore', 'New Delhi': 'Delhi', 'Kolkata': 'Kolkata', 'Ernakulam': 'Kochi', 'Vizag': 'Visakhapatnam' };
                userCity = aliases[city] || city;
                // Also try matching from state/district if city name differs
                if (!cityStatsData[userCity]) {
                    for (const key of Object.keys(cityStatsData)) {
                        if (city.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(city.toLowerCase())) {
                            userCity = key;
                            break;
                        }
                    }
                }
            })
            .catch(function(){});
    }, function(){}, { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 });
}

function populateCityStats() {
    const section = document.getElementById('cityStatsSection');
    const grid = document.getElementById('cityStatsGrid');
    const title = document.getElementById('cityStatsTitle');
    const source = document.getElementById('cityStatsSource');

    if (!userCity || !cityStatsData[userCity]) {
        section.style.display = 'none';
        return;
    }

    const data = cityStatsData[userCity];
    title.textContent = userCity;
    source.textContent = data.source;
    grid.innerHTML = data.stats.map(function(s) {
        return '<div class="stat-card ' + s.color + '"><div class="stat-num">' + s.num + '</div><div class="stat-desc">' + s.desc + '</div></div>';
    }).join('');
    section.style.display = 'block';
}

// ====== HELPERS ======
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// ====== COMMUNITY REPORTS ======
let reportMap = null;
let reportMapReady = false;
let reportMarker = null;
let reportLocation = null;
let selectedType = '';
let selectedSeverity = '';
let communityReports = [];
let feedMiniMaps = [];

// Demo data for live feed
const demoReports = [
    { id: 1, type: 'Accident', desc: 'Two-wheeler collision near MG Road junction. Traffic backed up for 2km. Ambulance on its way.', severity: 'Critical', lat: 12.9756, lon: 77.6021, reporter: 'Rahul K.', time: Date.now() - 300000, confirmations: 14, image: null, city: 'Bangalore' },
    { id: 2, type: 'Pothole', desc: 'Large pothole on outer ring road near Marathahalli bridge. Dangerous for two-wheelers especially at night.', severity: 'High', lat: 12.9568, lon: 77.7010, reporter: 'Anitha M.', time: Date.now() - 900000, confirmations: 23, image: null, city: 'Bangalore' },
    { id: 3, type: 'Traffic Jam', desc: 'Heavy congestion on NH-48 due to waterlogging. Expect 45 min delays. Avoid if possible.', severity: 'Medium', lat: 19.1136, lon: 72.8697, reporter: 'Anonymous', time: Date.now() - 1800000, confirmations: 31, image: null, city: 'Mumbai' },
    { id: 4, type: 'Road Flooding', desc: 'Underpass completely flooded near Moolchand. Water level rising. Vehicles stranded.', severity: 'Critical', lat: 28.5689, lon: 77.2415, reporter: 'Priya S.', time: Date.now() - 600000, confirmations: 47, image: null, city: 'Delhi' },
    { id: 5, type: 'Construction Work', desc: 'Metro construction blocking 2 lanes on Hosur Road. Diversions in place but not well marked.', severity: 'Low', lat: 12.9344, lon: 77.6101, reporter: 'Karthik R.', time: Date.now() - 3600000, confirmations: 8, image: null, city: 'Bangalore' },
    { id: 6, type: 'Broken Traffic Signal', desc: 'Traffic signal at Silk Board junction not working since morning. Police managing traffic manually.', severity: 'High', lat: 12.9177, lon: 77.6238, reporter: 'Deepa V.', time: Date.now() - 7200000, confirmations: 36, image: null, city: 'Bangalore' },
    { id: 7, type: 'Unsafe Driving', desc: 'Truck overspeeding on wrong side near Huda City Centre. Multiple near-misses reported by commuters.', severity: 'Critical', lat: 28.4595, lon: 77.0725, reporter: 'Arjun T.', time: Date.now() - 1200000, confirmations: 19, image: null, city: 'Gurugram' },
    { id: 8, type: 'Animal on Road', desc: 'Stray cattle herd on highway near Jaipur bypass. Around 8-10 cows blocking both lanes.', severity: 'Medium', lat: 26.9124, lon: 75.7873, reporter: 'Vikram P.', time: Date.now() - 5400000, confirmations: 12, image: null, city: 'Jaipur' },
    { id: 9, type: 'Poor Street Lighting', desc: 'Entire stretch from Hebbal to Yelahanka has no working street lights. Extremely dangerous at night.', severity: 'High', lat: 13.0358, lon: 77.5970, reporter: 'Meena L.', time: Date.now() - 14400000, confirmations: 28, image: null, city: 'Bangalore' },
    { id: 10, type: 'Road Block', desc: 'Fallen tree blocking road after heavy winds near Electronic City Phase 2. Authorities notified.', severity: 'High', lat: 12.8456, lon: 77.6603, reporter: 'Anonymous', time: Date.now() - 2700000, confirmations: 15, image: null, city: 'Bangalore' },
];

const typeIcons = {
    'Accident': 'fa-car-burst', 'Pothole': 'fa-road-circle-exclamation', 'Traffic Jam': 'fa-car',
    'Road Flooding': 'fa-water', 'Construction Work': 'fa-helmet-safety', 'Broken Traffic Signal': 'fa-traffic-light',
    'Unsafe Driving': 'fa-gauge-high', 'Road Block': 'fa-road-barrier', 'Animal on Road': 'fa-cow',
    'Poor Street Lighting': 'fa-lightbulb', 'Other': 'fa-circle-exclamation'
};

// Init community when section loads
function initCommunity() {
    communityReports = [...demoReports];
    setupTypeChips();
    setupSeverityButtons();
    setupFeedFilters();
    renderFeed('all');
}

function setupTypeChips() {
    document.querySelectorAll('.type-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedType = this.dataset.type;
        });
    });
}

function setupSeverityButtons() {
    document.querySelectorAll('.sev-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedSeverity = this.dataset.sev;
        });
    });
}

function setupFeedFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            renderFeed(this.dataset.filter);
        });
    });
}

function toggleReportForm() {
    const panel = document.getElementById('reportFormPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !reportMapReady) {
        setTimeout(initReportMap, 200);
    }
}

function initReportMap() {
    reportMap = L.map('reportMap').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19
    }).addTo(reportMap);
    reportMapReady = true;

    reportMap.on('click', function (e) {
        placeReportPin(e.latlng.lat, e.latlng.lng);
    });
}

function detectReportLocation() {
    if (!navigator.geolocation) return;
    document.getElementById('reportLocStatus').textContent = 'Detecting...';
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            placeReportPin(pos.coords.latitude, pos.coords.longitude);
            if (reportMap) reportMap.setView([pos.coords.latitude, pos.coords.longitude], 15);
        },
        function () {
            document.getElementById('reportLocStatus').textContent = 'Failed – tap map to pin';
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function placeReportPin(lat, lon) {
    reportLocation = { lat, lon };
    if (reportMarker) reportMap.removeLayer(reportMarker);
    reportMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div style="width:16px;height:16px;background:#e74c3c;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(231,76,60,.6)"></div>',
            iconSize: [22, 22], iconAnchor: [11, 11]
        })
    }).addTo(reportMap);
    reportMap.setView([lat, lon], 15);
    const statusEl = document.getElementById('reportLocStatus');
    statusEl.textContent = lat.toFixed(4) + ', ' + lon.toFixed(4);
    statusEl.classList.add('detected');
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); input.value = ''; return; }

    document.getElementById('uploadPlaceholder').style.display = 'none';
    const preview = document.getElementById('uploadPreview');
    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB';

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="preview"><div class="preview-info"><div class="preview-name">' + file.name + '</div><div class="preview-size">' + sizeStr + '</div><button type="button" class="btn-remove-file" onclick="removeUpload()"><i class="fas fa-trash"></i> Remove</button></div>';
            preview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<div style="font-size:32px;color:var(--accent)"><i class="fas fa-video"></i></div><div class="preview-info"><div class="preview-name">' + file.name + '</div><div class="preview-size">' + sizeStr + '</div><button type="button" class="btn-remove-file" onclick="removeUpload()"><i class="fas fa-trash"></i> Remove</button></div>';
        preview.style.display = 'flex';
    }
}

function removeUpload() {
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = '';
}

function submitReport(e) {
    e.preventDefault();
    if (!selectedType) { alert('Please select an incident type.'); return; }
    if (!selectedSeverity) { alert('Please select a severity level.'); return; }

    const desc = document.getElementById('reportDesc').value;
    const isAnon = document.getElementById('anonToggle').checked;
    const user = getCurrentUser();
    const fileInput = document.getElementById('fileInput');
    let imageData = null;

    if (fileInput.files[0] && fileInput.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            imageData = ev.target.result;
            addReport(desc, isAnon, user, imageData);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        addReport(desc, isAnon, user, null);
    }
}

function addReport(desc, isAnon, user, imageData) {
    const report = {
        id: Date.now(),
        type: selectedType,
        desc: desc,
        severity: selectedSeverity,
        lat: reportLocation ? reportLocation.lat : (currentLocation ? currentLocation.lat : 20.5937),
        lon: reportLocation ? reportLocation.lon : (currentLocation ? currentLocation.lon : 78.9629),
        reporter: isAnon ? 'Anonymous' : (user ? user.username : 'Anonymous'),
        time: Date.now(),
        confirmations: 0,
        image: imageData,
        city: 'Nearby'
    };

    communityReports.unshift(report);
    renderFeed(document.querySelector('.filter-chip.active').dataset.filter);

    // Reset form
    document.getElementById('incidentForm').reset();
    document.querySelectorAll('.type-chip, .sev-btn').forEach(el => el.classList.remove('active'));
    selectedType = '';
    selectedSeverity = '';
    removeUpload();
    if (reportMarker) { reportMap.removeLayer(reportMarker); reportMarker = null; }
    reportLocation = null;
    document.getElementById('reportLocStatus').textContent = 'No location set';
    document.getElementById('reportLocStatus').classList.remove('detected');
    toggleReportForm();

    showToast('Report submitted successfully!');
}

function distanceFromUser(lat, lon) {
    if (!currentLocation) return '—';
    const d = haversine(currentLocation, { lat, lon });
    return d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km';
}

function renderFeed(filter) {
    // Destroy old mini maps
    feedMiniMaps.forEach(m => m.remove());
    feedMiniMaps = [];

    let reports = [...communityReports];
    if (filter === 'Critical') {
        reports = reports.filter(r => r.severity === 'Critical');
    } else if (filter !== 'all') {
        reports = reports.filter(r => r.type === filter);
    }

    const grid = document.getElementById('feedGrid');
    if (!reports.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text2)"><i class="fas fa-inbox" style="font-size:36px;margin-bottom:12px;display:block;color:var(--border)"></i>No reports found</div>';
        return;
    }

    grid.innerHTML = reports.map(r => {
        const icon = typeIcons[r.type] || 'fa-circle-exclamation';
        const sevClass = 'sev-' + r.severity.toLowerCase();
        const imageHtml = r.image
            ? '<img class="rc-image" src="' + r.image + '" alt="incident">'
            : '<div class="rc-image-placeholder"><i class="fas ' + icon + '"></i></div>';

        return '<div class="report-card" data-id="' + r.id + '">' +
            imageHtml +
            '<div class="rc-body">' +
            '<div class="rc-top"><span class="rc-type"><i class="fas ' + icon + '"></i> ' + r.type + '</span><span class="rc-severity ' + sevClass + '">' + r.severity + '</span></div>' +
            '<p class="rc-desc">' + escapeHtml(r.desc) + '</p>' +
            '<div class="rc-meta"><span><i class="fas fa-clock"></i> ' + timeAgo(r.time) + '</span><span><i class="fas fa-location-dot"></i> ' + distanceFromUser(r.lat, r.lon) + '</span><span><i class="fas fa-city"></i> ' + escapeHtml(r.city) + '</span></div>' +
            '<div class="rc-minimap" id="minimap-' + r.id + '"></div>' +
            '<div class="rc-footer">' +
            '<span class="rc-reporter"><i class="fas fa-user"></i> ' + escapeHtml(r.reporter) + '</span>' +
            '<div class="rc-actions"><button class="btn-upvote" onclick="upvoteReport(' + r.id + ', this)"><i class="fas fa-check-circle"></i> Confirm</button><span class="confirm-count">' + r.confirmations + ' confirmed</span></div>' +
            '</div></div></div>';
    }).join('');

    // Init mini maps after DOM is ready
    setTimeout(() => {
        reports.forEach(r => {
            const el = document.getElementById('minimap-' + r.id);
            if (!el) return;
            const mm = L.map(el, { zoomControl: false, dragging: false, scrollWheelZoom: false, attributionControl: false }).setView([r.lat, r.lon], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 16 }).addTo(mm);
            L.circleMarker([r.lat, r.lon], { radius: 6, color: '#e74c3c', fillColor: '#e74c3c', fillOpacity: 0.8, weight: 2 }).addTo(mm);
            feedMiniMaps.push(mm);
        });
    }, 100);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function upvoteReport(id, btn) {
    const report = communityReports.find(r => r.id === id);
    if (!report) return;
    if (btn.classList.contains('upvoted')) return;
    report.confirmations++;
    btn.classList.add('upvoted');
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmed';
    btn.nextElementSibling.textContent = report.confirmations + ' confirmed';
}

function showToast(msg) {
    let toast = document.getElementById('appToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
