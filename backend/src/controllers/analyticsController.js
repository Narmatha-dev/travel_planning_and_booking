const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const analyticsController = {
  /**
   * GET /api/analytics/user
   * Get personal travel analytics for the authenticated traveler (Feature 1 to 11)
   */
  getUserAnalytics: asyncHandler(async (req, res) => {
    const userId = req.user?.id || 3;
    const analytics = await analyticsService.getUserAnalytics(userId);
    return successResponse(res, 'User travel analytics retrieved successfully', analytics);
  }),

  /**
   * GET /api/analytics/admin
   * Get administrative travel analytics, growth KPIs, and revenue metrics (Feature 12 to 21)
   */
  getAdminAnalytics: asyncHandler(async (req, res) => {
    const analytics = await analyticsService.getAdminAnalytics(req.query);
    return successResponse(res, 'Admin travel analytics retrieved successfully', analytics);
  }),

  /**
   * GET /api/analytics/admin/export
   * Export safe administrative analytics data as CSV (Feature 22)
   */
  exportAdminAnalytics: asyncHandler(async (req, res) => {
    const csvData = await analyticsService.exportAdminAnalyticsCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=travelora-analytics-${Date.now()}.csv`);
    return res.status(200).send(csvData);
  }),

  /**
   * GET /api/analytics/admin/forecast
   * Get predictive travel demand and destination forecasts (Phase 22 - Features 3 to 14)
   */
  getForecast: asyncHandler(async (req, res) => {
    const forecast = await analyticsService.getForecast(req.query);
    return successResponse(res, 'Travel demand predictive forecast generated successfully', forecast);
  }),

  /**
   * POST /api/analytics/admin/forecast/train
   * Retrain predictive time-series demand model (Phase 22 - Features 8, 9, 10)
   */
  trainForecastModel: asyncHandler(async (req, res) => {
    const trained = await analyticsService.trainForecastModel();
    return successResponse(res, 'Predictive demand forecast model retrained successfully', trained);
  }),
};

module.exports = analyticsController;
