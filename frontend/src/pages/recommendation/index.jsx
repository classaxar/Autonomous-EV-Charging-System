import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getVehicles } from '../../api/evApi';
import {
  recommendChargingStation,
  recommendCorridorTrip,
  PRESET_LOCATIONS,
  searchOpenStreetMap
} from '../../api/decisionApi';
import OpenStreetMapRoute from '../../components/map/OpenStreetMapRoute';

const defaultLocation = { latitude: 23.21, longitude: 72.63 };

export default function RecommendationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};

  // Mode: 'corridor' (Trip & Leisure) or 'nearby' (Point-based)
  const [activeTab, setActiveTab] = useState('corridor');

  // Shared state
  const [evs, setEvs] = useState([]);
  const [vehicleId, setVehicleId] = useState(routeState.vehicleId || '');
  const [targetBattery, setTargetBattery] = useState(80);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab 1: Corridor (Trip & Leisure) state
  const [origin, setOrigin] = useState({
    name: 'Mehsana City / Highway Bypass',
    latitude: 23.5880,
    longitude: 72.3693
  });
  const [destination, setDestination] = useState({
    name: 'Patan (Rani ki Vav / Historic Capital)',
    latitude: 23.8584,
    longitude: 72.1017
  });
  const [maxDetourKm, setMaxDetourKm] = useState(25);
  const [corridorResult, setCorridorResult] = useState(null);
  const [originQuery, setOriginQuery] = useState(origin.name);
  const [destQuery, setDestQuery] = useState(destination.name);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  // Tab 2: Nearby state
  const [loc, setLoc] = useState(defaultLocation);
  const [locLabel, setLocLabel] = useState('Default (Gandhinagar)');
  const [nearbyResult, setNearbyResult] = useState(null);

  useEffect(() => {
    getVehicles()
      .then((data) => {
        setEvs(data);
        if (!vehicleId && data[0]) setVehicleId(data[0].vehicleId);
      })
      .catch((error) => setMessage(error.response?.data?.message || error.message || 'Unable to load EVs.'));
  }, []);

  // Quick preset loader: Mehsana to Patan (Modhera Sun Temple showcase)
  function loadMehsanaToPatanDemo() {
    const o = PRESET_LOCATIONS.find((p) => p.name.includes('Mehsana')) || {
      name: 'Mehsana City / Highway Bypass',
      latitude: 23.5880,
      longitude: 72.3693
    };
    const d = PRESET_LOCATIONS.find((p) => p.name.includes('Patan')) || {
      name: 'Patan (Rani ki Vav / Historic Capital)',
      latitude: 23.8584,
      longitude: 72.1017
    };
    setOrigin(o);
    setOriginQuery(o.name);
    setDestination(d);
    setDestQuery(d.name);
    setMaxDetourKm(25);
  }

  // Use Browser Geolocation for Origin
  function useBrowserLocationAsOrigin() {
    if (!navigator.geolocation) {
      setMessage('Browser geolocation is unavailable on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const liveLoc = {
          name: `My Live Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
          latitude: coords.latitude,
          longitude: coords.longitude
        };
        setOrigin(liveLoc);
        setOriginQuery(liveLoc.name);
        setMessage('');
      },
      (err) => setMessage(`Unable to fetch live GPS: ${err.message}`)
    );
  }

  // Use Browser Geolocation for Nearby Search
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

  // Autocomplete search handlers
  async function handleOriginSearch(e) {
    const q = e.target.value;
    setOriginQuery(q);
    if (q.length > 2) {
      setSearchingOrigin(true);
      const list = await searchOpenStreetMap(q);
      setOriginSuggestions(list);
      setSearchingOrigin(false);
    } else {
      setOriginSuggestions([]);
    }
  }

  async function handleDestSearch(e) {
    const q = e.target.value;
    setDestQuery(q);
    if (q.length > 2) {
      setSearchingDest(true);
      const list = await searchOpenStreetMap(q);
      setDestSuggestions(list);
      setSearchingDest(false);
    } else {
      setDestSuggestions([]);
    }
  }

  // Submit Trip & Leisure Corridor Recommendation
  async function submitCorridor(e) {
    e.preventDefault();
    const ev = evs.find((item) => item.vehicleId === vehicleId);
    if (!ev) { setMessage('Select an EV before requesting a recommendation.'); return; }
    setLoading(true);
    setMessage('');
    setCorridorResult(null);

    try {
      const data = await recommendCorridorTrip({
        origin,
        destination,
        vehicleId,
        currentBattery: ev.currentBattery,
        targetBattery: Number(targetBattery),
        batteryCapacity: ev.batteryCapacity,
        maxChargingPower: ev.maxChargingPower,
        maxDetourKm: Number(maxDetourKm)
      });
      setCorridorResult(data);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to calculate corridor recommendations.');
    } finally {
      setLoading(false);
    }
  }

  // Submit Nearby Charger Recommendation
  async function submitNearby(e) {
    e.preventDefault();
    const ev = evs.find((item) => item.vehicleId === vehicleId);
    if (!ev) { setMessage('Select an EV before requesting a recommendation.'); return; }
    setLoading(true);
    setMessage('');
    setNearbyResult(null);

    try {
      setNearbyResult(await recommendChargingStation({
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

  const corridorRec = corridorResult?.recommended;
  const nearbyRec = nearbyResult?.recommended;

  return (
    <div className="page-container" style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <p className="eyebrow" style={{ letterSpacing: '0.12em', color: 'var(--accent-cyan)' }}>
          Autonomous Route Intelligence & OpenStreetMap
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', marginTop: '0.3rem', marginBottom: '0.4rem', fontWeight: 800 }}>
          {activeTab === 'corridor' ? '🛣️ Trip & Leisure EV Corridor Planner' : '⚡ AI Quick Charger Finder'}
        </h1>
        <p className="muted" style={{ fontSize: '1rem', maxWidth: '780px', lineHeight: 1.6 }}>
          {activeTab === 'corridor'
            ? 'Plan journeys with OpenStreetMap routing. Sync fast-charging stops with heritage monuments and tourist attractions—explore while you charge!'
            : 'Find and score the nearest single charging hub based on battery urgency, power, and queue wait times.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('corridor')}
          style={{
            padding: '10px 22px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'corridor' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'corridor' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'corridor' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🛣️</span> <span>Trip & Leisure Planner (Recommended)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nearby')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'nearby' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
            background: activeTab === 'nearby' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'nearby' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📍</span> <span>Point-to-Point Station Search</span>
        </button>
      </div>

      {/* Quick Showcase Banner for the Mehsana -> Patan Route */}
      {activeTab === 'corridor' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(245, 158, 11, 0.12))',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '14px',
          padding: '1rem 1.4rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🏛️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1rem' }}>
                Signature Showcase: Mehsana to Patan Corridor
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Recharge your EV while touring the 11th-century <b>Modhera Sun Temple & Surya Kund</b> simultaneously!
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={loadMehsanaToPatanDemo}
            style={{ fontSize: '0.85rem', padding: '8px 16px', borderColor: '#f59e0b', color: '#fbbf24' }}
          >
            ⚡ Load Route Example
          </button>
        </div>
      )}

      {/* Error Message banner */}
      {message && (
        <div style={{
          background: 'rgba(251,113,133,0.1)',
          border: '1px solid rgba(251,113,133,0.3)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          color: 'var(--accent-red)',
          fontSize: '0.9rem'
        }}>
          ⚠️ {message}
        </div>
      )}

      {/* TAB 1: CORRIDOR PLANNER FORM */}
      {activeTab === 'corridor' && (
        <div className="surface" style={{ padding: '1.8rem', marginBottom: '2rem', borderRadius: '16px' }}>
          <form onSubmit={submitCorridor}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.4rem', marginBottom: '1.5rem' }}>
              {/* Origin Selection */}
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🟢 Departure Location</span>
                  <button
                    type="button"
                    onClick={useBrowserLocationAsOrigin}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    📍 Use Live GPS
                  </button>
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={originQuery}
                  onChange={handleOriginSearch}
                  placeholder="Type address or pick preset..."
                  required
                />
                {searchingOrigin && <small style={{ color: 'var(--text-muted)' }}>Searching OpenStreetMap...</small>}
                {originSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 600,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    {originSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setOrigin(item);
                          setOriginQuery(item.name);
                          setOriginSuggestions([]);
                        }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={(e) => e.target.style.background = '#1e293b'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        📍 {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Selection */}
              <div style={{ position: 'relative' }}>
                <label className="form-label">🏁 Destination Location</label>
                <input
                  className="form-input"
                  type="text"
                  value={destQuery}
                  onChange={handleDestSearch}
                  placeholder="e.g. Patan, Vadnagar, Ahmedabad..."
                  required
                />
                {searchingDest && <small style={{ color: 'var(--text-muted)' }}>Searching OpenStreetMap...</small>}
                {destSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 600,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    {destSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDestination(item);
                          setDestQuery(item.name);
                          setDestSuggestions([]);
                        }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={(e) => e.target.style.background = '#1e293b'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        🏁 {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* EV, Target Battery & Detour Slider */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div>
                <label className="form-label">🚗 Your Electric Vehicle</label>
                <select
                  className="form-input"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select an EV</option>
                  {evs.map((ev) => (
                    <option key={ev.vehicleId} value={ev.vehicleId}>
                      {ev.brand} {ev.model} ({ev.currentBattery}% battery)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">🔋 Target Battery (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="20"
                  max="100"
                  value={targetBattery}
                  onChange={(e) => setTargetBattery(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">🛣️ Max Corridor Detour ({maxDetourKm} km)</label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="5"
                  value={maxDetourKm}
                  onChange={(e) => setMaxDetourKm(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', marginTop: '8px' }}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '12px' }}
            >
              {loading ? '🗺️ Analyzing Corridor & Historic Landmarks...' : '🚀 Calculate Smart Leisure Route'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: NEARBY CHARGER FORM */}
      {activeTab === 'nearby' && (
        <div className="surface" style={{ padding: '1.8rem', marginBottom: '2rem', borderRadius: '16px' }}>
          <form onSubmit={submitNearby}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Electric Vehicle</label>
                <select
                  className="form-input"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">Select an EV</option>
                  {evs.map((ev) => (
                    <option key={ev.vehicleId} value={ev.vehicleId}>
                      {ev.brand} {ev.model} ({ev.currentBattery}% battery)
                    </option>
                  ))}
                </select>
              </div>

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

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '12px' }}>
              {loading ? '⚡ Analysing stations...' : '⚡ Get AI Recommendation'}
            </button>
          </form>
        </div>
      )}

      {/* CORRIDOR RESULTS DISPLAY */}
      {activeTab === 'corridor' && corridorResult && (
        <div>
          {/* Interactive OpenStreetMap */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p className="eyebrow" style={{ margin: 0 }}>OpenStreetMap Synchronized Route</p>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Direct Highway Distance: <b>{corridorResult.directDistanceKm} km</b>
              </span>
            </div>

            <OpenStreetMapRoute
              origin={corridorResult.origin}
              destination={corridorResult.destination}
              recommended={corridorRec}
              allStations={corridorResult.ranked}
              touristSpot={corridorRec?.touristSpot}
              height="450px"
              onSelectStation={(st) => {
                // Allows user to click any candidate on the map to inspect
              }}
            />
          </div>

          {/* Dual Experience Hero Card: Charge & Tour */}
          {corridorRec && (
            <div style={{ marginBottom: '2.5rem' }}>
              <p className="eyebrow" style={{ marginBottom: '0.75rem', color: '#fbbf24' }}>
                🌟 The Recommended Smart Leisure Stop
              </p>

              <div className="surface" style={{
                padding: '2rem',
                borderRadius: '16px',
                borderColor: '#f59e0b',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.9))',
                boxShadow: '0 12px 35px rgba(245, 158, 11, 0.15)'
              }}>
                {/* Station & Score Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ background: '#38bdf8', color: '#07111f', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      ⚡ {corridorRec.chargerPowerKw}kW DC Fast Charging Hub
                    </span>
                    <h2 style={{ fontSize: '1.6rem', marginTop: '0.5rem', marginBottom: '0.3rem', color: 'var(--accent-cyan)' }}>
                      {corridorRec.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                      {corridorRec.reason}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '14px',
                    padding: '0.75rem 1.4rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#fbbf24', fontSize: '1.75rem', fontWeight: 800 }}>{corridorRec.score}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Corridor AI Score</div>
                  </div>
                </div>

                {/* Cultural Landmark / Tourist Spot Highlight Section */}
                {corridorRec.touristSpot && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '14px',
                    padding: '1.4rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>🏛️</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fbbf24' }}>
                            {corridorRec.touristSpot.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                            {corridorRec.touristSpot.category} • ⭐ {corridorRec.touristSpot.rating || 4.9} / 5
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(245,158,11,0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: '#fef08a', fontWeight: 600 }}>
                        🚶 {corridorRec.touristSpot.distanceFromStationKm} km walk ({corridorRec.touristSpot.walkingTimeMin} min walk)
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '0.9rem' }}>
                      {corridorRec.touristSpot.description}
                    </p>

                    {/* Time Sync Gauge */}
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      border: '1px dashed rgba(245, 158, 11, 0.4)'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '1.1rem' }}>⚡ ~{corridorRec.estimatedMinutes} mins</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimated Charging Time</div>
                      </div>
                      <div style={{ fontSize: '1.4rem', color: '#fbbf24' }}>↔️</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1rem' }}>🏛️ ~{corridorRec.touristSpot.recommendedTourMinutes} mins</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recommended Tour Time</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#86efac', fontWeight: 600 }}>
                        ✨ {corridorRec.touristSynergyText}
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  {[
                    { icon: '🛣️', label: 'Route Detour', value: `+${corridorRec.detourKm} km` },
                    { icon: '⏱️', label: 'Charging Time', value: `${corridorRec.estimatedMinutes} min` },
                    { icon: '👥', label: 'Queue Length', value: `${corridorRec.queueLength} waiting` },
                    { icon: '💰', label: 'Tariff', value: `₹${corridorRec.pricePerKwh}/kWh` },
                    { icon: '🔋', label: 'Free Bays', value: `${corridorRec.availableChargers} slots` }
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{stat.icon}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>{stat.value}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <button
                  className="btn-primary"
                  type="button"
                  disabled={!corridorRec.slotId}
                  onClick={() => navigate('/booking', { state: { vehicleId, stationId: corridorRec.stationId, slotId: corridorRec.slotId } })}
                  style={{ width: '100%', padding: '15px', fontSize: '1.05rem', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}
                >
                  📅 Reserve Slot & Tour {corridorRec.touristSpot ? corridorRec.touristSpot.name : corridorRec.name}
                </button>
              </div>
            </div>
          )}

          {/* Ranked List of Corridor Stations */}
          {corridorResult.ranked?.length > 1 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>All Candidate Charging Stops Along Route</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {corridorResult.ranked.map((st, i) => (
                  <div key={st.stationId} className="surface" style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: i === 0 ? '#38bdf8' : 'rgba(148,163,184,0.15)',
                        color: i === 0 ? '#07111f' : 'var(--text-muted)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: i === 0 ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Detour: <b>+{st.detourKm} km</b> • {st.chargerPowerKw}kW • ₹{st.pricePerKwh}/kWh • {st.touristSpot ? `🏛️ ${st.touristSpot.name}` : 'Highway stop'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: i === 0 ? '#fbbf24' : 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                          {st.score}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE</div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/booking', { state: { vehicleId, stationId: st.stationId, slotId: st.slotId } })}
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEARBY RESULTS DISPLAY */}
      {activeTab === 'nearby' && nearbyRec && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Recommended Station</p>
            <div className="surface" style={{ padding: '1.75rem', borderColor: 'rgba(73,213,255,0.35)', background: 'rgba(14,31,51,0.95)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--accent-cyan)' }}>
                    ⚡ {nearbyRec.name}
                  </h2>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>{nearbyRec.reason}</p>
                </div>
                <div style={{ background: 'rgba(73,213,255,0.12)', border: '1px solid rgba(73,213,255,0.3)', borderRadius: '12px', padding: '0.6rem 1.1rem', textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '1.5rem', fontWeight: '700' }}>{nearbyRec.score}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '📍', label: 'Distance', value: `${nearbyRec.distanceKm} km` },
                  { icon: '🕐', label: 'Est. Time', value: `${nearbyRec.estimatedMinutes} min` },
                  { icon: '👥', label: 'Queue', value: `${nearbyRec.queueLength} waiting` },
                  { icon: '💰', label: 'Price', value: `₹${nearbyRec.pricePerKwh}/kWh` },
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
                disabled={!nearbyRec.slotId}
                onClick={() => navigate('/booking', { state: { vehicleId, stationId: nearbyRec.stationId, slotId: nearbyRec.slotId } })}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '12px' }}
              >
                📅 Book This Station Now
              </button>
            </div>
          </div>

          {nearbyResult.ranked?.length > 0 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>All Ranked Stations</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {nearbyResult.ranked.map((st, i) => (
                  <div key={st.stationId} className="surface" style={{ padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? 'var(--accent-cyan)' : 'rgba(148,163,184,0.12)', color: i === 0 ? '#07111f' : 'var(--text-muted)', display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>{st.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {st.distanceKm} km • {st.estimatedMinutes} mins • ₹{st.pricePerKwh}/kWh
                      </div>
                    </div>
                    <div style={{ color: i === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: '700', fontSize: '1rem' }}>
                      {st.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
