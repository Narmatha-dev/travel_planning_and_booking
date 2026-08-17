import api from './api';

const recommendationService = {
  /**
   * Compute AI-personalized recommendations based on user criteria
   */
  async getRecommendations(criteria = {}) {
    const response = await api.post('/recommendations', criteria);
    return response.data.data;
  },

  /**
   * Retrieve personalized recommendations feed for current user
   */
  async getPersonalizedFeed(userId = 3) {
    const response = await api.get('/recommendations/personalized', {
      params: { userId },
    });
    return response.data.data;
  },
};

export default recommendationService;
