const destinationService = require('../services/destinationService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const destinationController = {
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
