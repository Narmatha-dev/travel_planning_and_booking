import api from './api';

const analyticsService = {
  /**
   * 1. Get personal travel analytics for current user (Phase 21 - Features 1 to 11)
   */
  async getUserAnalytics() {
    const response = await api.get('/analytics/user');
    return response.data.data;
  },

  /**
   * 2. Get administrative travel analytics & business KPIs (Phase 21 - Features 12 to 21)
   */
  async getAdminAnalytics(params = {}) {
    const response = await api.get('/analytics/admin', { params });
    return response.data.data;
  },

  /**
   * 3. Export safe administrative analytics CSV (Phase 21 - Feature 22)
   */
  async exportAdminAnalytics(params = {}) {
    const response = await api.get('/analytics/admin/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * 4. Get predictive travel demand and destination forecasts (Phase 22 - Features 3 to 14)
   */
  async getForecast(params = {}) {
    const response = await api.get('/analytics/admin/forecast', { params });
    return response.data.data;
  },

  /**
   * 5. Retrain predictive time-series demand model (Phase 22 - Feature 9 & 21)
   */
  async trainForecastModel() {
    const response = await api.post('/analytics/admin/forecast/train');
    return response.data.data;
  },
};

export default analyticsService;
