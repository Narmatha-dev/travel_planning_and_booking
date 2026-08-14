const destinationModel = require('../models/destinationModel');

const destinationService = {
  /**
   * Get all destinations with query filters
   */
  async getAllDestinations(filters = {}, userId = null) {
    return destinationModel.findAll({ ...filters, userId });
  },

  /**
   * Search destinations with keywords and filters
   */
  async searchDestinations(searchParams = {}, userId = null) {
    return destinationModel.search({ ...searchParams, userId });
  },

  /**
   * Get popular / featured destinations
   */
  async getPopularDestinations(userId = null) {
    return destinationModel.findAll({ isFeatured: true, limit: 6, userId });
  },

  /**
   * Get destination details by ID or slug
   */
  async getDestinationDetails(idOrSlug, userId = null) {
    const destination = await destinationModel.findByIdOrSlug(idOrSlug, userId);
    if (!destination) {
      const error = new Error(`Destination '${idOrSlug}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return destination;
  },

  /**
   * Add to favorites
   */
  async addFavorite(userId, destinationId) {
    if (!destinationId) {
      const error = new Error('Destination ID is required');
      error.statusCode = 400;
      throw error;
    }
    await destinationModel.addFavorite(userId, destinationId);
    return { destinationId: parseInt(destinationId, 10), isFavorite: true };
  },

  /**
   * Remove from favorites
   */
  async removeFavorite(userId, destinationId) {
    if (!destinationId) {
      const error = new Error('Destination ID is required');
      error.statusCode = 400;
      throw error;
    }
    await destinationModel.removeFavorite(userId, destinationId);
    return { destinationId: parseInt(destinationId, 10), isFavorite: false };
  },
};

module.exports = destinationService;
