const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// 1. Get notifications for user (GET /api/notifications)
router.get('/', notificationController.getNotifications);

// 2. Get unread count (GET /api/notifications/unread-count)
router.get('/unread-count', notificationController.getUnreadCount);

// 3. Mark all notifications as read (PATCH /api/notifications/read-all)
router.patch('/read-all', notificationController.markAllAsRead);

// 4. Mark single notification as read (PATCH /api/notifications/:id/read)
router.patch('/:id/read', notificationController.markAsRead);

// 5. Clear all notifications (DELETE /api/notifications/clear-all)
router.delete('/clear-all', notificationController.clearAll);

// 6. Delete single notification (DELETE /api/notifications/:id)
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
