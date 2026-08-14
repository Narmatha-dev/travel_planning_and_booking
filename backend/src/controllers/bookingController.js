const bookingService = require('../services/bookingService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const bookingController = {
  getUserBookings: asyncHandler(async (req, res) => {
    const userId = req.query.userId || 3;
    const bookings = await bookingService.getUserBookings(userId);
    return successResponse(res, 'Bookings retrieved successfully', bookings);
  }),

  getBookingByReference: asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const booking = await bookingService.getBookingByReference(reference);
    return successResponse(res, 'Booking retrieved successfully', booking);
  }),

  createBooking: asyncHandler(async (req, res) => {
    const newBooking = await bookingService.createNewBooking(req.body);
    return successResponse(res, 'Booking created successfully', newBooking, 201);
  }),
};

module.exports = bookingController;
