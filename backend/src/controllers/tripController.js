const tripService = require('../services/tripService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const tripController = {
  getUserTrips: asyncHandler(async (req, res) => {
    const userId = req.query.userId || 3; // Defaults to demo user 3 if auth token not provided
    const trips = await tripService.getUserTrips(userId);
    return successResponse(res, 'Trips retrieved successfully', trips);
  }),

  createTrip: asyncHandler(async (req, res) => {
    const newTrip = await tripService.planNewTrip(req.body);
    return successResponse(res, 'Trip created successfully', newTrip, 201);
  }),
};

module.exports = tripController;
