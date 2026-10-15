import client from './client';

/**
 * @typedef {Object} Location
 * @property {number} latitude  - Decimal latitude of the user's current position.
 * @property {number} longitude - Decimal longitude of the user's current position.
 */

/**
 * @typedef {Object} RecommendationPayload
 * @property {string}   vehicleId        - ID of the EV requesting a recommendation.
 * @property {number}   currentBattery   - Current battery level in percent (0–100).
 * @property {number}   targetBattery    - Desired target battery level in percent (0–100).
 * @property {number}   batteryCapacity  - Total battery capacity of the EV in kWh.
 * @property {number}   maxChargingPower - Maximum charging power the EV accepts in kW.
 * @property {Location} location         - Current GPS position of the user/vehicle.
 */

/**
 * @typedef {Object} RankedStation
 * @property {string} stationId        - Station identifier.
 * @property {string} name             - Station display name.
 * @property {number} score            - Composite AI score (higher = better).
 * @property {number} distanceKm       - Straight-line distance from user's location in km.
 * @property {number} queueLength      - Number of vehicles currently waiting.
 * @property {number} pricePerKwh      - Charging cost per kWh.
 * @property {number} estimatedMinutes - Estimated total time to reach target battery level, in minutes.
 * @property {string} [slotId]         - Pre-selected free slot ID (if available).
 * @property {string} [reason]         - Human-readable explanation of why this station was recommended.
 */

/**
 * @typedef {Object} RecommendationResult
 * @property {RankedStation}   recommended - The single best-match charging station.
 * @property {RankedStation[]} ranked      - Full ranked list of candidate stations (best first).
 */

/**
 * Request an AI-driven charging station recommendation.
 * The decision service scores all available stations based on distance, queue length,
 * price, charger compatibility, and estimated charging time.
 *
 * @param {RecommendationPayload} payload - Vehicle state and user location.
 * @returns {Promise<RecommendationResult>} The recommendation with a ranked list of stations.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 if no stations are available).
 */
export async function recommendChargingStation(payload) {
  const response = await client.post('/api/decision/recommend', payload);
  return response.data.data;
}
