import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/bookingApi';
import { getVehicles } from '../../api/evApi';
import { getStationSlots, getStations } from '../../api/stationApi';
import { useAuth } from '../../context/AuthContext';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

const STATUS_COLOR = { FREE: 'var(--accent-green)', OCCUPIED: 'var(--accent-red)', RESERVED: 'var(--accent-amber)' };
const STATUS_BG = { FREE: 'rgba(53,211,153,0.1)', OCCUPIED: 'rgba(251,113,133,0.1)', RESERVED: 'rgba(245,184,75,0.1)' };

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const routeState = location.state || {};

  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicleId, setVehicleId] = useState(routeState.vehicleId || '');
  const [stationId, setStationId] = useState(routeState.stationId || '');
  const [slotId, setSlotId] = useState(routeState.slotId || '');
  const [duration, setDuration] = useState(60);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadOptions = useCallback(async () => {
    if (!token) { setMessage('Sign in to create a booking.'); setLoading(false); return; }
    try {
      const [nextVehicles, nextStations] = await Promise.all([getVehicles(), getStations()]);
      setVehicles(nextVehicles);
      setStations(nextStations);
      const chosenStationId = nextStations.some((s) => s.stationId === routeState.stationId)
        ? routeState.stationId : nextStations[0]?.stationId || '';
      const selectedStation = nextStations.find((s) => s.stationId === chosenStationId);
      const freeSlots = (selectedStation?.slots || []).filter((s) => s.status === 'FREE');
      setVehicleId((cur) => nextVehicles.some((v) => v.vehicleId === cur) ? cur : nextVehicles[0]?.vehicleId || '');
      setStationId(chosenStationId);
      setSlotId(freeSlots.some((s) => s.slotId === routeState.slotId) ? routeState.slotId : freeSlots[0]?.slotId || '');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to load vehicles and stations.'));
    } finally {
      setLoading(false);
    }
  }, [routeState.stationId, routeState.slotId, token]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const selectedStation = stations.find((s) => s.stationId === stationId);
  const freeSlots = (selectedStation?.slots || []).filter((s) => s.status === 'FREE');

  function changeStation(e) {
    const nextId = e.target.value;
    const nextSt = stations.find((s) => s.stationId === nextId);
    setStationId(nextId);
    setSlotId((nextSt?.slots || []).find((s) => s.status === 'FREE')?.slotId || '');
  }

  async function refreshSlots() {
    if (!stationId) return;
    try {
      const nextSlots = await getStationSlots(stationId);
      setStations((cur) => cur.map((s) => s.stationId === stationId ? { ...s, slots: nextSlots } : s));
      setSlotId(nextSlots.find((s) => s.status === 'FREE')?.slotId || '');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to refresh station slots.'));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!vehicleId || !stationId || !slotId) { setMessage('Select an EV, station, and free slot before booking.'); return; }
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 1440) {
      setMessage('Duration must be a whole number between 1 and 1440 minutes.');
      return;
    }
    setSubmitting(true);
    try {
      setBooking(await createBooking({ vehicleId, stationId, slotId, startTime: new Date().toISOString(), duration: Number(duration) }));
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to create this booking.'));
      if (error.response?.status === 409) await refreshSlots();
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⚡</div>
        <p className="muted">Loading booking options…</p>
      </div>
    </div>
  );

  // ── Booking Confirmed ────────────────────────────────────────────────────
  if (booking) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div className="surface" style={{ padding: '3rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--accent-green)', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
        <p className="muted" style={{ marginBottom: '0.5rem' }}>Booking ID</p>
        <p style={{ fontWeight: '700', fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', marginBottom: '1.5rem' }}>
          {booking.bookingId}
        </p>
        <div style={{ background: 'rgba(53,211,153,0.1)', border: '1px solid rgba(53,211,153,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent-green)' }}>
          Status: <strong>{booking.status}</strong>
        </div>
        <button className="btn-primary" onClick={() => navigate('/history')} style={{ width: '100%', padding: '13px' }}>
          View in Activity History
        </button>
      </div>
    </div>
  );

  // ── No Data ──────────────────────────────────────────────────────────────
  if (!vehicles.length || !stations.length) return (
    <div className="page-container">
      <h1 style={{ marginBottom: '1.5rem' }}>Book a Charging Slot</h1>
      {message && <div style={{ color: 'var(--accent-red)', background: 'rgba(251,113,133,0.1)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>{message}</div>}
      {!vehicles.length && <div className="surface" style={{ padding: '2rem', textAlign: 'center' }}><p>🚗 Add an EV on the <button className="btn-secondary" onClick={() => navigate('/ev')} style={{ marginLeft: '6px' }}>Vehicles page</button> before booking.</p></div>}
      {!stations.length && <div className="surface" style={{ padding: '2rem', textAlign: 'center', marginTop: '1rem' }}><p className="muted">⚡ No charging stations are currently available.</p></div>}
    </div>
  );

  // ── Main Form ────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Slot Reservation</p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>Book a Charging Slot</h1>
        <p className="muted" style={{ fontSize: '0.95rem' }}>Select your vehicle, station, and an available slot to confirm your booking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left – Form */}
        <div>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="surface" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem' }}>Session Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">Electric Vehicle</label>
                  <select className="form-input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                    <option value="">Select an EV</option>
                    {vehicles.map((v) => <option key={v.vehicleId} value={v.vehicleId}>{v.brand} {v.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Charging Station</label>
                  <select className="form-input" value={stationId} onChange={changeStation} required>
                    <option value="">Select a station</option>
                    {stations.map((s) => <option key={s.stationId} value={s.stationId}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Duration (minutes)</label>
                  <input className="form-input" type="number" min="1" max="1440" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Selected Slot</label>
                  <div className="form-input" style={{ color: slotId ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: slotId ? '700' : '400', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default' }}>
                    {slotId ? `⚡ ${slotId}` : 'Pick a slot below'}
                  </div>
                </div>
              </div>
            </div>

            {/* Slot Grid */}
            <div className="surface" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Station Slots {selectedStation ? `— ${selectedStation.name}` : ''}
                </h2>
                <button type="button" className="btn-secondary" onClick={refreshSlots} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  🔄 Refresh
                </button>
              </div>

              {(selectedStation?.slots || []).length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>No slot data available. Try refreshing.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '0.6rem' }}>
                  {(selectedStation?.slots || []).map((slot) => {
                    const isFree = slot.status === 'FREE';
                    const isSelected = slot.slotId === slotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        disabled={!isFree}
                        onClick={() => isFree && setSlotId(slot.slotId)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--accent-cyan)' : `1px solid ${isFree ? 'rgba(53,211,153,0.25)' : 'var(--border-color)'}`,
                          background: isSelected ? 'rgba(73,213,255,0.12)' : (STATUS_BG[slot.status] || 'rgba(0,0,0,0.2)'),
                          color: isSelected ? 'var(--accent-cyan)' : (STATUS_COLOR[slot.status] || 'var(--text-muted)'),
                          cursor: isFree ? 'pointer' : 'not-allowed',
                          opacity: isFree ? 1 : 0.5,
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          fontWeight: '600',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.2rem' }}>{slot.slotId}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.04em' }}>{slot.status}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {message && (
              <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-red)', fontSize: '0.9rem' }}>
                ⚠️ {message}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={!vehicleId || !stationId || !slotId || !freeSlots.length || submitting}
              style={{ padding: '14px', fontSize: '1rem', borderRadius: '12px' }}
            >
              {submitting ? '⏳ Confirming booking…' : '📅 Confirm Booking'}
            </button>
          </form>
        </div>

        {/* Right – Summary */}
        <div className="surface" style={{ padding: '1.75rem', position: 'sticky', top: '92px' }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>Booking Summary</h2>
          {[
            { label: 'Vehicle', value: vehicles.find((v) => v.vehicleId === vehicleId) ? `${vehicles.find((v) => v.vehicleId === vehicleId).brand} ${vehicles.find((v) => v.vehicleId === vehicleId).model}` : '—' },
            { label: 'Station', value: selectedStation?.name || '—' },
            { label: 'Slot', value: slotId || '—' },
            { label: 'Duration', value: duration ? `${duration} min` : '—' },
            { label: 'Available slots', value: freeSlots.length },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{row.label}</span>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: row.value === '—' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
          {selectedStation?.pricePerKwh && (
            <div style={{ marginTop: '1.25rem', background: 'rgba(73,213,255,0.08)', border: '1px solid rgba(73,213,255,0.2)', borderRadius: '10px', padding: '0.9rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Rate</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '1.25rem' }}>₹{selectedStation.pricePerKwh}<span style={{ fontSize: '0.8rem', fontWeight: '400' }}>/kWh</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
