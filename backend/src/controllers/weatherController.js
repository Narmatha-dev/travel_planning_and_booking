const weatherService = require('../services/weatherService');
const destinationModel = require('../models/destinationModel');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const weatherController = {
  /**
   * GET /api/weather/current?lat=...&lng=...&city=...&destinationId=...
   * Fetches real-time current weather
   */
  getCurrentWeather: asyncHandler(async (req, res) => {
    let { lat, lng, latitude, longitude, city, destinationId, destination } = req.query;

    let targetLat = lat || latitude;
    let targetLng = lng || longitude;
    let cityName = city || destination;

    // If destination ID or name is provided, resolve coordinates
    if ((!targetLat || !targetLng) && (destinationId || destination || city)) {
      const destIdentifier = destinationId || destination || city;
      let destObj = null;

      try {
        if (!isNaN(parseInt(destIdentifier, 10))) {
          destObj = await destinationModel.findById(destIdentifier);
        }
      } catch {}

      const resolved = weatherService.resolveCoordinates(destObj || destIdentifier);
      if (resolved) {
        targetLat = resolved.latitude;
        targetLng = resolved.longitude;
        cityName = cityName || resolved.city;
      }
    }

    if (!targetLat || !targetLng) {
      const error = new Error('Coordinates (lat, lng) or a valid destination parameter are required');
      error.statusCode = 400;
      throw error;
    }

    const weatherData = await weatherService.getCurrentWeather(targetLat, targetLng, cityName);
    return successResponse(res, 'Current weather retrieved successfully', weatherData, 200);
  }),

  /**
   * GET /api/weather/forecast?lat=...&lng=...&days=7&city=...&destinationId=...
   * Fetches multi-day weather forecast
   */
  getWeatherForecast: asyncHandler(async (req, res) => {
    let { lat, lng, latitude, longitude, days = 7, city, destinationId, destination } = req.query;

    let targetLat = lat || latitude;
    let targetLng = lng || longitude;
    let cityName = city || destination;

    if ((!targetLat || !targetLng) && (destinationId || destination || city)) {
      const destIdentifier = destinationId || destination || city;
      let destObj = null;

      try {
        if (!isNaN(parseInt(destIdentifier, 10))) {
          destObj = await destinationModel.findById(destIdentifier);
        }
      } catch {}

      const resolved = weatherService.resolveCoordinates(destObj || destIdentifier);
      if (resolved) {
        targetLat = resolved.latitude;
        targetLng = resolved.longitude;
        cityName = cityName || resolved.city;
      }
    }

    if (!targetLat || !targetLng) {
      const error = new Error('Coordinates (lat, lng) or a valid destination parameter are required');
      error.statusCode = 400;
      throw error;
    }

    const forecastData = await weatherService.getWeatherForecast(targetLat, targetLng, days, cityName);
    return successResponse(res, 'Weather forecast retrieved successfully', forecastData, 200);
  }),

  /**
   * GET /api/weather/destination/:id
   * Fetches combined destination weather (current + 7-day forecast + indoor/outdoor suggestions)
   */
  getDestinationWeather: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      const error = new Error('Destination ID or slug is required');
      error.statusCode = 400;
      throw error;
    }

    let destObj = null;
    try {
      if (!isNaN(parseInt(id, 10))) {
        destObj = await destinationModel.findById(id);
      } else {
        destObj = await destinationModel.findBySlug(id);
      }
    } catch {}

    const searchTarget = destObj || id;
    const weatherData = await weatherService.getWeatherByDestination(searchTarget);

    return successResponse(res, 'Destination weather retrieved successfully', weatherData, 200);
  }),

  /**
   * GET /api/weather/suggestions?destination=...
   * Returns curated indoor vs outdoor places and weather suggestions
   */
  getOutdoorIndoorSuggestions: asyncHandler(async (req, res) => {
    const { destination, city } = req.query;
    const target = destination || city || 'Ooty';

    const catalog = weatherService.getIndoorOutdoorCatalog(target);
    const coords = weatherService.resolveCoordinates(target);

    let currentWeather = null;
    if (coords) {
      const wData = await weatherService.getCurrentWeather(coords.latitude, coords.longitude, coords.city);
      currentWeather = wData.current;
    }

    return successResponse(res, 'Weather suggestions retrieved successfully', {
      destination: target,
      current_weather: currentWeather,
      outdoor_places: catalog.outdoor,
      indoor_places: catalog.indoor,
    }, 200);
  }),
};

module.exports = weatherController;
