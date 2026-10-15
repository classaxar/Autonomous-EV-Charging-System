import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getVehicles } from '../../api/evApi';
import { recommendChargingStation } from '../../api/decisionApi';

const defaultLocation = { latitude: 23.21, longitude: 72.63 };

export default function RecommendationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};

  const [evs, setEvs] = useState([]);
  const [vehicleId, setVehicleId] = useState(routeState.vehicleId || '');
  const [targetBattery, setTargetBattery] = useState(80);
  const [loc, setLoc] = useState(defaultLocation);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [locLabel, setLocLabel] = useState('Default (Gandhinagar)');

  useEffect(() => {
    getVehicles()
      .then((data) => {
        setEvs(data);
        if (!vehicleId && data[0]) setVehicleId(data[0].vehicleId);
      })
      .catch((error) => setMessage(error.response?.data?.message || error.message || 'Unable to load EVs.'));
  }, []);

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setMessage('Browser geolocation is unavailable; using the default location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLoc({ latitude: coords.latitude, longitude: coords.longitude });
        setLocLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      },
      () => setMessage('Unable to read browser location; using the default location.')
    );
  }

  async function submit(event) {
    event.preventDefault();
    const ev = evs.find((item) => item.vehicleId === vehicleId);
    if (!ev) { setMessage('Select an EV before requesting a recommendation.'); return; }
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      setResult(await recommendChargingStation({
        vehicleId,
        currentBattery: ev.currentBattery,
        targetBattery: Number(targetBattery),
        batteryCapacity: ev.batteryCapacity,
        maxChargingPower: ev.maxChargingPower,
        location: loc
      }));
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to get a recommendation.');
    } finally {
      setLoading(false);
    }
  }

  const rec = result?.recommended;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">AI Decision Engine</p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>
          Find the Best Charger
        </h1>
        <p className="muted" style={{ fontSize: '0.95rem' }}>
          Our autonomous engine scores every station by distance, queue, price, and compatibility.
        </p>
      </div>

      {/* Form Card */}
      <div className="surface" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* EV Selector */}
            <div>
              <label className="form-label">Electric Vehicle</label>
              <select
                className="form-input"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select an EV</option>
                {evs.map((ev) => (
                  <option key={ev.vehicleId} value={ev.vehicleId}>
                    {ev.brand} {ev.model} ({ev.currentBattery}% battery)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Battery */}
            <div>
              <label className="form-label">Target Battery (%)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                value={targetBattery}
                onChange={(e) => setTargetBattery(e.target.value)}
              />
            </div>

            {/* Location */}
            <div>
              <label className="form-label">Location</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  value={locLabel}
                  readOnly
                  style={{ flex: 1, cursor: 'default', color: 'var(--text-muted)' }}
                />
                <button type="button" className="btn-secondary" onClick={useBrowserLocation} style={{ whiteSpace: 'nowrap', padding: '0 14px' }}>
                  📍 Use mine
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', color: 'var(--accent-red)', fontSize: '0.9rem' }}>
              ⚠️ {message}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '12px' }}>
            {loading ? '⚡ Analysing stations...' : '⚡ Get AI Recommendation'}
          </button>
        </form>
      </div>

      {/* Result */}
      {rec && (
        <>
          {/* Recommended Station Hero Card */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Recommended Station</p>
            <div className="surface" style={{ padding: '1.75rem', borderColor: 'rgba(73,213,255,0.35)', background: 'rgba(14,31,51,0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--accent-cyan)' }}>
                    ⚡ {rec.name}
                  </h2>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>{rec.reason}</p>
                </div>
                <div style={{ background: 'rgba(73,213,255,0.12)', border: '1px solid rgba(73,213,255,0.3)', borderRadius: '12px', padding: '0.6rem 1.1rem', textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem', fontWeight: '700' }}>{rec.score}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '📍', label: 'Distance', value: `${rec.distanceKm} km` },
                  { icon: '🕐', label: 'Est. Time', value: `${rec.estimatedMinutes} min` },
                  { icon: '👥', label: 'Queue', value: `${rec.queueLength} waiting` },
                  { icon: '💰', label: 'Price', value: `₹${rec.pricePerKwh}/kWh` },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '0.9rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{stat.icon}</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1rem' }}>{stat.value}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                type="button"
                disabled={!rec.slotId}
                onClick={() => navigate('/booking', { state: { vehicleId, stationId: rec.stationId, slotId: rec.slotId } })}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '12px' }}
              >
                📅 Book This Station Now
              </button>
            </div>
          </div>

          {/* Ranked List */}
          {result.ranked?.length > 0 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>All Ranked Stations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.ranked.map((st, i) => {
                  const scoreWidth = Math.min(100, Math.max(0, (st.score / 100) * 100));
                  return (
                    <div key={st.stationId} className="surface" style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg,var(--accent-cyan),var(--accent-blue))' : 'rgba(148,163,184,0.12)', display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: '700', flexShrink: 0, color: i === 0 ? '#07111f' : 'var(--text-muted)' }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>{st.name}</div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${scoreWidth}%`, background: i === 0 ? 'var(--accent-cyan)' : 'var(--accent-blue)', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                      <div style={{ color: i === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: '700', fontSize: '1rem', minWidth: '52px', textAlign: 'right' }}>
                        {st.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
