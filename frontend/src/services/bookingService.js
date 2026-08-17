import api from './api';

const bookingService = {
  /**
   * Get booking history for a user with optional status filter
   */
  async getUserBookings(userId = 3, params = {}) {
    const response = await api.get('/bookings', {
      params: { userId, ...params },
    });
    return response.data.data;
  },

  /**
   * Get single booking details by numeric ID or unique reference
   */
  async getBookingDetails(idOrReference) {
    const response = await api.get(`/bookings/${idOrReference}`);
    return response.data.data;
  },

  /**
   * Create a new booking reservation with payment
   */
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data.data;
  },

  /**
   * Cancel an existing booking
   */
  async cancelBooking(id, reason = 'Customer requested cancellation') {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data.data;
  },

  /**
   * Update booking status
   */
  async updateStatus(id, status) {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data.data;
  },
};

export default bookingService;
