import api from './api';

const copilotService = {
  /**
   * Fetch 12-facet Copilot trip summary and readiness matrix
   */
  async getTripSummary(tripId = 1) {
    const response = await api.get(`/copilot/summary/${tripId}`);
    return response.data?.data || null;
  },

  /**
   * Process conversational travel query
   */
  async queryCopilot({ message, tripId = 1, language = 'en', currentLocation = null }) {
    const response = await api.post('/copilot/query', {
      message,
      tripId,
      language,
      currentLocation,
    });
    return response.data?.data || null;
  },
};

export default copilotService;
