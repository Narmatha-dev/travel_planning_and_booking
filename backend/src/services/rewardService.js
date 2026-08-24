const rewardModel = require('../models/rewardModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

// Standard point values configuration (Feature 1)
const REWARD_CONFIG = {
  trip_completed: { points: 100, label: 'Completed Trip', defaultDesc: 'Completed a travel journey' },
  review_submitted: { points: 25, label: 'Verified Review', defaultDesc: 'Submitted a verified travel review' },
  trip_saved: { points: 10, label: 'Saved Trip Plan', defaultDesc: 'Saved a customized trip itinerary' },
};

const rewardService = {
  /**
   * Internal method to safely award reward points to a user (Feature 1, 4, 5, 6, 7 & 15)
   */
  async awardPoints(userId, activityType, referenceId, customPoints = null, customDescription = null) {
    if (!userId) return { isNew: false, points: 0 };

    const config = REWARD_CONFIG[activityType] || { points: 10, defaultDesc: 'Travel engagement' };
    const pointsToAward = customPoints !== null && customPoints !== undefined ? customPoints : config.points;
    const desc = customDescription || config.defaultDesc;

    const result = await rewardModel.addTransaction({
      userId,
      activityType,
      referenceId,
      points: pointsToAward,
      description: desc,
    });

    // Feature 15: In-App System Notification on successful point award
    if (result.isNew && result.points > 0) {
      try {
        await notificationService.createSystemNotification({
          userId,
          title: '🏆 Reward Points Earned!',
          message: `You earned +${result.points} Travel Points for ${desc}!`,
          type: 'system',
          linkUrl: '/rewards',
          preventDuplicate: false,
        });
      } catch (err) {
        console.warn('Reward notification trigger failed:', err.message);
      }
    }

    return result;
  },

  /**
   * Get reward balance, level progress, and recent transactions for user (Feature 2, 8, 9 & 10)
   */
  async getUserRewards(userId) {
    if (!userId) {
      throw new ApiError(401, 'User authentication required.');
    }

    const [balanceData, transactions] = await Promise.all([
      rewardModel.getUserBalance(userId),
      rewardModel.getUserTransactions(userId, 50),
    ]);

    return {
      ...balanceData,
      transactions,
    };
  },

  /**
   * Get transaction history
   */
  async getUserHistory(userId, limit = 50) {
    if (!userId) {
      throw new ApiError(401, 'User authentication required.');
    }
    return rewardModel.getUserTransactions(userId, limit);
  },

  /**
   * Get admin reward analytics (Feature 11)
   */
  async getAdminStats() {
    return rewardModel.getAdminStats();
  },
};

module.exports = rewardService;
