import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPayments, payPayment } from '../../api/paymentApi';
import InrCheckoutModal from '../../components/payment/InrCheckoutModal';
import GstInvoiceModal from '../../components/payment/GstInvoiceModal';

const STATUS_STYLE = {
  PAID:    { color: 'var(--accent-green)',  bg: 'rgba(53,211,153,0.1)',  border: 'rgba(53,211,153,0.3)',  icon: '✅' },
  PENDING: { color: 'var(--accent-amber)',  bg: 'rgba(245,184,75,0.1)',  border: 'rgba(245,184,75,0.3)',  icon: '⏳' },
  FAILED:  { color: 'var(--accent-red)',    bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)', icon: '❌' },
};

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const targetSessionId = searchParams.get('sessionId');

  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [activeCheckoutPayment, setActiveCheckoutPayment] = useState(null);
  const [activeInvoicePayment, setActiveInvoicePayment] = useState(null);

  async function load() {
    try {
      const data = await getPayments();
      setPayments(data);
      // If navigated with sessionId, automatically prompt checkout for that pending payment
      if (targetSessionId) {
        const matching = data.find(p => p.sessionId === targetSessionId && p.status === 'PENDING');
        if (matching) {
          setActiveCheckoutPayment(matching);
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetSessionId]);

  async function handlePaymentSuccess(paymentId, paymentData) {
    try {
      await payPayment(paymentId, paymentData);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Payment settlement error.');
      throw error;
    }
  }

  const pending = payments.filter((p) => p.status === 'PENDING');
  const totalPending = pending.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p className="eyebrow">Bharat EV Billing</p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>
            Payments & Tax Invoices (₹)
          </h1>
          <p className="muted" style={{ fontSize: '0.95rem' }}>
            Settle charging session invoices via UPI QR, RuPay Card, or NetBanking in Indian Rupees.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '8px 14px',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
            GST SAC: 998714 • 18% Inclusive
          </span>
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ⚠️ {message}
        </div>
      )}

      {/* Summary Bar */}
      {payments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Invoices', value: payments.length, color: 'var(--text-primary)', icon: '🧾' },
            { label: 'Pending Due', value: pending.length, color: 'var(--accent-amber)', icon: '⏳' },
            { label: 'Amount Payable', value: `₹${totalPending.toFixed(2)}`, color: 'var(--accent-amber)', icon: '💰' },
            { label: 'Settled (INR)', value: `₹${totalPaid.toFixed(2)}`, color: 'var(--accent-green)', icon: '✅' },
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
          <p className="muted" style={{ fontSize: '0.9rem' }}>Completed charging sessions will appear here for INR settlement.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {payments.map((payment) => {
            const s = STATUS_STYLE[payment.status] || STATUS_STYLE.PENDING;
            const isTarget = targetSessionId && payment.sessionId === targetSessionId;
            return (
              <div
                key={payment.paymentId}
                className="surface"
                style={{
                  padding: '1.5rem',
                  border: isTarget ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  boxShadow: isTarget ? '0 0 20px rgba(73, 213, 255, 0.2)' : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                        {payment.paymentId}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '99px', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                        {s.icon} {payment.status}
                      </span>
                      {payment.paymentMethod && payment.status === 'PAID' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: 'rgba(73, 213, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                          💳 {payment.paymentMethod}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>⚡ {Number(payment.energyKwh || 0).toFixed(2)} kWh</span>
                      <span className="muted" style={{ fontSize: '0.85rem' }}>📊 ₹{payment.pricePerKwh}/kWh</span>
                      {payment.sessionId && <span className="muted" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Session: {payment.sessionId}</span>}
                    </div>

                    {payment.transactionRef && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Bank Ref: {payment.transactionRef}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.35rem', color: payment.status === 'PAID' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                      ₹{Number(payment.amount).toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveInvoicePayment(payment)}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      >
                        🧾 Tax Receipt
                      </button>

                      {payment.status === 'PENDING' && (
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => setActiveCheckoutPayment(payment)}
                          style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                        >
                          ⚡ Pay Now (₹)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {activeCheckoutPayment && (
        <InrCheckoutModal
          payment={activeCheckoutPayment}
          onClose={() => setActiveCheckoutPayment(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Official Tax Invoice Modal */}
      {activeInvoicePayment && (
        <GstInvoiceModal
          payment={activeInvoicePayment}
          onClose={() => setActiveInvoicePayment(null)}
        />
      )}
    </div>
  );
}

