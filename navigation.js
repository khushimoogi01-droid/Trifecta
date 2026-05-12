// ====== INITIALIZATION ======
let map;
let userMarker;
let originMarker;
let destinationMarker;
let routePolylines = [];
let hazardMarkers = [];
let currentLocation = null;
let selectedRoute = null;
let currentTheme = 'dark';

// Indian Cities Database for Autocomplete
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

// Black Spots Database (High Accident Areas in India)
const blackSpots = [
    { name: 'NH-48 Pune-Belgaum', lat: 18.3937, lon: 73.8561, severity: 'critical', accidents: 245 },
    { name: 'Mumbai-Pune Expressway', lat: 18.8409, lon: 73.4532, severity: 'high', accidents: 189 },
    { name: 'Golden Quadrilateral (NH-1)', lat: 28.4595, lon: 77.0266, severity: 'high', accidents: 312 },
    { name: 'Bangalore-Hyderabad Highway', lat: 13.1939, lon: 79.8711, severity: 'critical', accidents: 267 },
    { name: 'Delhi-Noida Expressway', lat: 28.5355, lon: 77.2820, severity: 'high', accidents: 198 },
    { name: 'Chennai-Bangalore Highway', lat: 13.1979, lon: 79.8711, severity: 'high', accidents: 156 },
    { name: 'Ahmedabad Bypass', lat: 23.0322, lon: 72.5797, severity: 'medium', accidents: 89 },
    { name: 'Jaipur-Delhi Highway', lat: 27.1767, lon: 75.7871, severity: 'high', accidents: 178 },
];

// Road Hazards Database
const roadHazards = [
    { name: 'Delhi-Gurugram Expressway Junction', lat: 28.4260, lon: 77.1046, type: 'poorly_lit', severity: 'medium' },
    { name: 'Mumbai Sharp Turn at Lonavala', lat: 18.7439, lon: 73.4027, type: 'sharp_turn', severity: 'high' },
    { name: 'School Zone - Delhi', lat: 28.5244, lon: 77.2065, type: 'school_zone', severity: 'medium' },
    { name: 'Speeding Hotspot - Bangalore', lat: 13.1939, lon: 77.6245, type: 'speeding_hotspot', severity: 'medium' },
    { name: 'Construction Zone - Pune', lat: 18.6298, lon: 73.7997, type: 'construction', severity: 'low' },
    { name: 'Poorly Lit - Chennai', lat: 13.0627, lon: 80.2473, type: 'poorly_lit', severity: 'medium' },
    { name: 'School Zone - Bangalore', lat: 12.9716, lon: 77.5946, type: 'school_zone', severity: 'medium' },
    { name: 'Sharp Turn - Hyderabad', lat: 17.3909, lon: 78.4739, type: 'sharp_turn', severity: 'high' },
    { name: 'Speeding Hotspot - Pune', lat: 18.5204, lon: 73.8567, type: 'speeding_hotspot', severity: 'low' },
    { name: 'Construction - Bangalore', lat: 12.9352, lon: 77.6245, type: 'construction', severity: 'medium' },
];

// Safety Tips
const safetyTips = [
    '🛵 Always wear a helmet and fasten your seatbelt',
    '⚠️ Follow speed limits - they save lives',
    '🌙 Be extra cautious during night driving',
    '📱 Never use your phone while driving',
    '🛣️ Maintain safe distance from other vehicles',
    '🔍 Check mirrors regularly',
    '☔ Reduce speed in rainy/wet conditions',
    '⛽ Keep your vehicle properly maintained',
    '😴 Take breaks during long drives',
    '🚨 Use indicators while turning',
    '🌧️ Turn on headlights in low visibility',
    '🚧 Be cautious near construction zones',
];

// Initialize everything when page loads
window.addEventListener('load', function() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    initializeMap();
    setupEventListeners();
    simulateWeatherAndTraffic();
    displaySafetyTips();
});

// ====== MAP INITIALIZATION ======
function initializeMap() {
    // Initialize map centered on India
    map = L.map('navigationMap').setView([20.5937, 78.9629], 5);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add default markers for Indian cities
    addCityMarkers();
}

