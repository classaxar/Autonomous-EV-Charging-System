import client from './client';

export async function getStations() {
  const response = await client.get('/api/stations');
  return response.data.data || [];
}

export async function getStationSlots(stationId) {
  const response = await client.get(`/api/stations/${stationId}/slots`);
  return response.data.data || [];
}
