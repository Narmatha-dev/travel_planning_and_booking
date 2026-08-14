const packageService = require('../services/packageService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const packageController = {
  getAllPackages: asyncHandler(async (req, res) => {
    const { destinationId, packageType, limit, offset } = req.query;
    const packages = await packageService.getAllPackages({
      destinationId,
      packageType,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return successResponse(res, 'Packages retrieved successfully', packages);
  }),

  getPackageById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pkg = await packageService.getPackageById(id);
    return successResponse(res, 'Package retrieved successfully', pkg);
  }),
};

module.exports = packageController;
