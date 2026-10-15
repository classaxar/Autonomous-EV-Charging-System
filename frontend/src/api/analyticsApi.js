import client from './client';

/**
 * @typedef {Object} AnalyticsSummary
 * @property {number} totalSessions        - Total number of charging sessions across all stations.
 * @property {number} totalEnergyKwh       - Total energy dispensed network-wide in kWh.
 * @property {number} totalRevenue         - Total revenue collected in local currency.
 * @property {number} avgChargingMinutes   - Average session duration in minutes.
 * @property {number} activeSessions       - Number of sessions currently in progress.
 */

/**
 * @typedef {Object} DailyAnalytics
 * @property {string} date       - Day label (e.g. "Mon", "2024-01-15").
 * @property {number} sessions   - Number of sessions on this day.
 * @property {number} energyKwh  - Total energy delivered on this day in kWh.
 * @property {number} revenue    - Total revenue on this day in local currency.
 */

/**
 * Fetch the network-wide analytics summary for the admin dashboard.
 * Returns aggregate metrics across all charging stations.
 * Falls back to `null` if the analytics service is unavailable.
 *
 * @returns {Promise<AnalyticsSummary|null>} Summary object, or `null` on failure.
 * @throws {import('axios').AxiosError} Only on unexpected non-network errors.
 */
export async function getAnalyticsSummary() {
  const response = await client.get('/api/analytics/summary');
  return response.data?.data ?? null;
}

/**
 * Fetch per-day energy and revenue metrics for the admin bar chart.
 * Typically returns the last 7 days of data.
 * Falls back to `[]` if the analytics service is unavailable.
 *
 * @returns {Promise<DailyAnalytics[]>} Array of daily records (may be empty).
 * @throws {import('axios').AxiosError} Only on unexpected non-network errors.
 */
export async function getDailyAnalytics() {
  const response = await client.get('/api/analytics/daily');
  return response.data?.data || [];
}
