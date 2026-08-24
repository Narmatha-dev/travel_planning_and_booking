const destinationService = require('../services/destinationService');
const placesService = require('../services/placesService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const destinationController = {
  /**
   * GET /api/destinations/nearby?lat=...&lng=...&category=...&limit=...
   * Retrieves real nearby tourist attractions based on GPS coordinates
   */
  getNearbyDestinations: asyncHandler(async (req, res) => {
    const { lat, lng, latitude, longitude, radius, category, limit } = req.query;
    const targetLat = lat || latitude;
    const targetLng = lng || longitude;

    if (!targetLat || !targetLng) {
      const error = new Error('Both latitude and longitude are required to find nearby places');
      error.statusCode = 400;
      throw error;
    }

    const data = await placesService.getNearbyTouristPlaces({
      latitude: targetLat,
      longitude: targetLng,
      radiusKm: radius ? parseFloat(radius) : 150,
      category: category || 'all',
      limit: limit ? parseInt(limit, 10) : 12,
    });

    return successResponse(res, `Found ${data.places.length} nearby tourist destination(s)`, data);
  }),

  /**
   * GET /api/destinations/nearby/:placeId
   * Retrieves detailed information for a real nearby place
   */
  getNearbyPlaceDetails: asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    const place = await placesService.getPlaceDetails(placeId);
    return successResponse(res, 'Place details retrieved successfully', place);
  }),
  /**
   * GET /api/destinations
   */
  getAllDestinations: asyncHandler(async (req, res) => {
    const { category, priceLevel, minRating, isFeatured, sortBy, limit, offset } = req.query;
    const userId = req.user ? req.user.id : null;

    const destinations = await destinationService.getAllDestinations(
      {
        category,
        priceLevel,
        minRating,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        sortBy,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      userId
    );

    return successResponse(res, 'Destinations retrieved successfully', destinations);
  }),

  /**
   * GET /api/destinations/search
   */
  searchDestinations: asyncHandler(async (req, res) => {
    const { q, category, priceLevel, minRating, limit, offset } = req.query;
    const userId = req.user ? req.user.id : null;

    const destinations = await destinationService.searchDestinations(
      {
        q: q || '',
        category,
        priceLevel,
        minRating,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      userId
    );

    return successResponse(res, `Found ${destinations.length} destination(s) matching '${q || ''}'`, destinations);
  }),

  /**
   * GET /api/destinations/popular
   */
  getPopularDestinations: asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const destinations = await destinationService.getPopularDestinations(userId);
    return successResponse(res, 'Popular destinations retrieved successfully', destinations);
  }),

  /**
   * GET /api/destinations/:identifier (ID or Slug)
   */
  getDestinationByIdOrSlug: asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const userId = req.user ? req.user.id : null;
    const destination = await destinationService.getDestinationDetails(identifier, userId);
    return successResponse(res, 'Destination details retrieved successfully', destination);
  }),

  /**
   * POST /api/destinations/:id/favorite
   */
  addFavorite: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const destinationId = req.params.id;
    const result = await destinationService.addFavorite(userId, destinationId);
    return successResponse(res, 'Destination added to favorites', result, 201);
  }),

  /**
   * DELETE /api/destinations/:id/favorite
   */
  removeFavorite: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const destinationId = req.params.id;
    const result = await destinationService.removeFavorite(userId, destinationId);
    return successResponse(res, 'Destination removed from favorites', result, 200);
  }),
};

module.exports = destinationController;
