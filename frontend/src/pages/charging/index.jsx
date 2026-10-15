import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChargingSession, stopCharging } from '../../api/chargingApi';

export default function ChargingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const next = await getChargingSession(id);
        if (!active) return;
        setSession(next);
        if (next.status === 'COMPLETED') navigate(`/payment?sessionId=${next.sessionId}`);
      } catch (error) {
        if (active) setMessage(error.response?.data?.message || 'Unable to load charging session.');
      }
    }
    poll();
    const timer = setInterval(poll, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [id, navigate]);

  async function stop() {
    setStopping(true);
    try {
      setSession(await stopCharging(id));
      navigate(`/payment?sessionId=${id}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to stop charging.');
      setStopping(false);
    }
  }

  if (!session) return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.2s ease-in-out infinite' }}>🔋</div>
        <h2 style={{ marginBottom: '0.5rem' }}>Connecting to session…</h2>
        <p className="muted" style={{ fontSize: '0.9rem' }}>Session ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{id}</span></p>
        {message && <p style={{ color: 'var(--accent-red)', marginTop: '1rem', fontSize: '0.9rem' }}>⚠️ {message}</p>}
      </div>
    </div>
  );

  const start = Number(session.startBattery || 0);
  const current = Number(session.currentBattery || start);
  const target = Number(session.targetBattery || 100);
  const progress = target > start ? Math.min(100, Math.max(0, ((current - start) / (target - start)) * 100)) : 100;
  const batteryColor = current <= 20 ? 'var(--accent-red)' : current <= 50 ? 'var(--accent-amber)' : 'var(--accent-green)';
  const isActive = session.status === 'ACTIVE';

  return (
    <div className="page-container" style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Live Session</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>Live Charging</h1>
          {isActive && (
            <span style={{ background: 'rgba(53,211,153,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(53,211,153,0.4)', borderRadius: '99px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em' }}>
              ● ACTIVE
            </span>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          ⚠️ {message}
        </div>
      )}

      {/* Battery Gauge Card */}
      <div className="surface" style={{ padding: '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Battery Level</div>

        {/* Big Battery % */}
        <div style={{ fontSize: 'clamp(4rem, 12vw, 6rem)', fontWeight: '700', color: batteryColor, lineHeight: 1, marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
          {current.toFixed(1)}<span style={{ fontSize: '2rem' }}>%</span>
        </div>
        <div className="muted" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>Target: {target}%</div>

        {/* Progress Bar */}
        <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.6rem' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${batteryColor} 0%, rgba(255,255,255,0.8) 100%)`, borderRadius: '99px', transition: 'width 0.8s ease', boxShadow: `0 0 12px ${batteryColor}55` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{start}% start</span><span>{progress.toFixed(0)}% complete</span><span>{target}% target</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: '⚡', label: 'Energy', value: `${Number(session.energyConsumed || 0).toFixed(2)} kWh` },
          { icon: '⏱️', label: 'Elapsed', value: `${Number(session.duration || 0).toFixed(1)} min` },
          { icon: '🆔', label: 'Session ID', value: session.sessionId?.slice(-6) || '—', mono: true },
        ].map((stat) => (
          <div key={stat.label} className="surface" style={{ padding: '1.1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>{stat.icon}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', fontFamily: stat.mono ? 'monospace' : 'inherit', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{stat.value}</div>
            <div className="muted" style={{ fontSize: '0.72rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Stop Button */}
      {isActive && (
        <button
          type="button"
          onClick={stop}
          disabled={stopping}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(251,113,133,0.4)', background: 'rgba(251,113,133,0.1)', color: 'var(--accent-red)', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.1)'; }}
        >
          {stopping ? '⏳ Stopping session…' : '🛑 Stop Charging'}
        </button>
      )}
    </div>
  );
}
