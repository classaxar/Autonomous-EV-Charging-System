const axios = require('axios');
const ChargingSession = require('../models/ChargingSession');
const { success, error } = require('../utils/envelope');
const { generateSessionId } = require('../utils/idGenerator');

function internalHeaders() {
  return { 'x-internal-key': process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system' };
}
async function request(config) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { return await axios({ ...config, timeout: 5000 }); } catch (requestError) { lastError = requestError; }
  }
  throw lastError;
}
async function notify(userId, type, message) {
  try {
    await request({ method: 'post', url: `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008'}/internal/notifications`, data: { userId, type, message }, headers: internalHeaders() });
  } catch (notifyError) { console.warn(`[Charging] notification failed: ${notifyError.message}`); }
}
function progress(session) {
  const speedup = Number(process.env.SIM_SPEEDUP || 60);
  const elapsedMinutes = Math.max(0, (Date.now() - new Date(session.startedAt).getTime()) / 60000);
  const rate = Math.max(0, Number(session.targetBattery) - Number(session.startBattery)) / Math.max(1, Number(session.duration || 1));
  const currentBattery = Math.min(Number(session.targetBattery), Number(session.startBattery) + elapsedMinutes * speedup * rate);
  const energy = Math.max(0, (currentBattery - session.startBattery) / 100 * (Number(session.batteryCapacity) || 0));
  return { currentBattery, energy, elapsedMinutes };
}
async function complete(session, status = 'COMPLETED') {
  const result = progress(session);
  session.currentBattery = status === 'STOPPED' ? result.currentBattery : session.targetBattery;
  session.energyConsumed = Number(result.energy.toFixed(2));
  session.duration = Number(result.elapsedMinutes.toFixed(2));
  session.status = status;
  session.completedAt = new Date();
  await session.save();
  const bookingUrl = process.env.BOOKING_SERVICE_URL || 'http://booking-service:5004';
  const stationUrl = process.env.STATION_SERVICE_URL || 'http://station-service:5003';
  const evUrl = process.env.EV_SERVICE_URL || 'http://ev-service:5002';
  const sideEffects = [
    request({ method: 'patch', url: `${bookingUrl}/internal/bookings/${session.bookingId}/status`, data: { status: 'COMPLETED' }, headers: internalHeaders() }),
    request({ method: 'patch', url: `${stationUrl}/internal/stations/${session.stationId}/slots/${session.slotId}`, data: { status: 'FREE' }, headers: internalHeaders() }),
    request({ method: 'patch', url: `${stationUrl}/internal/stations/${session.stationId}/queue`, data: { delta: -1 }, headers: internalHeaders() }),
    request({ method: 'patch', url: `${evUrl}/internal/ev/${session.vehicleId}/battery`, data: { currentBattery: session.currentBattery }, headers: internalHeaders() }),
    request({ method: 'post', url: `${process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5007'}/internal/payments`, data: { userId: session.userId, bookingId: session.bookingId, sessionId: session.sessionId, energyKwh: session.energyConsumed, pricePerKwh: session.pricePerKwh }, headers: internalHeaders() })
  ];
  const results = await Promise.allSettled(sideEffects);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`[Charging] completion side effect ${index + 1} failed after retry: ${result.reason.message}`);
    }
  });
  await notify(session.userId, status === 'COMPLETED' ? 'CHARGING_COMPLETED' : 'TARGET_REACHED', `Charging session ${session.sessionId} ${status.toLowerCase()}.`);
  return session;
}
async function start(req, res) {
  const bookingId = req.body?.bookingId;
  if (!bookingId) return error(res, 'bookingId is required', 400);
  try {
    const bookingResponse = await request({ method: 'get', url: `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:5004'}/internal/bookings/${bookingId}`, headers: internalHeaders() });
    const booking = bookingResponse.data.data;
    if (!booking || booking.status !== 'CONFIRMED') return error(res, 'Booking must be CONFIRMED', 409);
    const existing = await ChargingSession.findOne({ bookingId });
    if (existing) return success(res, existing, 'Charging session already exists');
    const session = await ChargingSession.create({ sessionId: generateSessionId(), userId: booking.userId, bookingId, vehicleId: booking.vehicleId, stationId: booking.stationId, slotId: booking.slotId, startBattery: Number(req.body.startBattery || 0), targetBattery: Number(req.body.targetBattery || 80), currentBattery: Number(req.body.startBattery || 0), batteryCapacity: Number(req.body.batteryCapacity || 0), pricePerKwh: Number(req.body.pricePerKwh || 0), status: 'CHARGING' });
    await request({ method: 'patch', url: `${process.env.BOOKING_SERVICE_URL || 'http://booking-service:5004'}/internal/bookings/${bookingId}/status`, data: { status: 'ACTIVE' }, headers: internalHeaders() });
    await request({ method: 'patch', url: `${process.env.STATION_SERVICE_URL || 'http://station-service:5003'}/internal/stations/${booking.stationId}/slots/${booking.slotId}`, data: { status: 'CHARGING' }, headers: internalHeaders() });
    await notify(session.userId, 'SESSION_STARTED', `Charging session ${session.sessionId} started.`);
    return success(res, session, 'Charging started', 201);
  } catch (requestError) { return error(res, 'Unable to start charging', requestError.response?.status === 503 ? 503 : 500); }
}
async function getSession(req, res) {
  const session = await ChargingSession.findOne({ sessionId: req.params.sessionId, userId: req.user.userId });
  if (!session) return error(res, 'Charging session not found', 404);
  if (['CHARGING', 'STARTED'].includes(session.status)) {
    const result = progress(session);
    session.currentBattery = result.currentBattery;
    session.energyConsumed = Number(result.energy.toFixed(2));
    if (session.currentBattery >= session.targetBattery) await complete(session);
  }
  return success(res, session, 'Charging session fetched');
}
async function stop(req, res) {
  const session = await ChargingSession.findOne({ sessionId: req.params.sessionId, userId: req.user.userId });
  if (!session) return error(res, 'Charging session not found', 404);
  if (['COMPLETED', 'STOPPED'].includes(session.status)) return success(res, session, 'Charging session already stopped');
  return success(res, await complete(session, 'STOPPED'), 'Charging stopped');
}
async function history(req, res) { return success(res, await ChargingSession.find({ userId: req.user.userId }).sort({ createdAt: -1 }), 'Charging history fetched'); }
async function all(req, res) { return success(res, await ChargingSession.find({}).sort({ createdAt: -1 }), 'Charging sessions fetched'); }
module.exports = { start, getSession, stop, history, all, progress };
