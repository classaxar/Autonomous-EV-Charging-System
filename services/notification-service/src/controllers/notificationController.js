const Notification = require('../models/Notification');
const { success, error } = require('../utils/envelope');

// POST /internal/notifications
async function createInternalNotification(req, res) {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return error(res, 'Validation error: userId, type, and message are required', 400);
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const notification = await Notification.create({
      notificationId,
      userId,
      type,
      message,
      read: false
    });

    return success(res, notification, 'Notification created successfully', 201);
  } catch (err) {
    console.error('[NotificationController] Create error:', err.message);
    return error(res, err.message || 'Failed to create notification', 500);
  }
}

// GET /api/notifications
async function listOwnNotifications(req, res) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return error(res, 'User identity not found in token', 401);
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, notifications, 'Notifications retrieved successfully');
  } catch (err) {
    console.error('[NotificationController] List error:', err.message);
    return error(res, err.message || 'Failed to retrieve notifications', 500);
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user && req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { notificationId: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return error(res, 'Notification not found or unauthorized', 404);
    }

    return success(res, notification, 'Notification marked as read');
  } catch (err) {
    console.error('[NotificationController] Mark read error:', err.message);
    return error(res, err.message || 'Failed to mark notification as read', 500);
  }
}

module.exports = {
  createInternalNotification,
  listOwnNotifications,
  markNotificationRead
};
