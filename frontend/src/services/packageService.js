import api from './api';

const packageService = {
  /**
   * Get all packages with optional query parameters (destinationId, packageType, difficultyLevel, minPrice, maxPrice, search, isAvailable, sortBy)
   */
  async getPackages(params = {}) {
    const response = await api.get('/packages', { params });
    return response.data.data;
  },

  /**
   * Get featured packages for home page
   */
  async getFeaturedPackages(limit = 4) {
    const response = await api.get('/packages/featured', { params: { limit } });
    return response.data.data;
  },

  /**
   * Get single package by numeric ID or URL slug
   */
  async getPackageDetails(idOrSlug) {
    const response = await api.get(`/packages/${idOrSlug}`);
    return response.data.data;
  },

  /**
   * Create a new package
   */
  async createPackage(packageData) {
    const response = await api.post('/packages', packageData);
    return response.data.data;
  },

  /**
   * Update package details
   */
  async updatePackage(id, packageData) {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data.data;
  },

  /**
   * Toggle or update package availability
   */
  async toggleAvailability(id, isAvailable) {
    const response = await api.patch(`/packages/${id}/availability`, { isAvailable });
    return response.data.data;
  },

  /**
   * Delete a package
   */
  async deletePackage(id) {
    const response = await api.delete(`/packages/${id}`);
    return response.data.data;
  },
};

export default packageService;
