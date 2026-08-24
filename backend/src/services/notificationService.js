const notificationModel = require('../models/notificationModel');
const bookingModel = require('../models/bookingModel');

const notificationService = {
  /**
   * Get paginated notifications for an authenticated user
   */
  async getUserNotifications(userId, options = {}) {
    if (!userId) {
      const error = new Error('User ID is required to fetch notifications');
      error.statusCode = 400;
      throw error;
    }

    // Automatically check for dynamic trip reminders on fetch
    await this.checkAndGenerateTripReminders(userId).catch(() => {});

    const notifications = await notificationModel.findByUserId(userId, options);
    const unreadCount = await notificationModel.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
      total: notifications.length,
    };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;
    return notificationModel.getUnreadCount(userId);
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id, userId) {
    if (!id || !userId) {
      const error = new Error('Notification ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const success = await notificationModel.markAsRead(id, userId);
    if (!success) {
      const error = new Error('Notification not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const unreadCount = await notificationModel.getUnreadCount(userId);
    return { success: true, unreadCount };
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    if (!userId) {
      const error = new Error('User ID is required');
      error.statusCode = 400;
      throw error;
    }

    await notificationModel.markAllAsRead(userId);
    return { success: true, unreadCount: 0 };
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(id, userId) {
    if (!id || !userId) {
      const error = new Error('Notification ID and User ID are required');
      error.statusCode = 400;
      throw error;
    }

    const success = await notificationModel.deleteNotification(id, userId);
    const unreadCount = await notificationModel.getUnreadCount(userId);
    return { success, unreadCount };
  },

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId) {
    if (!userId) {
      const error = new Error('User ID is required');
      error.statusCode = 400;
      throw error;
    }

    await notificationModel.clearAll(userId);
    return { success: true, unreadCount: 0 };
  },

  /**
   * Create a system notification with duplicate prevention
   */
  async createSystemNotification({
    userId,
    title,
    message,
    type = 'system',
    linkUrl = '/my-trips?tab=upcoming',
    preventDuplicate = true,
  }) {
    if (!userId || !title || !message) return null;

    if (preventDuplicate) {
      const existing = await notificationModel.findRecentDuplicate(userId, type, title);
      if (existing) {
        return existing;
      }
    }

    return notificationModel.createNotification({
      userId,
      title,
      message,
      type,
      linkUrl,
    });
  },

  /**
   * Feature 5 & 13: Scan user bookings and generate dynamic trip reminders
   */
  async checkAndGenerateTripReminders(userId) {
    if (!userId) return;

    try {
      const bookings = await bookingModel.findByUserId(userId);
      if (!bookings || bookings.length === 0) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const booking of bookings) {
        if (booking.status === 'cancelled' || !booking.travel_date) continue;

        const travelDate = new Date(booking.travel_date);
        travelDate.setHours(0, 0, 0, 0);

        const diffTime = travelDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const destName = booking.destination_name || 'Your destination';
        const bookingRef = booking.booking_reference || booking.id;

        // 1. Trip Starts Tomorrow (1 Day)
        if (diffDays === 1) {
          const title = `📅 Trip Reminder: ${destName} Starts Tomorrow!`;
          const message = `Your upcoming trip to ${destName} (#${bookingRef}) departs tomorrow. Ensure your luggage and travel vouchers are ready!`;
          await this.createSystemNotification({
            userId,
            title,
            message,
            type: 'trip_reminder',
            linkUrl: '/my-trips?tab=upcoming',
            preventDuplicate: true,
          });
        }
        // 2. Trip Countdown (2 to 7 Days)
        else if (diffDays >= 2 && diffDays <= 7) {
          const title = `🧳 Trip Countdown: ${destName} in ${diffDays} Days`;
          const message = `Only ${diffDays} days left until your journey to ${destName}. Review your day-by-day AI schedule!`;
          await this.createSystemNotification({
            userId,
            title,
            message,
            type: 'trip_reminder',
            linkUrl: '/my-trips?tab=upcoming',
            preventDuplicate: true,
          });
        }
      }
    } catch {
      // Gracefully continue without throwing
    }
  },
};

module.exports = notificationService;
