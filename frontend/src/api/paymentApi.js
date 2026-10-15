import client from './client';
export async function getPayments() { return (await client.get('/api/payments')).data.data || []; }
export async function payPayment(paymentId) { return (await client.patch(`/api/payments/${paymentId}/pay`)).data.data; }
