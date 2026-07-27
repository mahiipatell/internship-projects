const axios = require('axios');

const BASE_URL = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const API_KEY  = process.env.OPENWEATHER_API_KEY;

// Fetch current weather by city name
const getCurrentWeather = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q:     city,
        appid: API_KEY,
        units: 'metric', // Celsius
      },
    });
    return transformWeatherData(response.data);
  } catch (err) {
    // Pass through the HTTP status from OpenWeatherMap
    const status  = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch weather data';
    const error   = new Error(message);
    error.status  = status;
    throw error;
  }
};

// Fetch 5-day / 3-hour forecast, then reduce to one entry per day
const getForecast = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q:     city,
        appid: API_KEY,
        units: 'metric',
      },
    });
    return transformForecastData(response.data);
  } catch (err) {
    const status  = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch forecast data';
    const error   = new Error(message);
    error.status  = status;
    throw error;
  }
};

// Transform raw OpenWeatherMap response into a clean, frontend-friendly shape
const transformWeatherData = (data) => ({
  city:        data.name,
  country:     data.sys.country,
  coordinates: { lat: data.coord.lat, lon: data.coord.lon },
  temperature: {
    current:   Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    min:       Math.round(data.main.temp_min),
    max:       Math.round(data.main.temp_max),
  },
  weather: {
    main:        data.weather[0].main,
    description: data.weather[0].description,
    icon:        data.weather[0].icon,
    iconUrl:     `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
  },
  details: {
    humidity:   data.main.humidity,
    pressure:   data.main.pressure,
    windSpeed:  Math.round(data.wind.speed * 3.6), // m/s → km/h
    windDeg:    data.wind.deg,
    visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // m → km
    cloudiness: data.clouds.all,
  },
  sun: {
    sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
    sunset:  new Date(data.sys.sunset  * 1000).toISOString(),
  },
  timezone:  data.timezone,
  timestamp: new Date(data.dt * 1000).toISOString(),
});

// Reduce 3-hour slots into one representative entry per day (noon slot preferred)
const transformForecastData = (data) => {
  const dailyMap = {};

  data.list.forEach((entry) => {
    const date = entry.dt_txt.slice(0, 10); // "YYYY-MM-DD"
    const hour = parseInt(entry.dt_txt.slice(11, 13));

    // Prefer the 12:00 slot; fall back to whatever comes first that day
    if (!dailyMap[date] || hour === 12) {
      dailyMap[date] = {
        date,
        temperature: {
          min: Math.round(entry.main.temp_min),
          max: Math.round(entry.main.temp_max),
          avg: Math.round(entry.main.temp),
        },
        weather: {
          main:        entry.weather[0].main,
          description: entry.weather[0].description,
          icon:        entry.weather[0].icon,
          iconUrl:     `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`,
        },
        humidity:  entry.main.humidity,
        windSpeed: Math.round(entry.wind.speed * 3.6),
      };
    }
  });

  // Return next 5 days (skip today if we already have current weather)
  return Object.values(dailyMap).slice(0, 5);
};

module.exports = { getCurrentWeather, getForecast };


// ── City autocomplete via OpenWeatherMap Geocoding API ────────────────────────
const searchCities = async (query) => {
  try {
    const response = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
      params: { q: query, limit: 6, appid: API_KEY },
    });
    return response.data.map((c) => ({
      name:    c.name,
      country: c.country,
      state:   c.state || '',
      lat:     c.lat,
      lon:     c.lon,
      label:   c.state ? `${c.name}, ${c.state}, ${c.country}` : `${c.name}, ${c.country}`,
    }));
  } catch (err) {
    return []; // silently fail — autocomplete is non-critical
  }
};

// ── Air Quality Index by coordinates ─────────────────────────────────────────
const getAirQuality = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/air_pollution`, {
      params: { lat, lon, appid: API_KEY },
    });
    const data       = response.data.list[0];
    const aqi        = data.main.aqi; // 1–5
    const labels     = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const colors     = ['', '#51cf66', '#94d82d', '#fcc419', '#ff922b', '#ff6b6b'];
    return {
      aqi,
      label:      labels[aqi],
      color:      colors[aqi],
      components: {
        co:   data.components.co,
        no2:  data.components.no2,
        o3:   data.components.o3,
        pm2_5: data.components.pm2_5,
        pm10: data.components.pm10,
      },
    };
  } catch (err) {
    return null; // non-critical
  }
};

// ── Hourly forecast (next 24h in 3h steps = 8 entries) ───────────────────────
const getHourlyForecast = async (city) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: { q: city, appid: API_KEY, units: 'metric', cnt: 8 },
    });
    return response.data.list.map((entry) => ({
      time:        new Date(entry.dt * 1000).toISOString(),
      temperature: Math.round(entry.main.temp),
      feelsLike:   Math.round(entry.main.feels_like),
      weather: {
        main:        entry.weather[0].main,
        description: entry.weather[0].description,
        icon:        entry.weather[0].icon,
        iconUrl:     `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`,
      },
      windSpeed: Math.round(entry.wind.speed * 3.6),
      humidity:  entry.main.humidity,
      pop:       Math.round((entry.pop || 0) * 100), // probability of precipitation %
    }));
  } catch (err) {
    return [];
  }
};

module.exports = { getCurrentWeather, getForecast, searchCities, getAirQuality, getHourlyForecast };