function addCityMarkers() {
    indianCities.slice(0, 5).forEach(city => {
        L.circleMarker([city.lat, city.lon], {
            radius: 4,
            fillColor: 'rgba(51, 135, 245, 0.3)',
            color: '#3387f5',
            weight: 2,
            opacity: 0.5,
            fillOpacity: 0.3
        }).addTo(map).bindPopup(`<b>${city.name}</b><br>${city.state}`);
    });
}

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    const destinationInput = document.getElementById('destinationInput');
    
    destinationInput.addEventListener('input', function(e) {
        handleAutocomplete(e.target.value);
    });

    destinationInput.addEventListener('blur', function() {
        setTimeout(() => {
            document.getElementById('autocompleteList').classList.remove('show');
        }, 200);
    });

    // Close mobile panel when clicking outside
    document.addEventListener('click', function(e) {
        const panel = document.querySelector('.safety-panel');
        const toggleBtn = document.querySelector('.panel-toggle');
        if (!panel.contains(e.target) && !toggleBtn.contains(e.target) && window.innerWidth < 1024) {
            panel.classList.remove('open');
        }
    });
}

// ====== AUTOCOMPLETE FUNCTIONALITY ======
function handleAutocomplete(value) {
    const list = document.getElementById('autocompleteList');
    
    if (value.length < 2) {
        list.classList.remove('show');
        return;
    }

    const filtered = indianCities.filter(city =>
        city.name.toLowerCase().includes(value.toLowerCase()) ||
        city.state.toLowerCase().includes(value.toLowerCase())
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="autocomplete-item">No results found</div>';
        list.classList.add('show');
        return;
    }

    list.innerHTML = filtered.map(city =>
        `<div class="autocomplete-item" onclick="selectDestination('${city.name}', ${city.lat}, ${city.lon})">
            <i class="fas fa-map-marker-alt"></i>
            <div>
                <div style="font-weight: 600;">${city.name}</div>
                <div style="font-size: 12px; color: #999;">${city.state}</div>
            </div>
        </div>`
    ).join('');

    list.classList.add('show');
}

function selectDestination(name, lat, lon) {
    document.getElementById('destinationInput').value = name;
    document.getElementById('autocompleteList').classList.remove('show');
}

