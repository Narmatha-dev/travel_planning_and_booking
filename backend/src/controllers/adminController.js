const adminService = require('../services/adminService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const adminController = {
  // 1. Dashboard Statistics
  getStats: asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    return successResponse(res, 'Admin statistics retrieved successfully', stats);
  }),

  // 2. User Management
  getUsers: asyncHandler(async (req, res) => {
    const users = await adminService.getAllUsers(req.query);
    return successResponse(res, 'Users list retrieved successfully', users);
  }),

  updateUserRole: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const updated = await adminService.updateUserRole(id, role);
    return successResponse(res, 'User role updated successfully', updated);
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await adminService.updateUserStatus(id, isActive);
    return successResponse(res, 'User status updated successfully', updated);
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminService.deleteUser(id);
    return successResponse(res, 'User deleted successfully', result);
  }),

  // 3. Destination Management
  getDestinations: asyncHandler(async (req, res) => {
    const list = await adminService.getAllDestinations();
    return successResponse(res, 'Destinations retrieved successfully', list);
  }),

  createDestination: asyncHandler(async (req, res) => {
    const created = await adminService.createDestination(req.body);
    return successResponse(res, 'Destination created successfully', created, 201);
  }),

  updateDestination: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await adminService.updateDestination(id, req.body);
    return successResponse(res, 'Destination updated successfully', updated);
  }),

  deleteDestination: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminService.deleteDestination(id);
    return successResponse(res, 'Destination deleted successfully', result);
  }),

  // 4. Package Management
  getPackages: asyncHandler(async (req, res) => {
    const list = await adminService.getAllPackages();
    return successResponse(res, 'Packages retrieved successfully', list);
  }),

  createPackage: asyncHandler(async (req, res) => {
    const created = await adminService.createPackage(req.body);
    return successResponse(res, 'Package created successfully', created, 201);
  }),

  updatePackage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await adminService.updatePackage(id, req.body);
    return successResponse(res, 'Package updated successfully', updated);
  }),

  updatePackageStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isAvailable, isActive } = req.body;
    const isAvail = isAvailable !== undefined ? Boolean(isAvailable) : Boolean(isActive);
    const updated = await adminService.updatePackageStatus(id, isAvail);
    return successResponse(res, `Package ${isAvail ? 'activated' : 'deactivated'} successfully`, updated);
  }),

  deletePackage: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminService.deletePackage(id);
    return successResponse(res, 'Package deleted successfully', result);
  }),

  // 5. Booking Management
  getBookings: asyncHandler(async (req, res) => {
    const list = await adminService.getAllBookings(req.query);
    return successResponse(res, 'Bookings list retrieved successfully', list);
  }),

  updateBookingStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await adminService.updateBookingStatus(id, status);
    return successResponse(res, 'Booking status updated successfully', updated);
  }),

  // 6. Trip Management (Feature 9)
  getTrips: asyncHandler(async (req, res) => {
    const list = await adminService.getAllTrips(req.query);
    return successResponse(res, 'Trips list retrieved successfully', list);
  }),

  // 7. Payment View (Feature 11)
  getPayments: asyncHandler(async (req, res) => {
    const list = await adminService.getAllPayments(req.query);
    return successResponse(res, 'Payments list retrieved successfully', list);
  }),

  // 8. Review Management (Feature 10)
  getReviews: asyncHandler(async (req, res) => {
    const list = await adminService.getAllReviews(req.query);
    return successResponse(res, 'Reviews retrieved successfully', list);
  }),

  updateReviewApproval: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    const updated = await adminService.updateReviewApproval(id, isApproved);
    return successResponse(res, 'Review approval updated successfully', updated);
  }),

  deleteReview: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await adminService.deleteReview(id);
    return successResponse(res, 'Review deleted successfully', result);
  }),

  // 9. Analytics Data (Phase 21 & Feature 3 & 4)
  getAnalytics: asyncHandler(async (req, res) => {
    const analytics = await adminService.getAdvancedAnalytics(req.query);
    return successResponse(res, 'Analytics data retrieved successfully', analytics);
  }),

  exportAnalyticsCSV: asyncHandler(async (req, res) => {
    const csvData = await adminService.exportAnalyticsCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=travelora-admin-analytics-${Date.now()}.csv`);
    return res.status(200).send(csvData);
  }),

  // 10. ML Model Status & Metrics (Feature 18)
  getMlStatus: asyncHandler(async (req, res) => {
    const status = await adminService.getMlModelStatus();
    return successResponse(res, 'ML recommendation model status retrieved successfully', status);
  }),

  // 11. Trigger ML Model Retraining (Feature 11 & 18)
  trainMlModel: asyncHandler(async (req, res) => {
    const trained = await adminService.trainMlModel();
    return successResponse(res, 'ML recommendation model trained and deployed successfully', trained);
  }),

  // 12. Predictive Travel Analytics & Demand Forecasting (Phase 22)
  getForecast: asyncHandler(async (req, res) => {
    const forecast = await adminService.getForecast(req.query);
    return successResponse(res, 'Travel demand predictive forecast generated successfully', forecast);
  }),

  trainForecastModel: asyncHandler(async (req, res) => {
    const trained = await adminService.trainForecastModel();
    return successResponse(res, 'Predictive demand forecast model retrained successfully', trained);
  }),
};

module.exports = adminController;

