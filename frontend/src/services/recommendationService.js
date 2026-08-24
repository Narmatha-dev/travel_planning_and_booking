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
  async getPersonalizedFeed(params = {}) {
    const response = await api.get('/recommendations/personalized', { params });
    return response.data.data;
  },

  /**
   * Retrieve nearby recommendations based on GPS coordinates
   */
  async getNearbyRecommendations(params = {}) {
    const response = await api.get('/recommendations/nearby', { params });
    return response.data.data;
  },

  /**
   * Get user travel interests & preferences
   */
  async getUserPreferences() {
    const response = await api.get('/recommendations/preferences');
    return response.data.data;
  },

  /**
   * Save user travel interests & preferences
   */
  async saveUserPreferences(preferences) {
    const response = await api.put('/recommendations/preferences', preferences);
    return response.data.data;
  },

  /**
   * Submit recommendation feedback (useful, not_relevant, not_interested)
   */
  async submitFeedback(feedbackData) {
    const response = await api.post('/recommendations/feedback', feedbackData);
    return response.data.data;
  },
};

export default recommendationService;

