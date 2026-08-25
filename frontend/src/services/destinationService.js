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
   * Get real nearby tourist destinations based on user GPS coordinates (Phase 2)
   */
  async getNearbyDestinations(latitude, longitude, { category = 'all', radius = 150, limit = 12 } = {}) {
    const response = await api.get('/destinations/nearby', {
      params: { lat: latitude, lng: longitude, category, radius, limit },
    });
    return response.data.data;
  },

  /**
   * Get real place details by place ID (Phase 2)
   */
  async getNearbyPlaceDetails(placeId) {
    const response = await api.get(`/destinations/nearby/${placeId}`);
    return response.data.data;
  },

  /**
   * Get Pan-India tourist destinations across all 7 regions
   */
  async getIndiaDestinations({ region = 'all', category = 'all', search = '', sortBy = 'popular', latitude = null, longitude = null, limit = 50, offset = 0 } = {}) {
    const response = await api.get('/destinations/india', {
      params: { region, category, search, sortBy, lat: latitude, lng: longitude, limit, offset },
    });
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
