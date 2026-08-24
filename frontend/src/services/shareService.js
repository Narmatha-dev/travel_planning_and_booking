import api from './api';

const shareService = {
  /**
   * Create or get an active share link for a trip
   */
  async createShareLink(tripId) {
    const response = await api.post(`/share/trip/${tripId}`);
    return response.data.data;
  },

  /**
   * Get share status and views count for a trip (owner only)
   */
  async getShareStatus(tripId) {
    const response = await api.get(`/share/trip/${tripId}/status`);
    return response.data.data;
  },

  /**
   * Invalidate old share link and generate a fresh token
   */
  async regenerateShareLink(tripId) {
    const response = await api.post(`/share/trip/${tripId}/regenerate`);
    return response.data.data;
  },

  /**
   * Revoke/Disable share link
   */
  async revokeShareLink(tripId) {
    const response = await api.put(`/share/trip/${tripId}/revoke`);
    return response.data.data;
  },

  /**
   * Public fetch of shared trip plan by token
   */
  async getPublicSharedTrip(token) {
    const response = await api.get(`/share/trip/${token}`);
    return response.data.data;
  },
};

export default shareService;
