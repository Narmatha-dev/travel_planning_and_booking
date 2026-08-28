const copilotService = require('../services/copilotService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const copilotController = {
  /**
   * GET /api/copilot/summary/:tripId
   * Retrieve unified 12-facet Copilot trip summary and readiness matrix
   */
  getSummary: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { tripId } = req.params;

    const summary = await copilotService.getTripCopilotSummary(tripId, userId);
    return successResponse(res, 'Trip Copilot summary compiled successfully', summary);
  }),

  /**
   * POST /api/copilot/query
   * Process natural language query from AI Travel Copilot
   */
  processQuery: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { message, tripId, language, currentLocation } = req.body;

    const result = await copilotService.processCopilotQuery({
      message,
      tripId: tripId || 1,
      userId,
      language: language || 'en',
      currentLocation,
    });

    return successResponse(res, 'Copilot query processed', result);
  }),
};

module.exports = copilotController;
