const packageModel = require('../models/packageModel');

const packageService = {
  /**
   * Get all packages with optional filters, search, and sorting
   */
  async getAllPackages(filters = {}) {
    return packageModel.findAll(filters);
  },

  /**
   * Get top featured packages for home & promotion showcases
   */
  async getFeaturedPackages(limit = 4) {
    return packageModel.getFeatured(limit);
  },

  /**
   * Get single package by ID or URL slug
   */
  async getPackageByIdOrSlug(idOrSlug) {
    if (!idOrSlug) {
      const error = new Error('Package identifier is required');
      error.statusCode = 400;
      throw error;
    }

    const pkg = await packageModel.findByIdOrSlug(idOrSlug);
    if (!pkg) {
      const error = new Error(`Travel package "${idOrSlug}" not found`);
      error.statusCode = 404;
      throw error;
    }
    return pkg;
  },

  /**
   * Create a new travel package
   */
  async createPackage(packageData) {
    const { destinationId, title, durationDays, basePrice } = packageData;

    if (!destinationId || !title || !durationDays || !basePrice) {
      const error = new Error('Destination ID, title, duration (days), and base price are required');
      error.statusCode = 400;
      throw error;
    }

    if (parseFloat(basePrice) < 0 || parseInt(durationDays, 10) < 1) {
      const error = new Error('Duration must be at least 1 day and price cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    return packageModel.create(packageData);
  },

  /**
   * Update existing package
   */
  async updatePackage(id, packageData) {
    await this.getPackageByIdOrSlug(id);
    return packageModel.update(id, packageData);
  },

  /**
   * Update package availability status
   */
  async updateAvailability(id, isAvailable) {
    await this.getPackageByIdOrSlug(id);
    return packageModel.updateAvailability(id, isAvailable);
  },

  /**
   * Delete a package
   */
  async deletePackage(id) {
    await this.getPackageByIdOrSlug(id);
    const deleted = await packageModel.delete(id);
    if (!deleted) {
      const error = new Error(`Failed to delete package ${id}`);
      error.statusCode = 500;
      throw error;
    }
    return { id: parseInt(id, 10), message: 'Package deleted successfully' };
  },
};

module.exports = packageService;
