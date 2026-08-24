import api from './api';

const rewardService = {
  /**
   * Get current user's reward points, tier, and progress
   */
  async getUserRewards() {
    const response = await api.get('/rewards/balance');
    return response.data.data;
  },

  /**
   * Get user's chronological reward transactions history
   */
  async getUserHistory(limit = 50) {
    const response = await api.get(`/rewards/history?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Get admin aggregated reward metrics
   */
  async getAdminStats() {
    const response = await api.get('/rewards/stats');
    return response.data.data;
  },
};

export default rewardService;
