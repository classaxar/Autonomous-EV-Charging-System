const Station = require('../models/Station');
const { success, error } = require('../utils/envelope');
const { generateStationId } = require('../utils/idGenerator');
const { buildSlots, validateStationInput, calculateAvailableChargers } = require('../utils/stationValidation');

async function listStations(req, res) {
  const stations = await Station.find({}).sort({ stationId: 1 });
  const formatted = stations.map((station) => ({
    ...station.toObject(),
    availableChargers: station.availableChargers ?? calculateAvailableChargers(station.slots || [])
  }));
  return success(res, formatted, 'Stations fetched');
}

async function createStation(req, res) {
  const payload = { ...req.body };
  const validation = validateStationInput(payload);
  if (!validation.valid) {
    return error(res, validation.message, 400);
  }

  const totalChargers = Number(payload.totalChargers);
  const station = await Station.create({
    ...payload,
    stationId: payload.stationId || generateStationId(),
    location: {
      latitude: Number(payload.location.latitude),
      longitude: Number(payload.location.longitude)
    },
    chargerPowerKw: Number(payload.chargerPowerKw),
    pricePerKwh: Number(payload.pricePerKwh),
    totalChargers,
    availableChargers: totalChargers,
    queueLength: 0,
    slots: payload.slots && payload.slots.length ? payload.slots : buildSlots(totalChargers)
  });

  return success(res, station, 'Station created', 201);
}

async function getStation(req, res) {
  const station = await Station.findOne({ stationId: req.params.id });
  if (!station) {
    return error(res, 'Station not found', 404);
  }
  return success(res, station, 'Station fetched');
}

async function updateStation(req, res) {
  const existing = await Station.findOne({ stationId: req.params.id });
  if (!existing) {
    return error(res, 'Station not found', 404);
  }

  const body = { ...req.body };
  if (body.location) {
    body.location = {
      latitude: Number(body.location.latitude),
      longitude: Number(body.location.longitude)
    };
  }

  const validation = validateStationInput({
    ...existing.toObject(),
    ...body,
    totalChargers: body.totalChargers ?? existing.totalChargers,
    chargerPowerKw: body.chargerPowerKw ?? existing.chargerPowerKw,
    pricePerKwh: body.pricePerKwh ?? existing.pricePerKwh,
    location: body.location ?? existing.location
  });

  if (!validation.valid) {
    return error(res, validation.message, 400);
  }

  const updated = await Station.findOneAndUpdate(
    { stationId: req.params.id },
    {
      ...body,
      totalChargers: Number(body.totalChargers ?? existing.totalChargers),
      chargerPowerKw: Number(body.chargerPowerKw ?? existing.chargerPowerKw),
      pricePerKwh: Number(body.pricePerKwh ?? existing.pricePerKwh),
      location: body.location ?? existing.location,
      queueLength: Number(body.queueLength ?? existing.queueLength ?? 0)
    },
    { new: true }
  );

  if (updated.slots && updated.slots.length) {
    updated.availableChargers = calculateAvailableChargers(updated.slots);
    await updated.save();
  }

  return success(res, updated, 'Station updated');
}

async function deleteStation(req, res) {
  const station = await Station.findOneAndDelete({ stationId: req.params.id });
  if (!station) {
    return error(res, 'Station not found', 404);
  }
  return success(res, null, 'Station deleted');
}

async function getStationSlots(req, res) {
  const station = await Station.findOne({ stationId: req.params.id });
  if (!station) {
    return error(res, 'Station not found', 404);
  }
  return success(res, station.slots || [], 'Station slots fetched');
}

async function updateSlotStatus(req, res) {
  const { id, slotId } = req.params;
  const { status } = req.body || {};

  if (!status || !['FREE', 'BOOKED', 'CHARGING', 'OFFLINE'].includes(status)) {
    return error(res, 'status must be one of FREE, BOOKED, CHARGING, OFFLINE', 400);
  }

  const station = await Station.findOne({ stationId: id });
  if (!station) {
    return error(res, 'Station not found', 404);
  }

  const slot = (station.slots || []).find((entry) => entry.slotId === slotId);
  if (!slot) {
    return error(res, 'Slot not found', 404);
  }

  slot.status = status;
  station.availableChargers = calculateAvailableChargers(station.slots || []);
  await station.save();

  return success(res, {
    stationId: station.stationId,
    slotId,
    status,
    availableChargers: station.availableChargers
  }, 'Slot status updated');
}

async function updateQueue(req, res) {
  const { id } = req.params;
  const delta = Number(req.body.delta || 0);

  const station = await Station.findOne({ stationId: id });
  if (!station) {
    return error(res, 'Station not found', 404);
  }

  const nextQueue = Math.max(0, (station.queueLength || 0) + delta);
  station.queueLength = nextQueue;
  await station.save();

  return success(res, { stationId: station.stationId, queueLength: station.queueLength }, 'Queue updated');
}

module.exports = {
  listStations,
  createStation,
  getStation,
  updateStation,
  deleteStation,
  getStationSlots,
  updateSlotStatus,
  updateQueue
};
