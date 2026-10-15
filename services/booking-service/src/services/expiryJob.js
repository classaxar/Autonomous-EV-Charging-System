const axios = require('axios');
const Booking = require('../models/Booking');

function internalHeaders() {
  return {
    'x-internal-key': process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system'
  };
}

async function requestWithRetry(config) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await axios({ ...config, timeout: 5000 });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function releaseResources(booking) {
  const stationUrl = process.env.STATION_SERVICE_URL || 'http://station-service:5003';
  await requestWithRetry({
    method: 'patch',
    url: `${stationUrl}/internal/stations/${booking.stationId}/slots/${booking.slotId}`,
    data: { status: 'FREE' },
    headers: internalHeaders()
  });
  await requestWithRetry({
    method: 'patch',
    url: `${stationUrl}/internal/stations/${booking.stationId}/queue`,
    data: { delta: -1 },
    headers: internalHeaders()
  });
}

async function expireBookings(now = new Date()) {
  const expiryMinutes = Number(process.env.EXPIRY_MINUTES || 15);
  const cutoff = new Date(now.getTime() - expiryMinutes * 60 * 1000);
  const candidates = await Booking.find({
    status: 'CONFIRMED',
    startTime: { $lte: cutoff.toISOString() }
  });
  let expired = 0;

  for (const candidate of candidates) {
    const booking = await Booking.findOneAndUpdate(
      { bookingId: candidate.bookingId, status: 'CONFIRMED' },
      { $set: { status: 'EXPIRED' } },
      { new: true }
    );
    if (!booking) {
      continue;
    }

    try {
      await releaseResources(booking);
      expired += 1;
    } catch (error) {
      console.error(`[Booking] failed to release expired booking ${booking.bookingId}: ${error.message}`);
    }
  }

  return expired;
}

function startExpiryJob() {
  const intervalMinutes = Number(process.env.EXPIRY_CHECK_MINUTES || 1);
  const interval = setInterval(() => {
    expireBookings().catch((error) => {
      console.error(`[Booking] expiry job failed: ${error.message}`);
    });
  }, Math.max(intervalMinutes, 0.1) * 60 * 1000);
  interval.unref();
  return interval;
}

module.exports = {
  expireBookings,
  startExpiryJob
};
