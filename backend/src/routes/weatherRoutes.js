const express = require('express');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

// GET /api/weather/current?lat=...&lng=...&city=...&destinationId=...
router.get('/current', weatherController.getCurrentWeather);

// GET /api/weather/forecast?lat=...&lng=...&days=...&destinationId=...
router.get('/forecast', weatherController.getWeatherForecast);

// GET /api/weather/destination/:id
router.get('/destination/:id', weatherController.getDestinationWeather);

// GET /api/weather/suggestions?destination=...
router.get('/suggestions', weatherController.getOutdoorIndoorSuggestions);

module.exports = router;
