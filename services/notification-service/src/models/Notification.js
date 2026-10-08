const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'STATION_SELECTED',
      'BOOKING_CONFIRMED',
      'SESSION_STARTED',
      'TARGET_REACHED',
      'CHARGING_COMPLETED',
      'PAYMENT_SUCCESS',
      'SYSTEM_ALERT'
    ]
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
