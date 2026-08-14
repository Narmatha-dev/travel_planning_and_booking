const bookingModel = require('../models/bookingModel');

const bookingService = {
  async getUserBookings(userId) {
    return bookingModel.findByUserId(userId);
  },

  async getBookingByReference(reference) {
    const booking = await bookingModel.findByReference(reference);
    if (!booking) {
      const error = new Error(`Booking #${reference} not found`);
      error.statusCode = 404;
      throw error;
    }
    return booking;
  },

  async createNewBooking(bookingData) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `BK-${new Date().getFullYear()}-${randomSuffix}`;

    const bookingId = await bookingModel.createBooking({
      ...bookingData,
      bookingReference,
      finalAmount: bookingData.finalAmount || bookingData.totalAmount,
    });

    return { id: bookingId, bookingReference, ...bookingData };
  },
};

module.exports = bookingService;
