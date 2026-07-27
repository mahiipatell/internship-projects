const express    = require('express');
const controller = require('../controllers/weather.controller');

const router = express.Router();

router.get('/current',  controller.getCurrentWeather); // current weather + hourly + AQI
router.get('/forecast', controller.getForecast);        // 5-day forecast
router.get('/search',   controller.searchCities);       // city autocomplete

module.exports = router;
