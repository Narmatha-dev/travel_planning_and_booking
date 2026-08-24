const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const notificationController = {
  /**
   * GET /api/notifications
   * Fetch notifications for authenticated user
   */
  getNotifications: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { unreadOnly, type, limit, offset } = req.query;

    const data = await notificationService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      type,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, 'Notifications retrieved successfully', data);
  }),

  /**
   * GET /api/notifications/unread-count
   * Fetch unread notification count
   */
  getUnreadCount: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const count = await notificationService.getUnreadCount(userId);
    return successResponse(res, 'Unread count retrieved successfully', { unreadCount: count });
  }),

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  markAsRead: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;
    const { id } = req.params;

    const result = await notificationService.markAsRead(id, userId);
    return successResponse(res, 'Notification marked as read', result);
  }),

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllAsRead: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.body.userId || 3;

    const result = await notificationService.markAllAsRead(userId);
    return successResponse(res, 'All notifications marked as read', result);
  }),

  /**
   * DELETE /api/notifications/:id
   * Delete a single notification
   */
  deleteNotification: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;
    const { id } = req.params;

    const result = await notificationService.deleteNotification(id, userId);
    return successResponse(res, 'Notification deleted successfully', result);
  }),

  /**
   * DELETE /api/notifications/clear-all
   * Clear all notifications for user
   */
  clearAll: asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.query.userId || 3;

    const result = await notificationService.clearAll(userId);
    return successResponse(res, 'All notifications cleared successfully', result);
  }),
};

module.exports = notificationController;
