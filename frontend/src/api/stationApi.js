import client from './client';

/**
 * @typedef {Object} Slot
 * @property {string} slotId                       - Unique slot identifier (e.g. "SL-A1").
 * @property {string} stationId                    - Parent station ID.
 * @property {'FREE'|'OCCUPIED'|'RESERVED'} status - Current occupancy state.
 * @property {number} [powerKw]                    - Charger power rating for this slot in kW.
 */

/**
 * @typedef {Object} Station
 * @property {string}  stationId          - Unique station identifier (e.g. "ST-001").
 * @property {string}  name               - Human-readable station name.
 * @property {number}  latitude           - GPS latitude of the station.
 * @property {number}  longitude          - GPS longitude of the station.
 * @property {number}  availableChargers  - Number of currently free chargers.
 * @property {number}  totalChargers      - Total charger count at the station.
 * @property {number}  queueLength        - Vehicles currently waiting in queue.
 * @property {number}  chargerPowerKw     - Typical charger power output in kW.
 * @property {number}  pricePerKwh        - Charging cost in local currency per kWh.
 * @property {Slot[]}  [slots]            - Slot details (populated when fetched with slots).
 */

/**
 * Fetch all charging stations available in the system.
 * Stations are returned without individual slot details; use {@link getStationSlots} to load slots.
 *
 * @returns {Promise<Station[]>} Array of stations (may be empty if none are configured).
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function getStations() {
  const response = await client.get('/api/stations');
  return response.data.data || [];
}

/**
 * Fetch the real-time slot availability for a specific charging station.
 * Use this to refresh slot statuses before booking or after a 409 conflict.
 *
 * @param {string} stationId - ID of the station whose slots to retrieve.
 * @returns {Promise<Slot[]>} Array of slots with current `status` (may be empty).
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found).
 */
export async function getStationSlots(stationId) {
  const response = await client.get(`/api/stations/${stationId}/slots`);
  return response.data.data || [];
}