// ====== LOCATION DETECTION ======
function detectCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Detecting...</span>';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            currentLocation = { lat, lon };
            
            // Update map
            map.setView([lat, lon], 14);

            // Remove old marker
            if (userMarker) {
                map.removeLayer(userMarker);
            }

            // Add GPS marker with pulsing animation
            const pulseIcon = L.divIcon({
                html: `<div class="gps-marker" style="
                    width: 20px;
                    height: 20px;
                    background: #3387f5;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 0 5px rgba(51, 135, 245, 0.2);
                "></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            userMarker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);

            // Get address and update input
            getAddressFromCoordinates(lat, lon, 'current');

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-location-dot"></i><span>Detect</span>';
        },
        function(error) {
            console.error('Error:', error);
            alert('Unable to get your location. Please enable location services.');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-location-dot"></i><span>Detect</span>';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function getAddressFromCoordinates(lat, lon, type) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            const address = data.address.city || data.address.town || data.address.village || 'Unknown Location';
            
            if (type === 'current') {
                document.getElementById('currentLocationInput').value = address;
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            if (type === 'current') {
                document.getElementById('currentLocationInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            }
        });
}

// ====== ROUTE SEARCHING AND CALCULATION ======
function searchRoute() {
    const destination = document.getElementById('destinationInput').value;
    
    if (!currentLocation) {
        alert('Please detect your current location first.');
        return;
    }

    if (!destination) {
        alert('Please enter a destination.');
        return;
    }

    // Find destination coordinates
    const destCity = indianCities.find(city =>
        city.name.toLowerCase() === destination.toLowerCase()
    );

    if (!destCity) {
        alert('Destination not found. Please select from autocomplete suggestions.');
        return;
    }

    // Clear existing route
    clearRoute();

    // Calculate multiple routes
    calculateRoutes(currentLocation, destCity);
}

function calculateRoutes(origin, destination) {
    // Simulate three different routes with varying safety levels
    const routes = [
        {
            name: 'Safest Route',
            safety: 'safe',
            distance: calculateDistance(origin, destination) * 0.95,
            duration: calculateDistance(origin, destination) * 0.95 * 3,
            blackSpots: 0,
            hazards: 2,
            waypoints: generateSafeRoute(origin, destination)
        },
        {
            name: 'Faster Route',
            safety: 'moderate',
            distance: calculateDistance(origin, destination),
            duration: calculateDistance(origin, destination) * 2.5,
            blackSpots: 1,
            hazards: 4,
            waypoints: generateFastRoute(origin, destination)
        },
        {
            name: 'Alternate Route',
            safety: 'risky',
            distance: calculateDistance(origin, destination) * 1.1,
            duration: calculateDistance(origin, destination) * 1.1 * 3,
            blackSpots: 2,
            hazards: 6,
            waypoints: generateAlternateRoute(origin, destination)
        }
    ];

    // Display routes
    displayRouteOptions(routes);
    
    // Select and display safest route by default
    selectRouteOption(routes[0]);
}

function calculateDistance(origin, destination) {
    // Simple distance calculation using km
    const lat1 = origin.lat * Math.PI / 180;
    const lat2 = destination.lat * Math.PI / 180;
    const lon1 = origin.lon * Math.PI / 180;
    const lon2 = destination.lon * Math.PI / 180;

    const R = 6371; // Earth radius in km
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

function generateSafeRoute(origin, destination) {
    // Generate waypoints for safe route (avoiding black spots)
    return [
        [origin.lat, origin.lon],
        [(origin.lat + destination.lat) / 2 - 0.2, (origin.lon + destination.lon) / 2],
        [(origin.lat + destination.lat) / 2 + 0.1, (origin.lon + destination.lon) / 2 + 0.1],
        [destination.lat, destination.lon]
    ];
}

function generateFastRoute(origin, destination) {
    return [
        [origin.lat, origin.lon],
        [(origin.lat + destination.lat) / 2, (origin.lon + destination.lon) / 2 + 0.15],
        [destination.lat, destination.lon]
    ];
}

function generateAlternateRoute(origin, destination) {
    return [
        [origin.lat, origin.lon],
        [(origin.lat + destination.lat) / 2 - 0.15, (origin.lon + destination.lon) / 2 - 0.2],
        [(origin.lat + destination.lat) / 2 + 0.2, (origin.lon + destination.lon) / 2 - 0.1],
        [destination.lat, destination.lon]
    ];
}

// ====== ROUTE DISPLAY ======
function displayRouteOptions(routes) {
    const routeOptionsList = document.getElementById('routeOptionsList');
    
    routeOptionsList.innerHTML = routes.map((route, index) =>
        `<div class="route-card ${index === 0 ? 'selected' : ''}" onclick="selectRouteOption(arguments[${index}])">
            <div class="route-name">
                ${route.name}
                <span class="safety-badge badge-${route.safety}">${route.safety.toUpperCase()}</span>
            </div>
            <div class="route-details">
                <div class="route-detail-item">
                    <i class="fas fa-road"></i>${route.distance.toFixed(1)} km
                </div>
                <div class="route-detail-item">
                    <i class="fas fa-clock"></i>${Math.round(route.duration)} min
                </div>
                <div class="hazard-count">${route.blackSpots} Black Spot${route.blackSpots !== 1 ? 's' : ''}</div>
            </div>
        </div>`
    ).join('');

    document.getElementById('routeOptions').classList.add('active');
    
    // Make routes selectable
    routes.forEach((route, index) => {
        document.querySelectorAll('.route-card')[index].addEventListener('click', () => {
            selectRouteOption(route);
        });
    });
}

function selectRouteOption(route) {
    selectedRoute = route;

    // Update safety panel
    updateRoutesStats(route);

    // Clear existing routes
    routePolylines.forEach(polyline => map.removeLayer(polyline));
    routePolylines = [];

    // Draw route
    drawRoute(route);

    // Add hazards to map
    displayHazardsOnRoute(route);

    // Update route cards styling
    document.querySelectorAll('.route-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.route-card').classList.add('selected');
}

function drawRoute(route) {
    const color = route.safety === 'safe' ? '#3387f5' : 
                  route.safety === 'moderate' ? '#ffc107' : '#dc3545';

    const polyline = L.polyline(route.waypoints, {
        color: color,
        weight: 4,
        opacity: 0.8,
        dashArray: route.safety === 'safe' ? '' : '5, 5',
        className: 'route-polyline'
    }).addTo(map);

    routePolylines.push(polyline);

    // Add destination marker
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(route.waypoints[route.waypoints.length - 1], {
        icon: L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDMyIDQwIj48cGF0aCBmaWxsPSIjMjhhNzQ1IiBkPSJNMTYgMEM3LjE3IDE2LjE3IDE2IDE2IDE2IDI0YzcuOTczIDAgMTYtNy4xNiAxNi0xNlYweiIvPjwvc3ZnPg==',
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40]
        })
    }).addTo(map).bindPopup('Destination');

    // Fit bounds
    const bounds = L.latLngBounds(route.waypoints);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Generate turn-by-turn directions
    generateTurnByTurn(route);
}

function generateTurnByTurn(route) {
    const directions = [
        { step: 1, instruction: 'Head North on Main Road', distance: 2.5 },
        { step: 2, instruction: 'Turn right at traffic light', distance: 1.2 },
        { step: 3, instruction: 'Continue straight', distance: 5.3 },
        { step: 4, instruction: 'Take left turn', distance: 3.1 },
        { step: 5, instruction: 'Arrive at destination', distance: 0 }
    ];

    const directionsList = document.getElementById('directionsList');
    directionsList.innerHTML = directions.map(d =>
        `<div class="direction-step">
            <div class="direction-step-number">${d.step}</div>
            <div>
                <div class="direction-step-text">${d.instruction}</div>
                <div class="direction-step-distance">${d.distance > 0 ? d.distance + ' km' : 'Arrived'}</div>
            </div>
        </div>`
    ).join('');

    document.getElementById('directionsPanel').classList.add('active');
}

function displayHazardsOnRoute(route) {
    // Clear existing hazard markers
    hazardMarkers.forEach(marker => map.removeLayer(marker));
    hazardMarkers = [];

    // Check for hazards near route
    roadHazards.forEach(hazard => {
        const nearRoute = route.waypoints.some(waypoint => {
            const dist = calculateDistance(
                { lat: hazard.lat, lon: hazard.lon },
                { lat: waypoint[0], lon: waypoint[1] }
            );
            return dist < 5; // within 5 km
        });

        if (nearRoute) {
            addHazardMarker(hazard, route);
        }
    });

    // Check for black spots
    blackSpots.forEach(spot => {
        const nearRoute = route.waypoints.some(waypoint => {
            const dist = calculateDistance(
                { lat: spot.lat, lon: spot.lon },
                { lat: waypoint[0], lon: waypoint[1] }
            );
            return dist < 10;
        });

        if (nearRoute) {
            addBlackSpotMarker(spot, route);
        }
    });
}

function addHazardMarker(hazard, route) {
    const icons = {
        'poorly_lit': { color: '#ff9800', icon: '🌙' },
        'sharp_turn': { color: '#ffc107', icon: '↪️' },
        'school_zone': { color: '#3387f5', icon: '🏫' },
        'speeding_hotspot': { color: '#9c27b0', icon: '⚡' },
        'construction': { color: '#673ab7', icon: '🚧' }
    };

    const hazardIcon = icons[hazard.type];
    const divIcon = L.divIcon({
        html: `<div style="
            font-size: 20px;
            background: ${hazardIcon.color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        ">${hazardIcon.icon}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const marker = L.marker([hazard.lat, hazard.lon], { icon: divIcon })
        .addTo(map)
        .bindPopup(`<b>${hazard.name}</b><br>Type: ${hazard.type.replace('_', ' ').toUpperCase()}<br>Severity: ${hazard.severity}`);

    hazardMarkers.push(marker);
}

function addBlackSpotMarker(spot, route) {
    // Create glowing effect for black spots
    const divIcon = L.divIcon({
        html: `<div style="
            width: 30px;
            height: 30px;
            background: #dc3545;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(220, 53, 69, 0.8), 0 0 30px rgba(220, 53, 69, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            font-weight: bold;
        ">!</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const marker = L.marker([spot.lat, spot.lon], { icon: divIcon })
        .addTo(map)
        .bindPopup(`<b>${spot.name}</b><br>Severity: ${spot.severity.toUpperCase()}<br>Accidents: ${spot.accidents}`);

    hazardMarkers.push(marker);
}

// ====== STATISTICS AND SCORING ======
function updateRoutesStats(route) {
    document.getElementById('routeDistance').textContent = route.distance.toFixed(1) + ' km';
    document.getElementById('routeDuration').textContent = Math.round(route.duration) + ' min';
    document.getElementById('blackSpotCount').textContent = route.blackSpots;
    
    const safetyScore = route.safety === 'safe' ? '9/10' : 
                        route.safety === 'moderate' ? '6/10' : '3/10';
    document.getElementById('safetyScore').textContent = safetyScore;
    
    const riskLevel = route.safety === 'safe' ? 'Low' : 
                     route.safety === 'moderate' ? 'Medium' : 'High';
    document.getElementById('riskLevel').textContent = riskLevel;

    document.getElementById('routeStats').classList.add('active');

    // Show black spot warning if hazards exist
    if (route.blackSpots > 0) {
        const content = `This route passes through ${route.blackSpots} black spot${route.blackSpots !== 1 ? 's' : ''} with high accident frequency. Exercise caution and reduce speed in these areas.`;
        document.getElementById('blackSpotContent').textContent = content;
        document.getElementById('blackSpotWarning').classList.add('active');
    } else {
        document.getElementById('blackSpotWarning').classList.remove('active');
    }
}

// ====== CLEAR ROUTE ======
function clearRoute() {
    // Clear markers and polylines
    routePolylines.forEach(polyline => map.removeLayer(polyline));
    routePolylines = [];

    hazardMarkers.forEach(marker => map.removeLayer(marker));
    hazardMarkers = [];

    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }

    // Clear inputs and panels
    document.getElementById('destinationInput').value = '';
    document.getElementById('routeStats').classList.remove('active');
    document.getElementById('routeOptions').classList.remove('active');
    document.getElementById('directionsPanel').classList.remove('active');
    document.getElementById('blackSpotWarning').classList.remove('active');

    selectedRoute = null;
}

// ====== WEATHER AND TRAFFIC SIMULATION ======
function simulateWeatherAndTraffic() {
    const weatherConditions = ['☀️ Clear', '⛅ Partly Cloudy', '☁️ Cloudy', '🌧️ Rainy', '⛈️ Thunderstorm'];
    const trafficConditions = ['Light', 'Moderate', 'Heavy'];

    setInterval(() => {
        const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        const traffic = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];

        document.getElementById('weatherStatus').textContent = weather.split(' ')[1];
        document.getElementById('trafficStatus').textContent = traffic;

        // Update icon
        if (weather.includes('Rainy')) {
            document.getElementById('weatherIcon').textContent = '🌧️';
        } else if (weather.includes('Thunderstorm')) {
            document.getElementById('weatherIcon').textContent = '⛈️';
        } else if (weather.includes('Cloudy')) {
            document.getElementById('weatherIcon').textContent = '☁️';
        } else if (weather.includes('Partly')) {
            document.getElementById('weatherIcon').textContent = '⛅';
        } else {
            document.getElementById('weatherIcon').textContent = '☀️';
        }
    }, 10000);
}

// ====== SAFETY TIPS DISPLAY ======
function displaySafetyTips() {
    const tipsList = document.getElementById('safetyTipsList');
    
    // Shuffle and pick 4 random tips
    const shuffled = safetyTips.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    tipsList.innerHTML = shuffled.map(tip =>
        `<div class="safety-tip">
            ${tip}
        </div>`
    ).join('');
}

// ====== THEME TOGGLE ======
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme');
    
    // Update icon
    const btn = event.target.closest('.theme-toggle');
    btn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// ====== EMERGENCY CONTACTS ======
function callEmergency(type) {
    const numbers = {
        'police': '100',
        'ambulance': '102',
        'fire': '101'
    };

    alert(`Emergency Service: ${type.toUpperCase()}\n\nNumber: ${numbers[type]}\n\nThis is a demo. In a real scenario, this would dial the emergency number.`);
}

// ====== SAFETY PANEL TOGGLE (Mobile) ======
function toggleSafetyPanel() {
    const panel = document.querySelector('.safety-panel');
    panel.classList.toggle('open');
}
