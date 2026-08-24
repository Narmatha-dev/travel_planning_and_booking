const rewardService = require('../services/rewardService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const rewardController = {
  /**
   * GET /api/rewards/balance
   * Retrieve current user reward points, tier, and progress
   */
  getRewards: asyncHandler(async (req, res) => {
    const userId = req.user?.id || 3;
    const result = await rewardService.getUserRewards(userId);
    return successResponse(res, 'User rewards data retrieved successfully', result, 200);
  }),

  /**
   * GET /api/rewards/history
   * Retrieve current user points transaction history
   */
  getHistory: asyncHandler(async (req, res) => {
    const userId = req.user?.id || 3;
    const limit = req.query.limit || 50;
    const result = await rewardService.getUserHistory(userId, limit);
    return successResponse(res, 'Reward transaction history retrieved successfully', result, 200);
  }),

  /**
   * GET /api/rewards/stats
   * Retrieve platform reward metrics (Admin only)
   */
  getStats: asyncHandler(async (req, res) => {
    const result = await rewardService.getAdminStats();
    return successResponse(res, 'Reward statistics retrieved successfully', result, 200);
  }),
};

module.exports = rewardController;
