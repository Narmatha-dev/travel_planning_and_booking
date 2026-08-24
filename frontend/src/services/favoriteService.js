import api from './api';

const favoriteService = {
  /**
   * Get user's favorites with optional category and search query
   */
  async getFavorites(params = {}) {
    const response = await api.get('/favorites', { params });
    return response.data.data;
  },

  /**
   * Get user's favorites summary counts
   */
  async getSummary() {
    const response = await api.get('/favorites/summary');
    return response.data.data;
  },

  /**
   * Add a destination, place, hotel, or trip to favorites
   */
  async addFavorite(payload) {
    const response = await api.post('/favorites', payload);
    return response.data.data;
  },

  /**
   * Remove item from favorites
   */
  async removeFavorite(id, params = {}) {
    const response = await api.delete(`/favorites/${id || 'item'}`, { params });
    return response.data.data;
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(payload) {
    const response = await api.post('/favorites/toggle', payload);
    return response.data.data;
  },

  /**
   * Check if a specific item is in favorites
   */
  async checkFavorite(type, id) {
    const response = await api.get(`/favorites/check/${type}/${id}`);
    return response.data.data;
  },
};

export default favoriteService;
