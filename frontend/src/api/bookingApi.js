import client from './client';

/**
 * @typedef {Object} Booking
 * @property {string} bookingId      - Unique identifier for the booking (e.g. "BK-001").
 * @property {string} vehicleId      - ID of the EV being charged.
 * @property {string} stationId      - ID of the charging station.
 * @property {string} slotId         - ID of the reserved slot within the station.
 * @property {string} startTime      - ISO 8601 timestamp for the requested start time.
 * @property {number} duration       - Requested session duration in minutes.
 * @property {'PENDING'|'CONFIRMED'|'CANCELLED'|'COMPLETED'} status - Current booking state.
 */

/**
 * @typedef {Object} CreateBookingPayload
 * @property {string} vehicleId  - EV to charge.
 * @property {string} stationId  - Target charging station.
 * @property {string} slotId     - Specific slot within the station.
 * @property {string} startTime  - ISO 8601 timestamp (usually `new Date().toISOString()`).
 * @property {number} duration   - Session length in minutes (1–1440).
 */

/**
 * Create a new charging slot booking.
 *
 * @param {CreateBookingPayload} payload - Booking details.
 * @returns {Promise<Booking>} The newly created booking object.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 409 Conflict if slot is taken).
 */
export async function createBooking(payload) {
  const response = await client.post('/api/bookings', payload);
  return response.data.data;
}

/**
 * Fetch all bookings for the currently authenticated user.
 *
 * @returns {Promise<Booking[]>} Array of bookings (may be empty).
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function getBookings() {
  const response = await client.get('/api/bookings');
  return response.data.data || [];
}

/**
 * Cancel an existing booking by ID.
 * Only bookings with status `PENDING` or `CONFIRMED` can be cancelled.
 *
 * @param {string} bookingId - ID of the booking to cancel.
 * @returns {Promise<Booking>} The updated booking with status `CANCELLED`.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found).
 */
export async function cancelBooking(bookingId) {
  const response = await client.patch(`/api/bookings/${bookingId}/cancel`);
  return response.data.data;
}
