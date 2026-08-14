import api from './api';

const tripService = {
  /**
   * Generate an algorithmic day-wise itinerary preview
   */
  async generatePreview(params) {
    const response = await api.post('/trips/generate-preview', params);
    return response.data.data;
  },

  /**
   * Create trip and save day-wise itinerary in MySQL
   */
  async createTrip(tripData) {
    const response = await api.post('/trips', tripData);
    return response.data.data;
  },

  /**
   * Get all trips for the authenticated user
   */
  async getUserTrips() {
    const response = await api.get('/trips');
    return response.data.data;
  },

  /**
   * Get trip details with full day-by-day itinerary
   */
  async getTripDetails(tripId) {
    const response = await api.get(`/trips/${tripId}`);
    return response.data.data;
  },

  /**
   * Update trip details
   */
  async updateTrip(tripId, updateData) {
    const response = await api.put(`/trips/${tripId}`, updateData);
    return response.data.data;
  },

  /**
   * Delete trip
   */
  async deleteTrip(tripId) {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data.data;
  },
};

export default tripService;
