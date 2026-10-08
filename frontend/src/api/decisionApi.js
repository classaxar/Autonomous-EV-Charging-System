import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

export async function recommendChargingStation(payload, token) {
  const response = await api.post('/api/decision/recommend', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
}
