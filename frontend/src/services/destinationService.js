import api from './api';

const destinationService = {
  /**
   * Get all destinations with query filters
   */
  async getDestinations(params = {}) {
    const response = await api.get('/destinations', { params });
    return response.data.data;
  },

  /**
   * Search destinations with keywords and filters
   */
  async searchDestinations(query = '', filters = {}) {
    const response = await api.get('/destinations/search', {
      params: { q: query, ...filters },
    });
    return response.data.data;
  },

  /**
   * Get popular & featured destinations
   */
  async getPopularDestinations() {
    const response = await api.get('/destinations/popular');
    return response.data.data;
  },

  /**
   * Get single destination by numeric ID or slug
   */
  async getDestinationDetails(idOrSlug) {
    const response = await api.get(`/destinations/${idOrSlug}`);
    return response.data.data;
  },

  /**
   * Add destination to favorites (requires auth)
   */
  async addFavorite(destinationId) {
    const response = await api.post(`/destinations/${destinationId}/favorite`);
    return response.data.data;
  },

  /**
   * Remove destination from favorites (requires auth)
   */
  async removeFavorite(destinationId) {
    const response = await api.delete(`/destinations/${destinationId}/favorite`);
    return response.data.data;
  },
};

export default destinationService;
