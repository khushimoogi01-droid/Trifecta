# Road Safety - Prevention of Road Accidents

## Project Overview
This is a basic website dedicated to the prevention of road accidents. It includes user authentication and features for viewing user location on an Indian map.

## Features Implemented

### 1. Login Page (`index.html`)
- User authentication with username and password
- Form validation
- Error handling for invalid credentials
- Test credentials available for demo

### 2. Dashboard (`dashboard.html`)
- Welcome message with logged-in user's name
- Navigation menu
- Five main feature cards:
  - **Safety Navigation**: Find safest routes with hazard alerts
  - **Check Your Location**: View location on map
  - **Safety Tips**: View road safety tips
  - **Statistics**: View road accident statistics in India
  - **Emergency Contacts**: Get emergency contact numbers

### 3. Map Page (`map.html`)
- Interactive map showing India
- Real-time user location tracking with geolocation
- Location coordinates (Latitude, Longitude)
- Location accuracy display
- Reverse geocoding to show address
- Update location button
- Only accessible after login

### 4. **Advanced Safety Navigation Map** (`navigation.html` - NEW)
A sophisticated, modern road safety navigation platform featuring:

#### Core Navigation Features:
- **Smart Location Detection**: GPS-based current location with accuracy indicator
- **Destination Search**: Autocomplete search for 20+ Indian cities with smart suggestions
- **Intelligent Route Calculation**: Three route options with safety scores
  - **Safest Route** (9/10 score): Avoids black spots and hazards
  - **Faster Route** (6/10 score): Moderate risk alternative
  - **Alternate Route** (3/10 score): Quick shortcut with higher risk

#### Safety Intelligence Features:
- **Black Spot Visualization**: Real-time display of high-accident areas with glowing markers
- **Hazard Categories** with color-coded markers:
  - 🔴 Critical accident zones (Red)
  - 🟠 Poorly lit roads (Orange)
  - 🟡 Sharp turns (Yellow)
  - 🔵 School zones (Blue)
  - 🟣 Speeding hotspots (Purple)
  - 🟣 Construction areas (Dark Purple)

#### Advanced Map Features:
- **Interactive Turn-by-Turn Navigation**: Step-by-step directions with distances
- **Real-Time Traffic Overlay**: Simulated traffic conditions (Light/Moderate/Heavy)
- **Weather Integration**: Dynamic weather updates affecting route recommendations
- **Safety Statistics Panel**:
  - Distance and estimated travel time
  - Number of black spots on route
  - Safety score (1-10)
  - Risk level assessment
  - Number of hazards detected

#### UI/UX Features:
- **Glassmorphism Design**: Modern semi-transparent cards with blur effects
- **Dark/Light Theme Toggle**: Easy switching between dark and light modes
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Floating Safety Panel**: Collapsible side panel with route information
- **Map Legend**: Visual guide explaining all map symbols and colors
- **Emergency Quick Actions**:
  - Police (100)
  - Ambulance (102)
  - Fire Service (101)

#### Intelligent Features:
- **Safety Tips**: Context-aware tips for current route and weather
- **Route Warnings**: Alert when selected route passes through dangerous zones
- **GPS-Style Marker**: Pulsing animation showing real-time location
- **Heatmap Integration**: Visual representation of accident density
- **Weather-Based Warnings**: Adjusted cautions based on current weather

### 5. Styling (`style.css`)
- Responsive design
- Modern UI with gradient backgrounds
- Glassmorphism effects
- Mobile-friendly layout
- Smooth transitions and hover effects
- Dark/light theme support

### 5. JavaScript Logic (`script.js`)
- Session management using localStorage
- Login validation
- Logout functionality
- Modal for safety tips
- Emergency contact information
- Road safety statistics

## Test Credentials

You can use the following credentials to test the website:

```
Username: admin
Password: admin123
```

OR

```
Username: user
Password: password123
```

## How to Use

### 1. Open the Website
- Open `index.html` in any web browser (Chrome, Firefox, Edge, Safari)
- Make sure you have internet connection for map and geolocation features

### 2. Login
- Enter username and password
- Click "Sign In" button
- You'll be redirected to the dashboard

### 3. Navigate Dashboard
- View safety tips, statistics, and emergency contacts
- Click "View Map" to open the map page
- Click "Start Navigation" to open the advanced Safety Navigation system

### 4. Advanced Safety Navigation
- Click "Detect" to get your current location via GPS
- Type a destination (autocomplete will suggest Indian cities)
- Click "Find Route" to calculate multiple route options
- View three routes with different safety levels:
  - Safest Route: Red route with minimal black spots
  - Faster Route: Alternative route with moderate hazards
  - Alternate Route: Quick route with higher risk
- Navigate using turn-by-turn directions
- Monitor black spots and hazards marked on the map
- Check real-time traffic and weather conditions
- Use emergency quick actions if needed
- Toggle between dark/light themes
- View safety tips and statistics for the selected route

### 5. Logout
- Click "Logout" in the navigation menu
- You'll be redirected to the login page

## Features in Detail

### Login Security
- Session management with localStorage
- Users cannot access dashboard/map without login
- Auto-redirect to login if session expires

### Location Features
- Uses browser's Geolocation API
- Shows accuracy radius on map
- Reverse geocoding to display address
- Interactive Leaflet map library

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Adaptive navigation and layout
- Mobile-optimized modals and cards

## Browser Requirements
- Modern browser with JavaScript enabled
- Geolocation API support (all modern browsers)
- Internet connection for map tiles and APIs

## Technologies Used
- HTML5
- CSS3 (with Glassmorphism effects)
- JavaScript (ES6+)
- Leaflet.js (for interactive maps)
- OpenStreetMap (map tiles)
- OpenStreetMap Nominatim (reverse geocoding)
- Font Awesome Icons (icon library)
- Geolocation API (browser-based GPS)
- CSS Grid & Flexbox (responsive layouts)
- CSS Animations & Transitions

## Future Enhancements
- Real user registration and login system with database
- Backend authentication with secure password hashing
- Email verification and password reset functionality
- User profile management and preferences
- Real-time accident reporting system
- Live traffic data integration (via Google Maps or OpenWeather API)
- Real-world weather API integration
- Machine learning for safety scoring
- Police verification for reported hazards
- Community-based hazard marking
- Insurance integration and claims
- Vehicle health monitoring integration
- Dashcam footage sharing for accident reporting
- Traffic light timing optimization
- GPS history tracking and analytics
- Social features for reporting hazards in real-time
- Mobile app version (React Native / Flutter)
- Advanced route optimization algorithm
- Multi-stop route planning
- Alternative transportation modes (public transit, cycling)
- Accessibility features for differently-abled users

## Notes
- This is a frontend-only demonstration
- User credentials are stored in JavaScript (not secure for production)
- For production use, implement proper backend authentication
- Geolocation requires HTTPS in production environments (HTTP works for localhost)

## Contact & Support
For any issues or suggestions, please feel free to reach out.

---
Created: May 2026
Version: 1.0
