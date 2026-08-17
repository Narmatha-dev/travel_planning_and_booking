const packageService = require('../services/packageService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const packageController = {
  /**
   * GET /api/packages
   * Retrieve all packages with filtering and search
   */
  getAllPackages: asyncHandler(async (req, res) => {
    const {
      destinationId,
      packageType,
      difficultyLevel,
      minPrice,
      maxPrice,
      search,
      isAvailable,
      sortBy,
      limit,
      offset,
    } = req.query;

    const packages = await packageService.getAllPackages({
      destinationId,
      packageType,
      difficultyLevel,
      minPrice,
      maxPrice,
      search,
      isAvailable,
      sortBy,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, 'Packages retrieved successfully', packages);
  }),

  /**
   * GET /api/packages/featured
   * Retrieve featured packages
   */
  getFeaturedPackages: asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 4;
    const packages = await packageService.getFeaturedPackages(limit);
    return successResponse(res, 'Featured packages retrieved successfully', packages);
  }),

  /**
   * GET /api/packages/:identifier
   * Retrieve single package by ID or Slug
   */
  getPackageByIdOrSlug: asyncHandler(async (req, res) => {
    const identifier = req.params.identifier || req.params.id;
    const pkg = await packageService.getPackageByIdOrSlug(identifier);
    return successResponse(res, 'Package retrieved successfully', pkg);
  }),

  /**
   * POST /api/packages
   * Create a new package
   */
  createPackage: asyncHandler(async (req, res) => {
    const newPackage = await packageService.createPackage(req.body);
    return successResponse(res, 'Travel package created successfully', newPackage, 201);
  }),

  /**
   * PUT /api/packages/:id
   * Update package details
   */
  updatePackage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await packageService.updatePackage(id, req.body);
    return successResponse(res, 'Travel package updated successfully', updated);
  }),

  /**
   * PATCH /api/packages/:id/availability
   * Toggle or update package availability
   */
  updateAvailability: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const updated = await packageService.updateAvailability(id, isAvailable);
    return successResponse(res, 'Package availability updated successfully', updated);
  }),

  /**
   * DELETE /api/packages/:id
   * Delete a package
   */
  deletePackage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await packageService.deletePackage(id);
    return successResponse(res, 'Package deleted successfully', result);
  }),
};

module.exports = packageController;
