const tripService = require('../services/tripService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const tripController = {
  /**
   * POST /api/trips/generate-preview
   * Generate day-wise itinerary preview before saving
   */
  generatePreview: asyncHandler(async (req, res) => {
    const preview = await tripService.generatePreviewItinerary(req.body);
    return successResponse(res, 'Day-wise itinerary generated successfully', preview);
  }),

  /**
   * POST /api/trips
   * Create trip and save day-by-day itinerary
   */
  createTrip: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const trip = await tripService.createTrip(userId, req.body);
    return successResponse(res, 'Trip created and itinerary saved successfully', trip, 201);
  }),

  /**
   * GET /api/trips
   * List all user trips
   */
  getUserTrips: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const trips = await tripService.getUserTrips(userId);
    return successResponse(res, 'User trips retrieved successfully', trips);
  }),

  /**
   * GET /api/trips/:id
   * Get single trip with day-wise itinerary
   */
  getTripById: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tripId = req.params.id;
    const trip = await tripService.getTripDetails(tripId, userId);
    return successResponse(res, 'Trip details retrieved successfully', trip);
  }),

  /**
   * PUT /api/trips/:id
   * Update trip details and custom itinerary
   */
  updateTrip: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tripId = req.params.id;
    const updatedTrip = await tripService.updateTrip(tripId, userId, req.body);
    return successResponse(res, 'Trip updated successfully', updatedTrip);
  }),

  /**
   * DELETE /api/trips/:id
   * Delete trip and associated itinerary items
   */
  deleteTrip: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const tripId = req.params.id;
    const result = await tripService.deleteTrip(tripId, userId);
    return successResponse(res, 'Trip deleted successfully', result);
  }),
};

module.exports = tripController;
