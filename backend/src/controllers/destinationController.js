const destinationService = require('../services/destinationService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const destinationController = {
  getAllDestinations: asyncHandler(async (req, res) => {
    const { category, search, limit, offset } = req.query;
    const destinations = await destinationService.getAllDestinations({
      category,
      search,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return successResponse(res, 'Destinations retrieved successfully', destinations);
  }),

  getDestination: asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    if (/^\d+$/.test(identifier)) {
      const destination = await destinationService.getDestinationById(Number(identifier));
      return successResponse(res, 'Destination retrieved successfully', destination);
    }
    const destination = await destinationService.getDestinationBySlug(identifier);
    return successResponse(res, 'Destination retrieved successfully', destination);
  }),
};

module.exports = destinationController;
