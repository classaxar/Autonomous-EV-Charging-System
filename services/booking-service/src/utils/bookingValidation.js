const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'];

function validateBookingPayload(payload) {
  const { vehicleId, stationId, slotId, startTime, duration } = payload || {};

  if (!vehicleId || !String(vehicleId).trim()) {
    return { valid: false, message: 'vehicleId is required' };
  }

  if (!stationId || !String(stationId).trim()) {
    return { valid: false, message: 'stationId is required' };
  }

  if (!slotId || !String(slotId).trim()) {
    return { valid: false, message: 'slotId is required' };
  }

  if (!startTime || !String(startTime).trim()) {
    return { valid: false, message: 'startTime is required' };
  }

  if (Number(duration) <= 0 || Number.isNaN(Number(duration))) {
    return { valid: false, message: 'duration must be a positive number' };
  }

  return { valid: true };
}

function isValidBookingStatus(status) {
  return VALID_STATUSES.includes(status);
}

module.exports = {
  validateBookingPayload,
  isValidBookingStatus,
  VALID_STATUSES
};
