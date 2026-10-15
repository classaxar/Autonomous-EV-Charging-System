import client from './client';

export async function getVehicles() {
  const response = await client.get('/api/ev');
  return response.data.data || [];
}

export async function createVehicle(payload) {
  const response = await client.post('/api/ev', payload);
  return response.data.data;
}

export async function updateVehicle(vehicleId, payload) {
  const response = await client.put(`/api/ev/${vehicleId}`, payload);
  return response.data.data;
}

export async function deleteVehicle(vehicleId) {
  const response = await client.delete(`/api/ev/${vehicleId}`);
  return response.data.data;
}
