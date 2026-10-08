import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function getStations(token) {
  const { data } = await axios.get(`${API_URL}/api/stations`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return data.data || [];
}

export async function getStationSlots(token, stationId) {
  const { data } = await axios.get(`${API_URL}/api/stations/${stationId}/slots`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return data.data || [];
}
