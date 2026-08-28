const googlePlacesService = require('../services/googlePlacesService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const placesSearchController = {
  /**
   * GET /api/places/search?q={query}&lat={lat}&lng={lng}&radius={radius}&lang={lang}
   */
  searchPlaces: asyncHandler(async (req, res) => {
    const { q, query, lat, lng, latitude, longitude, radius, lang, language } = req.query;
    const queryTerm = q || query;

    if (!queryTerm) {
      return errorResponse(res, 'Search query is required', 400);
    }

    const results = await googlePlacesService.searchPlaces(queryTerm, {
      latitude: lat || latitude,
      longitude: lng || longitude,
      radius: radius ? parseInt(radius, 10) : 50000,
      language: lang || language || 'en',
    });

    return successResponse(res, 'Places searched successfully', results);
  }),

  /**
   * GET /api/places/autocomplete?input={input}&lat={lat}&lng={lng}
   */
  getAutocomplete: asyncHandler(async (req, res) => {
    const { input, q, lat, lng, latitude, longitude } = req.query;
    const term = input || q;

    if (!term) {
      return successResponse(res, 'Autocomplete suggestions retrieved', { suggestions: [] });
    }

    const suggestions = await googlePlacesService.getAutocomplete(term, {
      latitude: lat || latitude,
      longitude: lng || longitude,
    });

    return successResponse(res, 'Autocomplete suggestions retrieved', suggestions);
  }),

  /**
   * GET /api/places/details/:placeId
   */
  getPlaceDetails: asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const { lang, language } = req.query;

    const details = await googlePlacesService.getPlaceDetails(placeId, {
      language: lang || language || 'en',
    });

    return successResponse(res, 'Place details retrieved successfully', details);
  }),
};

module.exports = placesSearchController;
