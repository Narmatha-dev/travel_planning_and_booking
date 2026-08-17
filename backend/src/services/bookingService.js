const bookingModel = require('../models/bookingModel');

const bookingService = {
  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId, options = {}) {
    if (!userId) {
      const error = new Error('User ID is required to retrieve bookings');
      error.statusCode = 400;
      throw error;
    }
    return bookingModel.findByUserId(userId, options);
  },

  /**
   * Get single booking by ID or reference
   */
  async getBookingByIdOrReference(idOrRef) {
    if (!idOrRef) {
      const error = new Error('Booking ID or reference is required');
      error.statusCode = 400;
      throw error;
    }

    const booking = await bookingModel.findByIdOrReference(idOrRef);
    if (!booking) {
      const error = new Error(`Booking "${idOrRef}" not found`);
      error.statusCode = 404;
      throw error;
    }
    return booking;
  },

  /**
   * Create a new booking reservation
   */
  async createNewBooking(bookingData) {
    const {
      userId,
      destinationId,
      travelDate,
      numTravelers,
      totalAmount,
    } = bookingData;

    if (!userId || !destinationId || !travelDate || !totalAmount) {
      const error = new Error('Missing required booking fields: userId, destinationId, travelDate, and totalAmount are required');
      error.statusCode = 400;
      throw error;
    }

    const travelersCount = parseInt(numTravelers, 10);
    if (!travelersCount || travelersCount < 1) {
      const error = new Error('Number of travelers must be at least 1');
      error.statusCode = 400;
      throw error;
    }

    if (parseFloat(totalAmount) <= 0) {
      const error = new Error('Total booking amount must be greater than zero');
      error.statusCode = 400;
      throw error;
    }

    // Generate unique booking reference format: BK-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const bookingReference = `BK-${year}-${randomSuffix}`;

    const createdBooking = await bookingModel.createBooking({
      ...bookingData,
      bookingReference,
      numTravelers: travelersCount,
      totalAmount: parseFloat(totalAmount),
      discountAmount: parseFloat(bookingData.discountAmount || 0),
      finalAmount: parseFloat(bookingData.finalAmount || totalAmount),
    });

    return createdBooking;
  },

  /**
   * Cancel an existing booking
   */
  async cancelBooking(id, cancellationReason = 'Customer requested cancellation') {
    const existing = await this.getBookingByIdOrReference(id);

    if (existing.status === 'cancelled') {
      const error = new Error(`Booking #${existing.booking_reference} is already cancelled`);
      error.statusCode = 400;
      throw error;
    }

    if (existing.status === 'completed') {
      const error = new Error(`Cannot cancel completed trip #${existing.booking_reference}`);
      error.statusCode = 400;
      throw error;
    }

    const cancelledBooking = await bookingModel.cancelBooking(existing.id, cancellationReason);
    return {
      ...cancelledBooking,
      message: 'Booking cancelled successfully. Refund processing has been initiated.',
    };
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(id, status) {
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];
    if (!allowedStatuses.includes(status)) {
      const error = new Error(`Invalid status "${status}". Allowed values: ${allowedStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    await this.getBookingByIdOrReference(id);
    return bookingModel.updateStatus(id, status);
  },
};

module.exports = bookingService;
