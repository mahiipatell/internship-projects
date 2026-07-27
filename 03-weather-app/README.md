# WeatherNow — Full-Stack Weather Application

Real-time weather information for any city using React + Vite frontend, Express.js backend proxy, and the OpenWeatherMap API.

---

## Features

- Search weather by city
- Current weather conditions
- 5-day weather forecast
- Temperature, humidity & wind speed
- Responsive UI
- Secure backend API proxy
- Environment variable support

---

## Tech Stack

### Frontend

- React
- Vite
- Axios

### Backend

- Node.js
- Express.js
- OpenWeatherMap API

---

## How to get your API Key

1. Go to https://openweathermap.org/api
2. Create a free account.
3. Open the **API Keys** section.
4. Copy your API key.
5. Wait approximately **10–15 minutes** for activation.

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`

```
PORT=5001
OPENWEATHER_API_KEY=your_api_key
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
```

Start backend

```bash
npm run dev
```

Runs on

```
http://localhost:5001
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on

```
http://localhost:5174
```

---

## Architecture

```
Browser
    │
    ▼
React Frontend (Vite)
    │
Axios
    │
    ▼
Express Backend
    │
    ▼
OpenWeatherMap API
```

The frontend never communicates directly with the OpenWeatherMap API. All requests are routed through the Express backend, keeping the API key secure.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/weather/current?city=London | Current Weather |
| GET | /api/weather/forecast?city=London | 5-Day Forecast |

---

## Project Structure

```
03-weather-app/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── .env.example
│
└── frontend/
    ├── src/
    ├── package.json
    └── vite.config.js
```

---

## Learning Outcomes

- Third-party API Integration
- Axios
- Backend Proxy Architecture
- Environment Variables
- Express Routing
- REST API Consumption

---

## Future Improvements

- Current Location Weather
- Air Quality Index
- Weather Maps
- Hourly Forecast
- Dark Mode
- Favorite Cities