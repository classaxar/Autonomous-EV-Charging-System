const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const evSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      unique: true,
      default: () => `EV${randomBytes(5).toString('hex').toUpperCase()}`
    },
    userId: { type: String, required: true, index: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    batteryCapacity: { type: Number, required: true, min: 0.1 },
    currentBattery: { type: Number, required: true, min: 0, max: 100 },
    maxChargingPower: { type: Number, required: true, min: 0.1 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.EV || mongoose.model('EV', evSchema);
