import { useEffect, useState } from 'react';
import { getPayments, payPayment } from '../../api/paymentApi';

const STATUS_STYLE = {
  PAID:    { color: 'var(--accent-green)',  bg: 'rgba(53,211,153,0.1)',  border: 'rgba(53,211,153,0.3)',  icon: '✅' },
  PENDING: { color: 'var(--accent-amber)',  bg: 'rgba(245,184,75,0.1)',  border: 'rgba(245,184,75,0.3)',  icon: '⏳' },
  FAILED:  { color: 'var(--accent-red)',    bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)', icon: '❌' },
};

export default function PaymentPage() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState('');

  async function load() {
    try { setPayments(await getPayments()); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load payments.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function pay(paymentId) {
    setPaying(paymentId);
    try { await payPayment(paymentId); await load(); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to pay this invoice.'); }
    finally { setPaying(''); }
  }

  const pending = payments.filter((p) => p.status === 'PENDING');
  const totalPending = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💳</div>
        <p className="muted">Loading payments…</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Billing</p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>Payments & Invoices</h1>
        <p className="muted" style={{ fontSize: '0.95rem' }}>Track and settle charging session invoices.</p>
      </div>

      {message && (
        <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ⚠️ {message}
        </div>
      )}

      {/* Summary Bar */}
      {payments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Invoices', value: payments.length, color: 'var(--text-primary)', icon: '🧾' },
            { label: 'Pending', value: pending.length, color: 'var(--accent-amber)', icon: '⏳' },
            { label: 'Amount Due', value: `₹${totalPending.toFixed(2)}`, color: 'var(--accent-amber)', icon: '💰' },
            { label: 'Paid', value: payments.filter((p) => p.status === 'PAID').length, color: 'var(--accent-green)', icon: '✅' },
          ].map((stat) => (
            <div key={stat.label} className="surface" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
              <div style={{ color: stat.color, fontWeight: '700', fontSize: '1.4rem', marginBottom: '0.2rem' }}>{stat.value}</div>
              <div className="muted" style={{ fontSize: '0.75rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="surface" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No invoices yet</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Completed charging sessions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {payments.map((payment) => {
            const s = STATUS_STYLE[payment.status] || STATUS_STYLE.PENDING;
            return (
              <div key={payment.paymentId} className="surface" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>{payment.paymentId}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '99px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.icon} {payment.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>⚡ {Number(payment.energyKwh || 0).toFixed(2)} kWh</span>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>📊 ₹{payment.pricePerKwh}/kWh</span>
                      {payment.sessionId && <span className="muted" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Session: {payment.sessionId}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.35rem', color: payment.status === 'PAID' ? 'var(--accent-green)' : 'var(--accent-amber)', marginBottom: '0.5rem' }}>
                      ₹{Number(payment.amount).toFixed(2)}
                    </div>
                    {payment.status === 'PENDING' && (
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => pay(payment.paymentId)}
                        disabled={paying === payment.paymentId}
                        style={{ padding: '9px 20px', fontSize: '0.88rem' }}
                      >
                        {paying === payment.paymentId ? '⏳ Processing…' : '💳 Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
