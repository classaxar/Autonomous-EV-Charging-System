import client from './client';

/**
 * @typedef {Object} Vehicle
 * @property {string} vehicleId        - Unique vehicle identifier (e.g. "EV-001").
 * @property {string} brand            - Manufacturer name (e.g. "Tesla").
 * @property {string} model            - Model name (e.g. "Model 3").
 * @property {number} batteryCapacity  - Total usable battery capacity in kWh.
 * @property {number} currentBattery   - Current state of charge in percent (0–100).
 * @property {number} maxChargingPower - Maximum AC/DC charging power the vehicle accepts, in kW.
 */

/**
 * @typedef {Object} VehiclePayload
 * @property {string} brand            - Manufacturer name.
 * @property {string} model            - Model name.
 * @property {number} batteryCapacity  - Total battery capacity in kWh.
 * @property {number} currentBattery   - Current charge level in percent (0–100).
 * @property {number} maxChargingPower - Maximum charging power in kW.
 */

/**
 * Fetch all EVs registered to the currently authenticated user.
 *
 * @returns {Promise<Vehicle[]>} Array of registered vehicles (may be empty).
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function getVehicles() {
  const response = await client.get('/api/ev');
  return response.data.data || [];
}

/**
 * Register a new EV under the authenticated user's account.
 *
 * @param {VehiclePayload} payload - Vehicle details to register.
 * @returns {Promise<Vehicle>} The newly created vehicle object including its server-assigned `vehicleId`.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 400 validation failure).
 */
export async function createVehicle(payload) {
  const response = await client.post('/api/ev', payload);
  return response.data.data;
}

/**
 * Update an existing vehicle's details.
 *
 * @param {string} vehicleId          - ID of the vehicle to update.
 * @param {Partial<VehiclePayload>} payload - Fields to update (all fields are optional).
 * @returns {Promise<Vehicle>} The updated vehicle object.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found).
 */
export async function updateVehicle(vehicleId, payload) {
  const response = await client.put(`/api/ev/${vehicleId}`, payload);
  return response.data.data;
}

/**
 * Permanently delete a vehicle from the user's account.
 * Active bookings or sessions tied to the vehicle may prevent deletion.
 *
 * @param {string} vehicleId - ID of the vehicle to delete.
 * @returns {Promise<Vehicle>} The deleted vehicle object (for confirmation).
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found).
 */
export async function deleteVehicle(vehicleId) {
  const response = await client.delete(`/api/ev/${vehicleId}`);
  return response.data.data;
}
