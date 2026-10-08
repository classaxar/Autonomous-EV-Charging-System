import client from './client';

export async function createBooking(payload) {
  const response = await client.post('/api/bookings', payload);
  return response.data.data;
}

export async function getBookings() {
  const response = await client.get('/api/bookings');
  return response.data.data || [];
}

export async function cancelBooking(bookingId) {
  const response = await client.patch(`/api/bookings/${bookingId}/cancel`);
  return response.data.data;
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function createBooking(token, payload) {
  const { data } = await axios.post(`${API_URL}/api/bookings`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data;
}

export async function getBookings(token) {
  const { data } = await axios.get(`${API_URL}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data || [];
}

export async function cancelBooking(token, id) {
  const { data } = await axios.patch(`${API_URL}/api/bookings/${id}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data.data;
}
