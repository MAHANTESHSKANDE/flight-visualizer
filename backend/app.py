from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import sqlite3
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Your API Keys (Replace with yours!)
AVIATION_API_KEY = "4fc99f6b33ce902d667c6dab547da62b"
WEATHER_API_KEY = "328a0af14bb725410b00956add8ac72d"

# Initialize ML model for delay prediction
model = RandomForestRegressor(n_estimators=100)
# Note: Train model with sample data (we'll add this)

@app.route('/api/flights/<airport>')
def get_flights(airport):
    """Get real-time flights for airport"""
    url = f"http://api.aviationstack.com/v1/flights"
    params = {
        'access_key': AVIATION_API_KEY,
        'dep_iata': airport,
        'limit': 20
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        flights = []
        for flight in data['data']:
            flight_info = {
                'flight_id': flight.get('flight', {}).get('iata'),
                'airline': flight.get('airline', {}).get('name'),
                'departure': flight.get('departure', {}).get('iata'),
                'arrival': flight.get('arrival', {}).get('iata'),
                'status': flight.get('flight_status'),
                'lat': float(flight['departure'].get('latitude', 0)),
                'lon': float(flight['departure'].get('longitude', 0)),
                'altitude': flight.get('altitude', 0),
                'speed': flight.get('speed_horizontal', 0)
            }
            flights.append(flight_info)
        
        return jsonify({'flights': flights})
    except:
        return jsonify({'error': 'API unavailable'})

@app.route('/api/weather/<city>')
def get_weather(city):
    """Get current weather"""
    url = f"http://api.openweathermap.org/data/2.5/weather"
    params = {
        'q': city,
        'appid': WEATHER_API_KEY,
        'units': 'metric'
    }
    
    response = requests.get(url, params=params)
    return jsonify(response.json())

@app.route('/api/predict_delay', methods=['POST'])
def predict_delay():
    """Predict flight delay"""
    data = request.json
    # Simple ML prediction (you can enhance this)
    features = np.array([[data['distance'], data['wind_speed'], data['visibility']]])
    prediction = model.predict(features)[0]
    return jsonify({'predicted_delay_minutes': int(prediction)})

@app.route('/api/stats')
def get_stats():
    """Airport statistics"""
    return jsonify({
        'total_flights_today': 24567,
        'avg_delay': 14.2,
        'on_time_percentage': 87.3,
        'most_delayed_route': 'JFK-LAX'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)