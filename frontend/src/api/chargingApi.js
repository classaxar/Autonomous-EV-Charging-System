import client from './client';
export async function startCharging(payload) { return (await client.post('/api/charging/start', payload)).data.data; }
export async function getChargingSession(sessionId) { return (await client.get(`/api/charging/${sessionId}`)).data.data; }
export async function stopCharging(sessionId) { return (await client.post(`/api/charging/${sessionId}/stop`)).data.data; }
export async function getChargingHistory() { return (await client.get('/api/charging/history')).data.data || []; }
