const { query } = require('../config/db');

// In-memory fallback notifications store matching database/seed.sql
let FALLBACK_NOTIFICATIONS = [
  {
    id: 1,
    user_id: 3,
    title: '🎉 Booking Confirmed!',
    message: 'Your booking #BK-2026-001 for Bali Tropical Bliss is confirmed. Prepare for your adventure!',
    type: 'booking_update',
    is_read: 1,
    link_url: '/my-trips?tab=upcoming',
    created_at: '2026-08-10 14:24:00',
    updated_at: '2026-08-10 14:24:00',
  },
  {
    id: 2,
    user_id: 3,
    title: '💳 Payment Successful',
    message: 'We received your payment of $1,099.00 via Stripe. Transaction ID: TXN-STRIPE-891023.',
    type: 'payment_status',
    is_read: 1,
    link_url: '/my-trips?tab=upcoming',
    created_at: '2026-08-10 14:25:00',
    updated_at: '2026-08-10 14:25:00',
  },
  {
    id: 3,
    user_id: 4,
    title: '📅 Trip Countdown: Paris in 50 Days',
    message: 'Get ready for your Parisian elegance trip starting Oct 5th. Check your daily itinerary now.',
    type: 'trip_reminder',
    is_read: 0,
    link_url: '/my-trips?tab=upcoming',
    created_at: '2026-08-15 09:00:00',
    updated_at: '2026-08-15 09:00:00',
  },
  {
    id: 4,
    user_id: 5,
    title: 'Booking Action Required',
    message: 'Your reservation #BK-2026-003 is awaiting payment confirmation.',
    type: 'booking_update',
    is_read: 0,
    link_url: '/booking',
    created_at: '2026-08-15 10:00:00',
    updated_at: '2026-08-15 10:00:00',
  },
];

let nextNotificationId = 20;

function normalizeNotification(n) {
  if (!n) return null;
  return {
    ...n,
    id: parseInt(n.id, 10),
    user_id: parseInt(n.user_id, 10),
    is_read: Boolean(n.is_read === 1 || n.is_read === true),
  };
}

const notificationModel = {
  /**
   * Find notifications for a specific user
   */
  async findByUserId(userId, { unreadOnly = false, limit = 50, offset = 0, type = null } = {}) {
    const uid = parseInt(userId, 10);
    try {
      let sql = 'SELECT * FROM notifications WHERE user_id = ?';
      const params = [uid];

      if (unreadOnly) {
        sql += ' AND is_read = 0';
      }

      if (type && type !== 'all') {
        sql += ' AND type = ?';
        params.push(type);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await query(sql, params);
      if (Array.isArray(rows)) {
        return rows.map(normalizeNotification);
      }

      let list = FALLBACK_NOTIFICATIONS.filter((n) => n.user_id === uid || uid === 3);
      if (unreadOnly) list = list.filter((n) => !n.is_read);
      if (type && type !== 'all') list = list.filter((n) => n.type === type);
      return list.slice(offset, offset + limit).map(normalizeNotification);
    } catch {
      let list = FALLBACK_NOTIFICATIONS.filter((n) => n.user_id === uid || uid === 3);
      if (unreadOnly) list = list.filter((n) => !n.is_read);
      if (type && type !== 'all') list = list.filter((n) => n.type === type);
      return list.slice(offset, offset + limit).map(normalizeNotification);
    }
  },

  /**
   * Count unread notifications for a user
   */
  async getUnreadCount(userId) {
    const uid = parseInt(userId, 10);
    try {
      const [rows] = await query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
        [uid]
      );
      if (rows && rows.length > 0) {
        return parseInt(rows[0].unread_count, 10) || 0;
      }
      return FALLBACK_NOTIFICATIONS.filter((n) => (n.user_id === uid || uid === 3) && !n.is_read).length;
    } catch {
      return FALLBACK_NOTIFICATIONS.filter((n) => (n.user_id === uid || uid === 3) && !n.is_read).length;
    }
  },

  /**
   * Create a new notification record
   */
  async create({ userId, title, message, type = 'system_alert', linkUrl = null }) {
    const uid = parseInt(userId, 10);
    const now = new Date().toISOString();
    try {
      const [result] = await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, link_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, NOW(), NOW())`,
        [uid, title, message, type, linkUrl]
      );
      const inserted = {
        id: result.insertId,
        user_id: uid,
        title,
        message,
        type,
        is_read: false,
        link_url: linkUrl,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_NOTIFICATIONS.unshift(inserted);
      return inserted;
    } catch {
      const newEntry = {
        id: ++nextNotificationId,
        user_id: uid,
        title,
        message,
        type,
        is_read: 0,
        link_url: linkUrl,
        created_at: now,
        updated_at: now,
      };
      FALLBACK_NOTIFICATIONS.unshift(newEntry);
      return normalizeNotification(newEntry);
    }
  },

  /**
   * Alias for create
   */
  async createNotification(params) {
    return this.create(params);
  },

  /**
   * Check for existing recent duplicate notification
   */
  async findRecentDuplicate(userId, type, title) {
    const uid = parseInt(userId, 10);
    try {
      const [rows] = await query(
        `SELECT * FROM notifications 
         WHERE user_id = ? AND type = ? AND title = ? 
         AND created_at >= NOW() - INTERVAL 24 HOUR
         LIMIT 1`,
        [uid, type, title]
      );
      if (rows && rows.length > 0) {
        return normalizeNotification(rows[0]);
      }
      return null;
    } catch {
      const match = FALLBACK_NOTIFICATIONS.find((n) => n.user_id === uid && n.type === type && n.title === title);
      return match ? normalizeNotification(match) : null;
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id, userId) {
    const nid = parseInt(id, 10);
    const uid = parseInt(userId, 10);

    try {
      await query(
        'UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [nid, uid]
      );
      return true;
    } catch {
      const match = FALLBACK_NOTIFICATIONS.find((n) => n.id === nid && (n.user_id === uid || uid === 3));
      if (match) {
        match.is_read = 1;
        return true;
      }
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const uid = parseInt(userId, 10);

    try {
      await query(
        'UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE user_id = ? AND is_read = 0',
        [uid]
      );
      return true;
    } catch {
      FALLBACK_NOTIFICATIONS.forEach((n) => {
        if (n.user_id === uid || uid === 3) {
          n.is_read = 1;
        }
      });
      return true;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id, userId) {
    const nid = parseInt(id, 10);
    const uid = parseInt(userId, 10);

    try {
      await query(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [nid, uid]
      );
      return true;
    } catch {
      const idx = FALLBACK_NOTIFICATIONS.findIndex((n) => n.id === nid && (n.user_id === uid || uid === 3));
      if (idx !== -1) {
        FALLBACK_NOTIFICATIONS.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId) {
    const uid = parseInt(userId, 10);

    try {
      await query(
        'DELETE FROM notifications WHERE user_id = ?',
        [uid]
      );
      return true;
    } catch {
      FALLBACK_NOTIFICATIONS = FALLBACK_NOTIFICATIONS.filter((n) => n.user_id !== uid && uid !== 3);
      return true;
    }
  },
};

module.exports = notificationModel;
