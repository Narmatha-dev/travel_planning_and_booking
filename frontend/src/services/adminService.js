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
};

export default adminService;
