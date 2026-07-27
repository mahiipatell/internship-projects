import axios from 'axios';

const api = axios.create({
  baseURL: '/api/weather',
  timeout: 10000,
});

export const fetchCurrentWeather = async (city) => {
  const response = await api.get('/current', { params: { city } });
  return response.data.data;
};

export const fetchForecast = async (city) => {
  const response = await api.get('/forecast', { params: { city } });
  return response.data.data;
};

// City autocomplete
export const searchCities = async (query) => {
  const response = await api.get('/search', { params: { q: query } });
  return response.data.data;
};
