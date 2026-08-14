const destinationModel = require('../models/destinationModel');

const destinationService = {
  async getAllDestinations(filters) {
    return destinationModel.findAll(filters);
  },

  async getDestinationById(id) {
    const destination = await destinationModel.findById(id);
    if (!destination) {
      const error = new Error(`Destination with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return destination;
  },

  async getDestinationBySlug(slug) {
    const destination = await destinationModel.findBySlug(slug);
    if (!destination) {
      const error = new Error(`Destination '${slug}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return destination;
  },
};

module.exports = destinationService;
