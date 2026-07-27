import { useState, useCallback } from 'react';
import { fetchCurrentWeather, fetchForecast } from '../services/weatherApi';

const applyBodyBackground = (weatherMain, icon) => {
  const isNight = icon?.endsWith('n');
  const map = {
    Clear:        isNight ? 'weather-clear-night' : 'weather-clear-day',
    Clouds:       'weather-clouds',
    Rain:         'weather-rain',
    Drizzle:      'weather-drizzle',
    Thunderstorm: 'weather-thunderstorm',
    Snow:         'weather-snow',
    Mist:         'weather-mist',
    Smoke:        'weather-mist',
    Haze:         'weather-mist',
    Dust:         'weather-mist',
    Fog:          'weather-mist',
    Sand:         'weather-mist',
    Ash:          'weather-mist',
    Squall:       'weather-rain',
    Tornado:      'weather-thunderstorm',
  };
  const cls = map[weatherMain] || 'weather-default';
  document.body.className = document.body.className
    .split(' ').filter(c => !c.startsWith('weather-')).join(' ');
  document.body.classList.add(cls);
};

export function useWeather() {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const search = useCallback(async (cityName) => {
    if (!cityName.trim()) return;
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);
    try {
      const [weatherData, forecastData] = await Promise.all([
        fetchCurrentWeather(cityName),
        fetchForecast(cityName),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      applyBodyBackground(weatherData.weather.main, weatherData.weather.icon);
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setError(`City "${cityName}" not found. Please check the spelling and try again.`);
      } else if (status === 401) {
        setError('Invalid API key. Please check your backend configuration.');
      } else {
        setError('Unable to fetch weather data. Please try again.');
      }
      document.body.className = document.body.className
        .split(' ').filter(c => !c.startsWith('weather-')).join(' ');
      document.body.classList.add('weather-default');
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, forecast, loading, error, search };
}
