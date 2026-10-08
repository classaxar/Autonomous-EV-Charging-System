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
