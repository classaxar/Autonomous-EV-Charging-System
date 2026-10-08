function buildSlots(totalChargers = 0) {
  const count = Number(totalChargers);
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => ({
    slotId: `S${String(index + 1).padStart(2, '0')}`,
    status: 'FREE'
  }));
}

function calculateAvailableChargers(slots = []) {
  return slots.filter((slot) => slot.status === 'FREE').length;
}

function validateStationInput(payload) {
  const { name, chargerPowerKw, pricePerKwh, totalChargers, location } = payload || {};

  if (!name || !String(name).trim()) {
    return { valid: false, message: 'Name is required' };
  }

  if (Number(chargerPowerKw) <= 0 || Number.isNaN(Number(chargerPowerKw))) {
    return { valid: false, message: 'chargerPowerKw must be a positive number' };
  }

  if (Number(pricePerKwh) < 0 || Number.isNaN(Number(pricePerKwh))) {
    return { valid: false, message: 'pricePerKwh must be a non-negative number' };
  }

  if (Number(totalChargers) <= 0 || Number.isNaN(Number(totalChargers))) {
    return { valid: false, message: 'totalChargers must be a positive number' };
  }

  if (!location || Number.isNaN(Number(location.latitude)) || Number.isNaN(Number(location.longitude))) {
    return { valid: false, message: 'location.latitude and location.longitude are required' };
  }

  return { valid: true };
}

module.exports = {
  buildSlots,
  calculateAvailableChargers,
  validateStationInput
};
