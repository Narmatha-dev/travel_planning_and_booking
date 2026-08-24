import api from './api';

const transportService = {
  /**
   * Retrieves available transport options, estimated travel times, and fares (Phase 4)
   */
  async getTransportOptions({
    originLat,
    originLng,
    destLat,
    destLng,
    distanceKm,
    duration,
    preference = 'any',
    currency = 'INR',
  }) {
    const response = await api.get('/transport/options', {
      params: {
        originLat,
        originLng,
        destLat,
        destLng,
        distanceKm,
        duration,
        preference,
        currency,
      },
    });
    return response.data.data;
  },
};

export default transportService;
