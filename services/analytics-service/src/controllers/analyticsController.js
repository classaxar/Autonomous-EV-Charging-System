const axios = require('axios');
const { success, error } = require('../utils/envelope');

let cache = { expires: 0, data: null };
function internalHeaders() {
  return { 'x-internal-key': process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system' };
}
async function fetchAll(path, serviceUrl) {
  const response = await axios.get(`${serviceUrl}${path}`, { headers: internalHeaders(), timeout: 5000 });
  return response.data.data || [];
}
async function aggregate() {
  if (cache.data && cache.expires > Date.now()) return cache.data;
  const [sessions, payments] = await Promise.all([
    fetchAll('/internal/charging/all', process.env.CHARGING_SERVICE_URL || 'http://charging-service:5006'),
    fetchAll('/internal/payments/all', process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5007')
  ]);
  cache = { expires: Date.now() + 30000, data: { sessions, payments } };
  return cache.data;
}
async function summary(req, res) {
  try {
    const { sessions, payments } = await aggregate();
    const completed = sessions.filter((session) => ['COMPLETED', 'STOPPED'].includes(session.status));
    return success(res, {
      totalSessions: completed.length,
      totalEnergyKwh: Number(completed.reduce((sum, session) => sum + Number(session.energyConsumed || 0), 0).toFixed(2)),
      totalRevenue: Number(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0).toFixed(2)),
      avgChargingMinutes: completed.length ? Number((completed.reduce((sum, session) => sum + Number(session.duration || 0), 0) / completed.length).toFixed(2)) : 0,
      activeSessions: sessions.filter((session) => ['STARTED', 'CHARGING'].includes(session.status)).length
    }, 'Analytics summary');
  } catch (requestError) { return error(res, 'Analytics services unavailable', 503); }
}
async function daily(req, res) {
  try {
    const { sessions, payments } = await aggregate();
    const result = {};
    sessions.filter((session) => ['COMPLETED', 'STOPPED'].includes(session.status)).forEach((session) => {
      const date = new Date(session.createdAt || session.startedAt).toISOString().slice(0, 10);
      result[date] = result[date] || { date, sessions: 0, energyKwh: 0, revenue: 0 };
      result[date].sessions += 1;
      result[date].energyKwh += Number(session.energyConsumed || 0);
    });
    payments.forEach((payment) => {
      const date = new Date(payment.createdAt).toISOString().slice(0, 10);
      if (result[date]) result[date].revenue += Number(payment.amount || 0);
    });
    return success(res, Object.values(result).map((row) => ({ ...row, energyKwh: Number(row.energyKwh.toFixed(2)), revenue: Number(row.revenue.toFixed(2)) })), 'Daily analytics');
  } catch (requestError) { return error(res, 'Analytics services unavailable', 503); }
}
async function stations(req, res) {
  try {
    const { sessions, payments } = await aggregate();
    const result = {};
    sessions.filter((session) => ['COMPLETED', 'STOPPED'].includes(session.status)).forEach((session) => {
      const row = result[session.stationId] || { stationId: session.stationId, sessions: 0, energyKwh: 0, revenue: 0 };
      row.sessions += 1;
      row.energyKwh += Number(session.energyConsumed || 0);
      result[session.stationId] = row;
    });
    payments.forEach((payment) => {
      const session = sessions.find((candidate) => candidate.sessionId === payment.sessionId);
      if (session && result[session.stationId]) result[session.stationId].revenue += Number(payment.amount || 0);
    });
    return success(res, Object.values(result).map((row) => ({ ...row, energyKwh: Number(row.energyKwh.toFixed(2)), revenue: Number(row.revenue.toFixed(2)) })), 'Station analytics');
  } catch (requestError) { return error(res, 'Analytics services unavailable', 503); }
}
module.exports = { summary, daily, stations, aggregate };
