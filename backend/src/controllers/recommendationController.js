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
    const latitude = req.query.latitude ? parseFloat(req.query.latitude) : null;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

    const feed = await recommendationService.getPersonalizedFeed(userId, {
      latitude,
      longitude,
      limit,
      offset,
    });
    return successResponse(res, 'Personalized recommendation feed retrieved successfully', feed);
  }),

  /**
   * GET /api/recommendations/nearby
   * Get location & proximity-based recommendations (Feature 2)
   */
  getNearbyRecommendations: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const latitude = req.query.latitude ? parseFloat(req.query.latitude) : 13.0827;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude) : 80.2707;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 6;

    const nearby = await recommendationService.getNearbyRecommendations({
      latitude,
      longitude,
      limit,
      userId,
    });
    return successResponse(res, 'Nearby recommendations retrieved successfully', nearby);
  }),

  /**
   * GET /api/recommendations/preferences
   * Get user saved travel interests & preferences (Feature 6 & 7)
   */
  getUserPreferences: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const prefs = await recommendationService.getUserPreferences(userId);
    return successResponse(res, 'User travel preferences retrieved successfully', prefs);
  }),

  /**
   * PUT /api/recommendations/preferences
   * Save user travel interests & preferences (Feature 6 & 7)
   */
  saveUserPreferences: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const saved = await recommendationService.saveUserPreferences(userId, req.body);
    return successResponse(res, 'User travel preferences saved successfully', saved);
  }),

  /**
   * POST /api/recommendations/feedback
   * Submit feedback (useful, not_relevant, not_interested) (Feature 15 & 16)
   */
  submitFeedback: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { itemId, itemType = 'destination', feedbackType = 'useful' } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' });
    }

    const feedback = await recommendationService.submitFeedback(userId, {
      itemId,
      itemType,
      feedbackType,
    });
    return successResponse(res, 'Recommendation feedback recorded successfully', feedback);
  }),

  /**
   * GET /api/recommendations/ml-status
   * Get ML model status and metadata (Feature 14 & 18)
   */
  getMlStatus: asyncHandler(async (req, res) => {
    const status = await recommendationService.getMlStatus();
    return successResponse(res, 'ML recommendation model status retrieved successfully', status);
  }),
};

module.exports = recommendationController;

