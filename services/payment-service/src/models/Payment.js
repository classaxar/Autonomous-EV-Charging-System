const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  bookingId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  energyKwh: { type: Number, required: true, min: 0 },
  pricePerKwh: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Payment', paymentSchema);
