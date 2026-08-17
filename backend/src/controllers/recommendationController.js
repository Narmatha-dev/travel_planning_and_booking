const recommendationService = require('../services/recommendationService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const recommendationController = {
  /**
   * POST /api/recommendations
   * Compute AI-personalized travel recommendations based on criteria
   */
  getRecommendations: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const recommendations = await recommendationService.getRecommendations({
      ...req.body,
      userId,
    });
    return successResponse(res, 'Personalized travel recommendations generated successfully', recommendations);
  }),

  /**
   * GET /api/recommendations/personalized
   * Retrieve curated automated feed for the logged-in traveler
   */
  getPersonalizedFeed: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const feed = await recommendationService.getPersonalizedFeed(userId);
    return successResponse(res, 'Personalized recommendation feed retrieved successfully', feed);
  }),
};

module.exports = recommendationController;
