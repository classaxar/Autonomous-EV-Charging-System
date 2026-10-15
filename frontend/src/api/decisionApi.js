import client from './client';

export async function recommendChargingStation(payload) {
  const response = await client.post('/api/decision/recommend', payload);
  return response.data.data;
}
