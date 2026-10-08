const EV = require('../models/EV');
const { success, error } = require('../utils/envelope');

const fields = ['brand', 'model', 'batteryCapacity', 'currentBattery', 'maxChargingPower'];

function validateVehicle(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be an object';
  }
  if (fields.some((field) => body[field] === undefined)) {
    return 'brand, model, batteryCapacity, currentBattery, and maxChargingPower are required';
  }
  if (
    typeof body.brand !== 'string' ||
    !body.brand.trim() ||
    typeof body.model !== 'string' ||
    !body.model.trim()
  ) {
    return 'brand and model must be non-empty strings';
  }
  if (
    typeof body.batteryCapacity !== 'number' ||
    !Number.isFinite(body.batteryCapacity) ||
    body.batteryCapacity <= 0 ||
    typeof body.currentBattery !== 'number' ||
    !Number.isFinite(body.currentBattery) ||
    body.currentBattery < 0 ||
    body.currentBattery > 100 ||
    typeof body.maxChargingPower !== 'number' ||
    !Number.isFinite(body.maxChargingPower) ||
    body.maxChargingPower <= 0
  ) {
    return 'batteryCapacity and maxChargingPower must be positive numbers; currentBattery must be between 0 and 100';
  }
  return null;
}

function userFilter(req) {
  return req.user.role === 'USER' ? { userId: req.user.userId } : {};
}

function handleDatabaseError(res, err) {
  if (err.code === 11000) {
    return error(res, 'Vehicle ID already exists', 409);
  }
  console.error(`[ev-service] ${err.message}`);
  return error(res, 'Unable to complete EV request', 500);
}

async function createEV(req, res) {
  const validationError = validateVehicle(req.body);
  if (validationError) {
    return error(res, validationError, 400);
  }

  try {
    const vehicle = await EV.create({
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      batteryCapacity: req.body.batteryCapacity,
      currentBattery: req.body.currentBattery,
      maxChargingPower: req.body.maxChargingPower,
      userId: req.user.userId
    });
    return success(res, vehicle, 'EV created', 201);
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

async function listEVs(req, res) {
  try {
    const vehicles = await EV.find(userFilter(req));
    return success(res, vehicles);
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

async function getEV(req, res) {
  try {
    const vehicle = await EV.findOne({ vehicleId: req.params.id, ...userFilter(req) });
    if (!vehicle) {
      return error(res, 'EV not found', 404);
    }
    return success(res, vehicle);
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

async function updateEV(req, res) {
  const validationError = validateVehicle(req.body);
  if (validationError) {
    return error(res, validationError, 400);
  }

  try {
    const update = {
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      batteryCapacity: req.body.batteryCapacity,
      currentBattery: req.body.currentBattery,
      maxChargingPower: req.body.maxChargingPower
    };
    const vehicle = await EV.findOneAndUpdate(
      { vehicleId: req.params.id, ...userFilter(req) },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return error(res, 'EV not found', 404);
    }
    return success(res, vehicle, 'EV updated');
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

async function deleteEV(req, res) {
  try {
    const vehicle = await EV.findOneAndDelete({
      vehicleId: req.params.id,
      ...userFilter(req)
    });
    if (!vehicle) {
      return error(res, 'EV not found', 404);
    }
    return success(res, { vehicleId: vehicle.vehicleId }, 'EV deleted');
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

async function updateBattery(req, res) {
  const { currentBattery } = req.body || {};
  if (
    typeof currentBattery !== 'number' ||
    !Number.isFinite(currentBattery) ||
    currentBattery < 0 ||
    currentBattery > 100
  ) {
    return error(res, 'currentBattery must be a number between 0 and 100', 400);
  }

  try {
    const vehicle = await EV.findOneAndUpdate(
      { vehicleId: req.params.id },
      { $set: { currentBattery } },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return error(res, 'EV not found', 404);
    }
    return success(res, vehicle, 'Battery updated');
  } catch (err) {
    return handleDatabaseError(res, err);
  }
}

module.exports = {
  createEV,
  listEVs,
  getEV,
  updateEV,
  deleteEV,
  updateBattery
};
