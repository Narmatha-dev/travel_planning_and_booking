const locationService = require('../services/locationService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const locationController = {
  /**
   * GET /api/location/reverse-geocode?lat=...&lng=...
   * Reverse geocodes GPS coordinates into human-readable city, state, and country
   */
  reverseGeocode: asyncHandler(async (req, res) => {
    const { lat, lng, latitude, longitude } = req.query;
    const targetLat = lat || latitude;
    const targetLng = lng || longitude;

    if (!targetLat || !targetLng) {
      const error = new Error('Both latitude (lat) and longitude (lng) query parameters are required');
      error.statusCode = 400;
      throw error;
    }

    const locationData = await locationService.reverseGeocode(targetLat, targetLng);
    return successResponse(res, 'Location detected successfully', locationData, 200);
  }),

  /**
   * GET /api/location/route?originLat=...&originLng=...&destLat=...&destLng=...&mode=...
   * Calculates live route, road distance, and travel time (Phase 3)
   */
  getRouteDirections: asyncHandler(async (req, res) => {
    const { originLat, originLng, destLat, destLng, mode, travelMode } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      const error = new Error('Both origin (originLat, originLng) and destination (destLat, destLng) coordinates are required');
      error.statusCode = 400;
      throw error;
    }

    const routeData = await locationService.calculateRoute({
      originLat,
      originLng,
      destLat,
      destLng,
      travelMode: mode || travelMode || 'driving',
    });

    return successResponse(res, 'Route and travel time calculated successfully', routeData, 200);
  }),

  /**
   * GET /api/location/map-config
   * Returns public Google Maps configuration if available
   */
  getMapConfig: asyncHandler(async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
    return successResponse(res, 'Map configuration retrieved', {
      hasGoogleMapsApiKey: Boolean(apiKey),
      googleMapsApiKey: apiKey,
    }, 200);
  }),
};

module.exports = locationController;
