const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const bookingController = {
  /**
   * GET /api/bookings
   * Retrieve bookings history for a user
   */
  getUserBookings: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { status, limit, offset } = req.query;

    const bookings = await bookingService.getUserBookings(userId, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, 'Bookings history retrieved successfully', bookings);
  }),

  /**
   * GET /api/bookings/:identifier
   * Retrieve single booking details by ID or unique reference
   */
  getBookingByIdOrReference: asyncHandler(async (req, res) => {
    const identifier = req.params.identifier || req.params.reference || req.params.id;
    const booking = await bookingService.getBookingByIdOrReference(identifier);
    return successResponse(res, 'Booking details retrieved successfully', booking);
  }),

  /**
   * POST /api/bookings
   * Create a new booking reservation
   */
  createBooking: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const newBooking = await bookingService.createNewBooking({
      ...req.body,
      userId,
    });
    return successResponse(res, 'Booking reservation created successfully', newBooking, 201);
  }),

  /**
   * PATCH /api/bookings/:id/cancel
   * Cancel an existing booking
   */
  cancelBooking: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const cancelled = await bookingService.cancelBooking(id, reason);
    return successResponse(res, 'Booking cancelled successfully', cancelled);
  }),

  /**
   * PATCH /api/bookings/:id/status
   * Update booking status
   */
  updateBookingStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await bookingService.updateBookingStatus(id, status);
    return successResponse(res, 'Booking status updated successfully', updated);
  }),
};

module.exports = bookingController;
