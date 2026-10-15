import client from './client';

/**
 * @typedef {Object} Payment
 * @property {string} paymentId    - Unique payment identifier (e.g. "PAY-001").
 * @property {string} sessionId    - Charging session this payment covers.
 * @property {number} energyKwh    - Total energy billed in kWh.
 * @property {number} pricePerKwh  - Rate applied in local currency per kWh.
 * @property {number} amount       - Total amount due (`energyKwh × pricePerKwh`).
 * @property {'PENDING'|'PAID'|'FAILED'} status - Payment lifecycle status.
 * @property {string} [createdAt]  - ISO 8601 timestamp of invoice creation.
 * @property {string} [paidAt]     - ISO 8601 timestamp of successful payment.
 */

/**
 * Fetch all payment invoices for the currently authenticated user.
 * Includes both pending and settled invoices.
 *
 * @returns {Promise<Payment[]>} Array of payment records (may be empty).
 * @throws {import('axios').AxiosError} On network or server error.
 */
export async function getPayments() {
  return (await client.get('/api/payments')).data.data || [];
}

/**
 * Mark a pending payment as paid.
 * Triggers the payment gateway and updates the invoice status to `PAID`.
 *
 * @param {string} paymentId - ID of the payment to settle.
 * @returns {Promise<Payment>} The updated payment record with status `PAID`.
 * @throws {import('axios').AxiosError} On network or server error (e.g. 404 Not Found, 402 Payment Required).
 */
export async function payPayment(paymentId) {
  return (await client.patch(`/api/payments/${paymentId}/pay`)).data.data;
}
