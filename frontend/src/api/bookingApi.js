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
}
