const weatherService = require('../services/weather.service');

// GET /api/weather/current?city=London
const getCurrentWeather = async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city?.trim()) return res.status(400).json({ error: 'City name is required' });

    const [data, hourly] = await Promise.all([
      weatherService.getCurrentWeather(city.trim()),
      weatherService.getHourlyForecast(city.trim()),
    ]);

    // Fetch air quality using coordinates from current weather
    const airQuality = await weatherService.getAirQuality(
      data.coordinates.lat,
      data.coordinates.lon
    );

    res.json({ success: true, data: { ...data, airQuality, hourly } });
  } catch (err) {
    next(err);
  }
};

// GET /api/weather/forecast?city=London
const getForecast = async (req, res, next) => {
  try {
    const { city } = req.query;
    if (!city?.trim()) return res.status(400).json({ error: 'City name is required' });
    const data = await weatherService.getForecast(city.trim());
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/weather/search?q=Mumb
const searchCities = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q?.trim() || q.trim().length < 2) return res.json({ success: true, data: [] });
    const data = await weatherService.searchCities(q.trim());
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCurrentWeather, getForecast, searchCities };
