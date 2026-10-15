import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChargingSession, stopCharging } from '../../api/chargingApi';

export default function ChargingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');

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
    try { setSession(await stopCharging(id)); navigate(`/payment?sessionId=${id}`); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to stop charging.'); }
  }

  if (!session) return <main><p>Loading charging session...</p>{message && <p role="alert">{message}</p>}</main>;
  const start = Number(session.startBattery || 0);
  const current = Number(session.currentBattery || start);
  const target = Number(session.targetBattery || 100);
  const progress = target > start ? ((current - start) / (target - start)) * 100 : 100;
  return <main>
    <h1>Live Charging</h1>
    {message && <p role="alert">{message}</p>}
    <p>{current.toFixed(1)}% / {target}%</p>
    <progress value={Math.max(0, Math.min(100, progress))} max="100" style={{ width: '100%' }} />
    <p>Energy: {Number(session.energyConsumed || 0).toFixed(2)} kWh</p>
    <p>Elapsed: {Number(session.duration || 0).toFixed(1)} minutes</p>
    {session.status !== 'COMPLETED' && <button type="button" onClick={stop}>Stop charging</button>}
  </main>;
}
