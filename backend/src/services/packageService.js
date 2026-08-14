const packageModel = require('../models/packageModel');

const packageService = {
  async getAllPackages(filters) {
    return packageModel.findAll(filters);
  },

  async getPackageById(id) {
    const pkg = await packageModel.findById(id);
    if (!pkg) {
      const error = new Error(`Travel package with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return pkg;
  },
};

module.exports = packageService;
