import api from './api';

const notificationService = {
  /**
   * Get user notifications with optional filtering
   */
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.data?.unreadCount || 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data.data;
  },

  /**
   * Clear all notifications for user
   */
  async clearAll() {
    const response = await api.delete('/notifications/clear-all');
    return response.data.data;
  },
};

export default notificationService;
