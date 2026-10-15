import { useCallback, useEffect, useState } from 'react';
import { cancelBooking, getBookings } from '../../api/bookingApi';
import { getChargingHistory } from '../../api/chargingApi';
import { getPayments } from '../../api/paymentApi';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function mergeHistory(bookings, sessions, payments) {
  const sessionsByBooking = new Map(sessions.map((s) => [s.bookingId, s]));
  const paymentsBySession = new Map(payments.map((p) => [p.sessionId, p]));
  return bookings.map((booking) => {
    const session = sessionsByBooking.get(booking.bookingId);
    const payment = session ? paymentsBySession.get(session.sessionId) : undefined;
    return {
      id: booking.bookingId,
      date: session?.createdAt || booking.startTime || booking.createdAt,
      stationId: booking.stationId || session?.stationId,
      energy: session?.energyConsumed ?? session?.energyKwh,
      amount: payment?.amount,
      status: payment?.status || session?.status || booking.status,
      booking,
    };
  });
}

const STATUS_STYLE = {
  COMPLETED: { color: 'var(--accent-green)',  bg: 'rgba(53,211,153,0.1)',  border: 'rgba(53,211,153,0.3)' },
  PAID:      { color: 'var(--accent-green)',  bg: 'rgba(53,211,153,0.1)',  border: 'rgba(53,211,153,0.3)' },
  ACTIVE:    { color: 'var(--accent-cyan)',   bg: 'rgba(73,213,255,0.1)',  border: 'rgba(73,213,255,0.3)' },
  CONFIRMED: { color: 'var(--accent-cyan)',   bg: 'rgba(73,213,255,0.1)',  border: 'rgba(73,213,255,0.3)' },
  PENDING:   { color: 'var(--accent-amber)',  bg: 'rgba(245,184,75,0.1)',  border: 'rgba(245,184,75,0.3)' },
  CANCELLED: { color: 'var(--text-muted)',    bg: 'rgba(148,163,184,0.07)', border: 'rgba(148,163,184,0.2)' },
  FAILED:    { color: 'var(--accent-red)',    bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '99px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status || '—'}
    </span>
  );
}

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionId, setActionId] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [bookingsResponse, sessionsResponse, paymentsResponse] = await Promise.all([
        getBookings(), getChargingHistory(), getPayments()
      ]);
      setRows(mergeHistory(bookingsResponse, sessionsResponse, paymentsResponse));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to load activity history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleCancel(bookingId) {
    setActionId(bookingId);
    setErrorMessage('');
    try { await cancelBooking(bookingId); await loadHistory(); }
    catch (error) { setErrorMessage(getErrorMessage(error, 'Unable to cancel this booking.')); }
    finally { setActionId(''); }
  }

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
        <p className="muted">Loading activity history…</p>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <p className="eyebrow">Activity Log</p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>Charging History</h1>
          <p className="muted" style={{ fontSize: '0.95rem' }}>All your bookings, sessions, and payments in one place.</p>
        </div>
        <button className="btn-secondary" onClick={loadHistory} style={{ padding: '9px 16px', fontSize: '0.85rem' }}>🔄 Refresh</button>
      </div>

      {errorMessage && (
        <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {rows.length === 0 && !errorMessage ? (
        <div className="surface" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No activity yet</h3>
          <p className="muted" style={{ fontSize: '0.9rem' }}>Your bookings and charging sessions will appear here.</p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          {rows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Sessions', value: rows.length, icon: '📋' },
                { label: 'Total Energy', value: `${rows.reduce((s, r) => s + Number(r.energy || 0), 0).toFixed(1)} kWh`, icon: '⚡' },
                { label: 'Total Spent', value: `₹${rows.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2)}`, icon: '💰' },
              ].map((stat) => (
                <div key={stat.label} className="surface" style={{ padding: '1.1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{stat.value}</div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {rows.map((row) => {
              const canCancel = ['PENDING', 'CONFIRMED'].includes(row.booking.status);
              return (
                <div key={row.id} className="surface" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {/* Left */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>{row.id}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <span className="muted" style={{ fontSize: '0.82rem' }}>🗓️ {formatDate(row.date)}</span>
                        {row.stationId && <span className="muted" style={{ fontSize: '0.82rem' }}>📍 {row.stationId}</span>}
                        {row.energy != null && <span className="muted" style={{ fontSize: '0.82rem' }}>⚡ {Number(row.energy).toFixed(2)} kWh</span>}
                      </div>
                    </div>
                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {row.amount != null && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>₹{Number(row.amount).toFixed(2)}</div>
                        </div>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(row.id)}
                          disabled={actionId === row.id}
                          style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(251,113,133,0.3)', background: 'transparent', color: 'var(--accent-red)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {actionId === row.id ? '⏳ Cancelling…' : '✕ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
