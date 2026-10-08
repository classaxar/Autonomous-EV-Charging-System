const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/envelope');
const { scoreStations } = require('../engine/score');
const mockStations = require('../mocks/stations');

const requiredFields = [
  'vehicleId',
  'currentBattery',
  'targetBattery',
  'batteryCapacity',
  'maxChargingPower',
  'location'
];

function validateRequest(body) {
  if (requiredFields.some((field) => body[field] === undefined)) {
    return 'vehicleId, battery and charging fields, and location are required';
  }
  if (!body.location || !Number.isFinite(Number(body.location.latitude))
    || !Number.isFinite(Number(body.location.longitude))) {
    return 'location.latitude and location.longitude must be numbers';
  }
  if (![body.currentBattery, body.targetBattery, body.batteryCapacity, body.maxChargingPower]
    .every((value) => Number.isFinite(Number(value)))) {
    return 'battery and charging values must be numbers';
  }
  if (Number(body.currentBattery) < 0 || Number(body.currentBattery) > 100
    || Number(body.targetBattery) < 0 || Number(body.targetBattery) > 100
    || Number(body.targetBattery) < Number(body.currentBattery)
    || Number(body.batteryCapacity) <= 0 || Number(body.maxChargingPower) <= 0) {
    return 'battery values must be 0-100, target must not be below current, and capacity/power must be positive';
  }
  return null;
}

async function getStations(req) {
  if (process.env.USE_MOCK === 'true') {
    return mockStations;
  }
  const response = await axios.get(`${process.env.STATION_SERVICE_URL}/api/stations`, {
    headers: { Authorization: req.headers.authorization },
    timeout: 5000
  });
  return response.data.data;
}

async function recommend(req, res) {
  const validationError = validateRequest(req.body);
  if (validationError) {
    return error(res, validationError, 400);
  }

  try {
    const stations = await getStations(req);
    const result = scoreStations(req.body, Array.isArray(stations) ? stations : []);
    const ranked = result.ranked.map(({ slots, ...station }) => station);
    const recommended = ranked[0] || null;
    const recommendedSource = result.ranked[0];
    const freeSlot = recommendedSource && recommendedSource.slots
      ? recommendedSource.slots.find((slot) => slot.status === 'FREE')
      : null;

    return success(res, {
      priority: result.priority,
      recommended: recommended ? { ...recommended, slotId: freeSlot ? freeSlot.slotId : null } : null,
      ranked
    });
  } catch (requestError) {
    console.error(`[Decision] station lookup failed: ${requestError.message}`);
    return error(res, 'Station service unavailable', 503);
  }
}

module.exports = {
  router: require('express').Router().post('/recommend', authenticate, recommend),
  validateRequest,
  getStations,
  recommend
};
