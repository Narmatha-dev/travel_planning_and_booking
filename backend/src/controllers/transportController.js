const transportService = require('../services/transportService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const transportController = {
  /**
   * GET /api/transport/options?originLat=...&originLng=...&destLat=...&destLng=...&preference=...
   * Computes available transport options, estimated travel times, and approximate fares (Phase 4)
   */
  getTransportOptions: asyncHandler(async (req, res) => {
    const {
      originLat,
      originLng,
      destLat,
      destLng,
      distanceKm,
      duration,
      durationSeconds,
      preference,
      currency,
    } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      const error = new Error('Both origin (originLat, originLng) and destination (destLat, destLng) coordinates are required');
      error.statusCode = 400;
      throw error;
    }

    const transportData = await transportService.getTransportOptions({
      originLat,
      originLng,
      destLat,
      destLng,
      distanceKm,
      durationSeconds: durationSeconds || duration,
      preference: preference || 'any',
      currency: currency || 'INR',
    });

    return successResponse(res, 'Transport options retrieved successfully', transportData, 200);
  }),
};

module.exports = transportController;
