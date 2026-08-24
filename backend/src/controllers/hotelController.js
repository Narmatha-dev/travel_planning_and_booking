const hotelService = require('../services/hotelService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const hotelController = {
  /**
   * GET /api/hotels/nearby
   * Search for accommodations near destination coordinates
   */
  getNearbyHotels: asyncHandler(async (req, res) => {
    const {
      latitude,
      longitude,
      destinationId,
      destinationName,
      destination,
      type,
      accommodationType,
      minRating,
      maxPrice,
      maxDistanceKm,
      sortBy,
      currency,
      budget,
    } = req.query;

    const result = await hotelService.getHotelsNearDestination({
      latitude,
      longitude,
      destinationId,
      destinationName: destinationName || destination,
      destination: destination || destinationName,
      type: type || accommodationType,
      accommodationType: accommodationType || type,
      minRating,
      maxPrice,
      maxDistanceKm,
      sortBy,
      currency,
      budget,
    });

    return successResponse(res, 'Accommodations retrieved successfully', result);
  }),

  /**
   * GET /api/hotels/:id
   * Get single accommodation details
   */
  getHotelById: asyncHandler(async (req, res) => {
    const hotel = await hotelService.getHotelById(req.params.id);
    return successResponse(res, 'Accommodation details retrieved successfully', hotel);
  }),
};

module.exports = hotelController;
