let map;
let flightMarkers = [];

// Initialize map
function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Load flights for selected airport
async function loadFlights() {
    const airport = document.getElementById('airportSelect').value;
    
    try {
        // Clear existing markers
        flightMarkers.forEach(marker => map.removeLayer(marker));
        flightMarkers = [];
        
        const response = await fetch(`http://localhost:5000/api/flights/${airport}`);
        const data = await response.json();
        
        data.flights.forEach(flight => {
            const marker = L.marker([flight.lat, flight.lon])
                .addTo(map)
                .bindPopup(`
                    <b>${flight.airline}</b><br>
                    ${flight.flight_id}<br>
                    ${flight.departure} → ${flight.arrival}<br>
                    Status: ${flight.status}<br>
                    Speed: ${flight.speed} km/h
                `)
                .openPopup();
            
            flightMarkers.push(marker);
        });
        
        // Fit map to show all flights
        if (flightMarkers.length > 0) {
            const group = new L.featureGroup(flightMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
        
    } catch (error) {
        console.error('Error loading flights:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetch('http://localhost:5000/api/stats');
        const stats = await response.json();
        
        document.getElementById('stats').innerHTML = `
            <div>✈️ ${stats.total_flights_today.toLocaleString()} Flights</div>
            <div>⏱️ ${stats.avg_delay} min Avg Delay</div>
            <div>✅ ${stats.on_time_percentage}% On Time</div>
            <div>📍 ${stats.most_delayed_route}</div>
        `;
    } catch (error) {
        console.error('Error loading stats');
    }
}

// Load weather
async function loadWeather() {
    try {
        const response = await fetch('http://localhost:5000/api/weather/New York');
        const weather = await response.json();
        
        document.getElementById('weather').innerHTML = `
            <div>🌡️ ${weather.main.temp}°C</div>
            <div>💨 ${weather.wind.speed} m/s</div>
            <div>☁️ ${weather.weather[0].description}</div>
        `;
    } catch (error) {
        console.error('Error loading weather');
    }
}

// Predict delay
async function predictDelay() {
    const distance = document.getElementById('distance').value || 1000;
    const windSpeed = document.getElementById('windSpeed').value || 20;
    
    try {
        const response = await fetch('http://localhost:5000/api/predict_delay', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                distance: parseInt(distance),
                wind_speed: parseInt(windSpeed),
                visibility: 10
            })
        });
        
        const result = await response.json();
        document.getElementById('prediction').textContent = 
            `Predicted Delay: ${result.predicted_delay_minutes} minutes`;
    } catch (error) {
        console.error('Error predicting delay');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadFlights();
    loadStats();
    loadWeather();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadFlights();
        loadStats();
        loadWeather();
    }, 30000);
});