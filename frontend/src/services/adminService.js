import api from './api';

const adminService = {
  // 1. Dashboard Stats
  async getDashboardStats() {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  // 2. Analytics & Monthly Trends
  async getAnalytics() {
    const response = await api.get('/admin/analytics');
    return response.data.data;
  },

  // 3. User Management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  async updateUserRole(userId, role) {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data.data;
  },

  async updateUserStatus(userId, isActive) {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data.data;
  },

  // 4. Destination Management
  async getDestinations() {
    const response = await api.get('/admin/destinations');
    return response.data.data;
  },

  async createDestination(data) {
    const response = await api.post('/admin/destinations', data);
    return response.data.data;
  },

  async updateDestination(id, data) {
    const response = await api.put(`/admin/destinations/${id}`, data);
    return response.data.data;
  },

  async deleteDestination(id) {
    const response = await api.delete(`/admin/destinations/${id}`);
    return response.data.data;
  },

  // 5. Package Management
  async getPackages() {
    const response = await api.get('/admin/packages');
    return response.data.data;
  },

  async createPackage(data) {
    const response = await api.post('/admin/packages', data);
    return response.data.data;
  },

  async updatePackage(id, data) {
    const response = await api.put(`/admin/packages/${id}`, data);
    return response.data.data;
  },

  async updatePackageStatus(id, isAvailable) {
    const response = await api.patch(`/admin/packages/${id}/status`, { isAvailable });
    return response.data.data;
  },

  async deletePackage(id) {
    const response = await api.delete(`/admin/packages/${id}`);
    return response.data.data;
  },

  // 6. Booking Management
  async getBookings(params = {}) {
    const response = await api.get('/admin/bookings', { params });
    return response.data.data;
  },

  async updateBookingStatus(id, status) {
    const response = await api.put(`/admin/bookings/${id}/status`, { status });
    return response.data.data;
  },

  // 7. Trip Management
  async getTrips(params = {}) {
    const response = await api.get('/admin/trips', { params });
    return response.data.data;
  },

  // 8. Payment View
  async getPayments(params = {}) {
    const response = await api.get('/admin/payments', { params });
    return response.data.data;
  },

  // 9. Review Moderation
  async getReviews(params = {}) {
    const response = await api.get('/admin/reviews', { params });
    return response.data.data;
  },

  async updateReviewApproval(id, isApproved) {
    const response = await api.put(`/admin/reviews/${id}/approval`, { isApproved });
    return response.data.data;
  },

  async deleteReview(id) {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data.data;
  },

  // 10. ML Recommendation Model Management (Feature 18)
  async getMlStatus() {
    const response = await api.get('/admin/ml/status');
    return response.data.data;
  },

  async trainMlModel() {
    const response = await api.post('/admin/ml/train');
    return response.data.data;
  },

  // 11. Advanced Travel Analytics & CSV Export (Phase 21)
  async exportAnalyticsCSV(params = {}) {
    const response = await api.get('/admin/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // 12. Predictive Travel Demand & Forecasting (Phase 22)
  async getForecast(params = {}) {
    const response = await api.get('/admin/forecast', { params });
    return response.data.data;
  },

  async trainForecastModel() {
    const response = await api.post('/admin/forecast/train');
    return response.data.data;
  },
};

export default adminService;


