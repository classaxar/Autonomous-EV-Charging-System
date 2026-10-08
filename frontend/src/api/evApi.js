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
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function getVehicles(token) {
  const { data } = await axios.get(`${API_URL}/api/ev`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data || [];
}

export async function createVehicle(token, payload) {
  const { data } = await axios.post(`${API_URL}/api/ev`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data;
}

export async function updateVehicle(token, id, payload) {
  const { data } = await axios.put(`${API_URL}/api/ev/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data;
}

export async function deleteVehicle(token, id) {
  const { data } = await axios.delete(`${API_URL}/api/ev/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}
