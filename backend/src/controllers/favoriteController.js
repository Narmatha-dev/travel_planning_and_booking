const favoriteService = require('../services/favoriteService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const favoriteController = {
  /**
   * GET /api/favorites
   * Retrieve all favorites for current user
   */
  getFavorites: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const result = await favoriteService.getUserFavorites(userId, req.query);
    return successResponse(res, 'User favorites retrieved successfully', result);
  }),

  /**
   * POST /api/favorites
   * Add destination, place, hotel, or trip to favorites
   */
  addFavorite: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const result = await favoriteService.addFavorite(userId, req.body);
    return successResponse(res, result.message, result, 201);
  }),

  /**
   * POST /api/favorites/toggle
   * Toggle favorite state for an item
   */
  toggleFavorite: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const result = await favoriteService.toggleFavorite(userId, req.body);
    return successResponse(res, result.message, result);
  }),

  /**
   * DELETE /api/favorites/:id
   * Remove favorite by ID or item reference
   */
  removeFavorite: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body?.userId || req.query?.userId || 3;
    const { id } = req.params;
    const { itemType, itemId, destinationId } = req.query;

    const result = await favoriteService.removeFavorite(userId, {
      id: id !== 'item' ? id : undefined,
      itemType: req.body?.itemType || itemType,
      itemId: req.body?.itemId || itemId,
      destinationId: req.body?.destinationId || destinationId,
    });

    return successResponse(res, result.message, result);
  }),

  /**
   * GET /api/favorites/check/:type/:id
   * Check if a specific item is in user's favorites
   */
  checkFavorite: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { type, id } = req.params;
    const result = await favoriteService.checkFavoriteStatus(userId, type, id);
    return successResponse(res, 'Favorite status checked', result);
  }),

  /**
   * GET /api/favorites/summary
   * Summary counts across places, hotels, trips
   */
  getSummary: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const result = await favoriteService.getFavoritesSummary(userId);
    return successResponse(res, 'Favorites summary retrieved', result);
  }),
};

module.exports = favoriteController;
