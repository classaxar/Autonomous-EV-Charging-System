import { useEffect, useState } from 'react';
import { getPayments, payPayment } from '../../api/paymentApi';

export default function PaymentPage() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    try { setPayments(await getPayments()); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load payments.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function pay(paymentId) {
    try { await payPayment(paymentId); await load(); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to pay this invoice.'); }
  }
  if (loading) return <main><p>Loading payments...</p></main>;
  return <main><h1>Payments</h1>{message && <p role="alert">{message}</p>}
    {!payments.length && <p>No payments are available yet.</p>}
    {payments.map((payment) => <article key={payment.paymentId}>
      <h2>{payment.paymentId}</h2><p>{payment.energyKwh} kWh × {payment.pricePerKwh} = {Number(payment.amount).toFixed(2)}</p>
      <p>Status: {payment.status}</p>{payment.status === 'PENDING' && <button type="button" onClick={() => pay(payment.paymentId)}>Pay</button>}
    </article>)}
  </main>;
}
