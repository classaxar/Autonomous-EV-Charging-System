const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireInternalKey } = require('../middleware/internal');
const {
  createInternalNotification,
  listOwnNotifications,
  markNotificationRead
} = require('../controllers/notificationController');

// Internal routes protected by x-internal-key
router.post('/internal/notifications', requireInternalKey, createInternalNotification);

// Public/User routes protected by Bearer JWT
router.get('/api/notifications', authenticate, listOwnNotifications);
router.patch('/api/notifications/:id/read', authenticate, markNotificationRead);

module.exports = router;
