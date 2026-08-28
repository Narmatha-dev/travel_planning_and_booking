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

    // Feature 3: Automated Booking Confirmation Notification (Phase 10)
    try {
      const notificationService = require('./notificationService');
      await notificationService.createSystemNotification({
        userId: createdBooking.user_id || bookingData.userId || 3,
        title: '🎉 Trip Confirmed',
        message: `Your trip to ${createdBooking.destination_name || 'your destination'} has been successfully booked.`,
        type: 'booking_update',
        linkUrl: '/my-trips?tab=upcoming',
        preventDuplicate: false,
      });
    } catch {}

    return createdBooking;
  },

  /**
   * Cancel an existing booking
   */
  async cancelBooking(id, cancellationReason = 'Customer requested cancellation') {
    const existing = await this.getBookingByIdOrReference(id);

    if (existing.status === 'cancelled') {
      return {
        ...existing,
        message: `Booking #${existing.booking_reference} is already cancelled. Refund is in process.`,
      };
    }

    if (existing.status === 'completed') {
      const error = new Error(`Cannot cancel completed trip #${existing.booking_reference}`);
      error.statusCode = 400;
      throw error;
    }

    const cancelledBooking = await bookingModel.cancelBooking(existing.id, cancellationReason);

    // Feature 2: Automated Cancellation Notification (Phase 10)
    try {
      const notificationService = require('./notificationService');
      await notificationService.createSystemNotification({
        userId: existing.user_id || 3,
        title: '❌ Booking Cancelled',
        message: `Your reservation #${existing.booking_reference} for ${existing.destination_name || 'your destination'} has been cancelled.`,
        type: 'booking_update',
        linkUrl: '/my-trips?tab=cancelled',
        preventDuplicate: false,
      });
    } catch {}

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

    const booking = await this.getBookingByIdOrReference(id);
    const updated = await bookingModel.updateStatus(id, status);

    // Feature 5: Award Completed Trip Reward (+100 pts)
    if (status === 'completed' && booking) {
      try {
        const rewardService = require('./rewardService');
        await rewardService.awardPoints(
          booking.user_id || 3,
          'trip_completed',
          `booking_${booking.id || id}`,
          100,
          `Completed trip to ${booking.destination_name || 'Destination'}`
        );
      } catch (err) {
        console.warn('Completed trip reward trigger failed:', err.message);
      }
    }

    return updated;
  },
};

module.exports = bookingService;
