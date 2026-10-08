const axios = require('axios');
const Booking = require('../models/Booking');
const { success, error } = require('../utils/envelope');
const { generateBookingId } = require('../utils/idGenerator');
const { validateBookingPayload, isValidBookingStatus } = require('../utils/bookingValidation');
const mockStationClient = require('../mocks/stationClient');

function getStationServiceUrl() {
  return process.env.STATION_SERVICE_URL || 'http://station-service:5003';
}

function getNotificationServiceUrl() {
  return process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5008';
}

function buildInternalHeaders() {
  return {
    'x-internal-key': process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system'
  };
}

async function requestWithRetry(config) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await axios({ ...config, timeout: 5000 });
    } catch (requestError) {
      lastError = requestError;
      if (requestError.response && requestError.response.status < 500) {
        throw requestError;
      }
    }
  }

  throw lastError;
}

async function getSlot(stationId, slotId, authorization) {
  if (process.env.USE_MOCK === 'true') {
    return mockStationClient.getSlot(stationId, slotId);
  }

  const response = await requestWithRetry({
    method: 'get',
    url: `${getStationServiceUrl()}/api/stations/${stationId}/slots`,
    headers: { Authorization: authorization }
  });
  return (response.data?.data || []).find((item) => item.slotId === slotId);
}

async function updateSlot(stationId, slotId, status) {
  if (process.env.USE_MOCK === 'true') {
    return mockStationClient.updateSlot(stationId, slotId, status);
  }

  return requestWithRetry({
    method: 'patch',
    url: `${getStationServiceUrl()}/internal/stations/${stationId}/slots/${slotId}`,
    data: { status },
    headers: buildInternalHeaders()
  });
}

async function updateQueue(stationId, delta) {
  if (process.env.USE_MOCK === 'true') {
    return mockStationClient.updateQueue(stationId, delta);
  }

  return requestWithRetry({
    method: 'patch',
    url: `${getStationServiceUrl()}/internal/stations/${stationId}/queue`,
    data: { delta },
    headers: buildInternalHeaders()
  });
}

async function notifyUser(userId, message) {
  try {
    await requestWithRetry({
      method: 'post',
      url: `${getNotificationServiceUrl()}/internal/notifications`,
      data: {
        userId,
        type: 'BOOKING_CONFIRMED',
        message
      },
      headers: buildInternalHeaders()
    });
  } catch (notificationError) {
    console.warn('[Booking] notification failed:', notificationError.message);
  }
}

async function listBookings(req, res) {
  const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  return success(res, bookings, 'Bookings fetched');
}

async function createBooking(req, res) {
  const payload = { ...req.body };
  const validation = validateBookingPayload(payload);
  if (!validation.valid) {
    return error(res, validation.message, 400);
  }

  try {
    const slot = await getSlot(payload.stationId, payload.slotId, req.headers.authorization);
    if (!slot || slot.status !== 'FREE') {
      return error(res, 'Selected slot is not available', 409);
    }

    await updateSlot(payload.stationId, payload.slotId, 'BOOKED');
    let booking;
    try {
      booking = await Booking.create({
        bookingId: generateBookingId(),
        userId: req.user.userId,
        vehicleId: payload.vehicleId,
        stationId: payload.stationId,
        slotId: payload.slotId,
        startTime: payload.startTime,
        duration: Number(payload.duration),
        status: 'CONFIRMED'
      });
    } catch (creationError) {
      await updateSlot(payload.stationId, payload.slotId, 'FREE');
      throw creationError;
    }

    await updateQueue(payload.stationId, 1);

    await notifyUser(req.user.userId, `Booking ${booking.bookingId} confirmed at ${payload.stationId}.`);

    return success(res, booking, 'Booking created', 201);
  } catch (errorResponse) {
    if (errorResponse.response?.status === 409) {
      return error(res, 'Selected slot is not available', 409);
    }
    console.error('[Booking] createBooking error:', errorResponse.message);
    return error(res, 'Could not create booking', 500);
  }
}

async function getBooking(req, res) {
  const booking = await Booking.findOne({ bookingId: req.params.id, userId: req.user.userId });
  if (!booking) {
    return error(res, 'Booking not found', 404);
  }
  return success(res, booking, 'Booking fetched');
}

async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ bookingId: req.params.id, userId: req.user.userId });
  if (!booking) {
    return error(res, 'Booking not found', 404);
  }

  if (booking.status === 'CANCELLED') {
    return error(res, 'Booking already cancelled', 409);
  }

  booking.status = 'CANCELLED';
  await booking.save();

  try {
    await updateSlot(booking.stationId, booking.slotId, 'FREE');
    await updateQueue(booking.stationId, -1);
  } catch (innerError) {
    console.warn('[Booking] cancel booking internal update failed:', innerError.message);
  }

  return success(res, booking, 'Booking cancelled');
}

async function updateBookingStatusInternal(req, res) {
  const { status } = req.body || {};
  if (!status || !isValidBookingStatus(status)) {
    return error(res, 'status is invalid', 400);
  }

  const booking = await Booking.findOne({ bookingId: req.params.id });
  if (!booking) {
    return error(res, 'Booking not found', 404);
  }

  booking.status = status;
  await booking.save();
  return success(res, booking, 'Booking status updated');
}

async function getBookingInternal(req, res) {
  const booking = await Booking.findOne({ bookingId: req.params.id });
  if (!booking) {
    return error(res, 'Booking not found', 404);
  }
  return success(res, booking, 'Booking fetched');
}

module.exports = {
  listBookings,
  createBooking,
  getBooking,
  cancelBooking,
  updateBookingStatusInternal,
  getBookingInternal
};
