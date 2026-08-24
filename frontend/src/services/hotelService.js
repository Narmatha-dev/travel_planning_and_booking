import api from './api';

const hotelService = {
  /**
   * Fetch accommodations near a destination
   */
  async getNearbyHotels(params = {}) {
    const response = await api.get('/hotels/nearby', { params });
    return response.data.data;
  },

  /**
   * Fetch details for a single hotel
   */
  async getHotelDetails(hotelId) {
    const response = await api.get(`/hotels/${hotelId}`);
    return response.data.data;
  },
};

export default hotelService;
