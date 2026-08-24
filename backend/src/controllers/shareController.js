const shareService = require('../services/shareService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

function getOrigin(req) {
  return req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5173';
}

const shareController = {
  /**
   * POST /api/share/trip/:tripId
   * Create or retrieve active share link (Protected)
   */
  createShareLink: asyncHandler(async (req, res) => {
    const origin = getOrigin(req);
    const result = await shareService.createShareLink(req.params.tripId, req.user.id, origin);
    return successResponse(res, 'Share link generated successfully', result, 201);
  }),

  /**
   * POST /api/share/trip/:tripId/regenerate
   * Regenerate share token (Protected)
   */
  regenerateShareLink: asyncHandler(async (req, res) => {
    const origin = getOrigin(req);
    const result = await shareService.regenerateShareLink(req.params.tripId, req.user.id, origin);
    return successResponse(res, 'Share link regenerated successfully', result, 200);
  }),

  /**
   * PUT /api/share/trip/:tripId/revoke
   * Revoke active share link (Protected)
   */
  revokeShareLink: asyncHandler(async (req, res) => {
    const result = await shareService.revokeShareLink(req.params.tripId, req.user.id);
    return successResponse(res, result.message, result, 200);
  }),

  /**
   * GET /api/share/trip/:tripId/status
   * Get share status and views count for owner (Protected)
   */
  getShareStatus: asyncHandler(async (req, res) => {
    const origin = getOrigin(req);
    const result = await shareService.getShareStatus(req.params.tripId, req.user.id, origin);
    return successResponse(res, 'Share status retrieved successfully', result, 200);
  }),

  /**
   * GET /api/share/trip/:token
   * Public preview of shared trip (Public)
   */
  getPublicSharedTrip: asyncHandler(async (req, res) => {
    const result = await shareService.getPublicSharedTrip(req.params.token);
    return successResponse(res, 'Public trip plan retrieved successfully', result, 200);
  }),
};

module.exports = shareController;
