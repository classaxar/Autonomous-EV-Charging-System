import client from './client';

/**
 * @typedef {Object} ChargingSession
 * @property {string} sessionId       - Unique session identifier (e.g. "SES-001").
 * @property {string} bookingId       - Associated booking ID.
 * @property {string} stationId       - Station where charging takes place.
 * @property {string} slotId          - Slot used for this session.
 * @property {number} startBattery    - Battery level (%) at the start of the session.
 * @property {number} currentBattery  - Real-time battery level (%) during charging.
 * @property {number} targetBattery   - Desired target battery level (%).
 * @property {number} energyConsumed  - Total energy delivered so far in kWh.
 * @property {number} duration        - Elapsed charging time in minutes.
 * @property {'ACTIVE'|'COMPLETED'|'STOPPED'} status - Current session state.
 * @property {string} [createdAt]     - ISO 8601 timestamp when the session started.
 */

/**
 * @typedef {Object} StartChargingPayload
 * @property {string} bookingId     - Booking that authorises this session.
 * @property {string} vehicleId     - EV to charge.
 * @property {string} stationId     - Charging station ID.
 * @property {string} slotId        - Slot to use.
 * @property {number} targetBattery - Desired target battery level (0–100 %).
 */

/**
 * Start a new charging session.
 *
 * @param {StartChargingPayload} payload - Session parameters.
 * @returns {Promise<ChargingSession>} The newly created charging session.
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function startCharging(payload) {
  return (await client.post('/api/charging/start', payload)).data.data;
}

/**
 * Fetch the current state of a charging session by its ID.
 * Use this to poll live battery progress.
 *
 * @param {string} sessionId - Charging session ID to look up.
 * @returns {Promise<ChargingSession>} The live session snapshot.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found).
 */
export async function getChargingSession(sessionId) {
  return (await client.get(`/api/charging/${sessionId}`)).data.data;
}

/**
 * Stop an active charging session early.
 * Triggers payment record creation for the consumed energy.
 *
 * @param {string} sessionId - ID of the session to stop.
 * @returns {Promise<ChargingSession>} The updated session with status `STOPPED`.
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function stopCharging(sessionId) {
  return (await client.post(`/api/charging/${sessionId}/stop`)).data.data;
}

/**
 * Fetch the full charging history for the currently authenticated user.
 *
 * @returns {Promise<ChargingSession[]>} Array of past and current sessions (may be empty).
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function getChargingHistory() {
  return (await client.get('/api/charging/history')).data.data || [];
}
