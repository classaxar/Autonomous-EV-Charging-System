const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/envelope');
const { scoreStations } = require('../engine/score');
const { scoreCorridorStations } = require('../engine/corridorScore');
const { touristSpots, findNearbyTouristSpot } = require('../data/touristSpots');
const mockStations = require('../mocks/stations');

const requiredFields = [
  'vehicleId',
  'currentBattery',
  'targetBattery',
  'batteryCapacity',
  'maxChargingPower',
  'location'
];

function getWeights() {
  return {
    battery: Number(process.env.SCORE_WEIGHT_BATTERY || 0.30),
    distance: Number(process.env.SCORE_WEIGHT_DISTANCE || 0.20),
    queue: Number(process.env.SCORE_WEIGHT_QUEUE || 0.20),
    price: Number(process.env.SCORE_WEIGHT_PRICE || 0.15),
    speed: Number(process.env.SCORE_WEIGHT_SPEED || 0.15)
  };
}

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

function validateCorridorRequest(body) {
  if (!body.origin || !Number.isFinite(Number(body.origin.latitude)) || !Number.isFinite(Number(body.origin.longitude))) {
    return 'origin with valid latitude and longitude is required';
  }
  if (!body.destination || !Number.isFinite(Number(body.destination.latitude)) || !Number.isFinite(Number(body.destination.longitude))) {
    return 'destination with valid latitude and longitude is required';
  }
  if (body.currentBattery !== undefined) {
    const cb = Number(body.currentBattery);
    if (isNaN(cb) || cb < 0 || cb > 100) {
      return 'currentBattery must be between 0 and 100';
    }
  }
  if (body.targetBattery !== undefined) {
    const tb = Number(body.targetBattery);
    if (isNaN(tb) || tb < 0 || tb > 100) {
      return 'targetBattery must be between 0 and 100';
    }
  }
  return null;
}

async function getStations(req) {
  if (process.env.USE_MOCK === 'true') {
    return mockStations;
  }
  try {
    const response = await axios.get(`${process.env.STATION_SERVICE_URL}/api/stations`, {
      headers: { Authorization: req.headers.authorization },
      timeout: 5000
    });
    const fetched = response.data.data;
    if (Array.isArray(fetched) && fetched.length > 0) {
      const fetchedIds = new Set(fetched.map((s) => s.stationId));
      const extras = mockStations.filter((s) => !fetchedIds.has(s.stationId));
      return [...fetched, ...extras];
    }
    return mockStations;
  } catch (err) {
    // If station service has no DB records yet or is unreachable, fallback to mock stations gracefully
    console.warn(`[Decision] Falling back to mock stations: ${err.message}`);
    return mockStations;
  }
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

/**
 * Route corridor & leisure-aware charging recommendation
 */
async function corridorRecommend(req, res) {
  const validationError = validateCorridorRequest(req.body);
  if (validationError) {
    return error(res, validationError, 400);
  }

  try {
    const stations = await getStations(req);
    const result = scoreCorridorStations(req.body, Array.isArray(stations) ? stations : []);

    return success(res, result);
  } catch (requestError) {
    console.error(`[Decision] Corridor recommendation failed: ${requestError.message}`);
    return error(res, 'Unable to compute corridor recommendation', 500);
  }
}

/**
 * Returns available tourist spots, optionally filtered by proximity
 */
function getTouristSpotsList(req, res) {
  const { latitude, longitude, radiusKm } = req.query;

  if (latitude && longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const rad = Number(radiusKm || 20);
    const spot = findNearbyTouristSpot({ latitude: lat, longitude: lon }, rad);
    return success(res, spot ? [spot] : []);
  }

  return success(res, touristSpots);
}

const router = require('express').Router();
router.post('/recommend', authenticate, recommend);
router.post('/corridor-recommend', authenticate, corridorRecommend);
router.get('/tourist-spots', authenticate, getTouristSpotsList);

module.exports = {
  router,
  validateRequest,
  validateCorridorRequest,
  getStations,
  recommend,
  corridorRecommend,
  getTouristSpotsList,
  getWeights
};
