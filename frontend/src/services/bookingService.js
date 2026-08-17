import api from './api';

const bookingService = {
  /**
   * Get all bookings for the logged-in user
   */
  async getUserBookings(userId) {
    const response = await api.get('/bookings', { params: { userId } });
    return response.data.data;
  },

  /**
   * Get single booking by booking reference
   */
  async getBookingByReference(reference) {
    const response = await api.get(`/bookings/${reference}`);
    return response.data.data;
  },

  /**
   * Create a new booking reservation
   */
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data.data;
  },
};

export default bookingService;
