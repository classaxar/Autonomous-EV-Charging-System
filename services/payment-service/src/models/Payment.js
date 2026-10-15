const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  bookingId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  energyKwh: { type: Number, required: true, min: 0 },
  pricePerKwh: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  paymentMethod: { type: String, default: 'UPI' },
  transactionRef: { type: String },
  baseAmount: { type: Number },
  cgst: { type: Number },
  sgst: { type: Number },
  gstRate: { type: String, default: '18%' },
  gstin: { type: String, default: '27AABCE1234F1Z5' },
  payerDetails: { type: String },
  paidAt: { type: Date }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Payment', paymentSchema);
