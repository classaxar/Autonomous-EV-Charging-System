const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    slotId: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['FREE', 'BOOKED', 'CHARGING', 'OFFLINE'],
      default: 'FREE'
    }
  },
  { _id: false }
);

const stationSchema = new mongoose.Schema(
  {
    stationId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    chargerPowerKw: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerKwh: {
      type: Number,
      required: true,
      min: 0
    },
    totalChargers: {
      type: Number,
      required: true,
      min: 1
    },
    availableChargers: {
      type: Number,
      default: 0
    },
    queueLength: {
      type: Number,
      default: 0,
      min: 0
    },
    slots: {
      type: [slotSchema],
      default: []
    }
  },
  { timestamps: true }
);

stationSchema.pre('save', function preSave(next) {
  if (!this.slots || !this.slots.length) {
    this.availableChargers = 0;
    return next();
  }

  this.availableChargers = this.slots.filter((slot) => slot.status === 'FREE').length;
  next();
});

module.exports = mongoose.model('Station', stationSchema);
