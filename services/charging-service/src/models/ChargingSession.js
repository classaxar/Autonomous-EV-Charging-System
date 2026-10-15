const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  bookingId: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true },
  stationId: { type: String, required: true },
  slotId: { type: String, required: true },
  batteryCapacity: { type: Number, default: 0 },
  startBattery: Number,
  targetBattery: Number,
  currentBattery: Number,
  energyConsumed: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  pricePerKwh: { type: Number, default: 0 },
  status: { type: String, enum: ['STARTED', 'CHARGING', 'COMPLETED', 'STOPPED'], default: 'STARTED' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
}, { timestamps: true });
module.exports = mongoose.model('ChargingSession', sessionSchema);
