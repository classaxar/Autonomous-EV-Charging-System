import { useCallback, useEffect, useState } from 'react';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from '../../api/evApi';
import { useAuth } from '../../context/AuthContext';

const emptyVehicle = { brand: '', model: '', batteryCapacity: '', currentBattery: '', maxChargingPower: '' };

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function BatteryBar({ pct }) {
  const color = pct <= 20 ? 'var(--accent-red)' : pct <= 50 ? 'var(--accent-amber)' : 'var(--accent-green)';
  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
        <span className="muted">Battery</span>
        <span style={{ color, fontWeight: '700' }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function EVPage() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      setVehicles(await getVehicles());
      setMessage({ text: '', type: '' });
    } catch (error) {
      setMessage({ text: getErrorMessage(error, 'Unable to load your EVs.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadVehicles();
    else { setVehicles([]); setLoading(false); }
  }, [loadVehicles, token]);

  function updateField(e) {
    const { name, value } = e.target;
    setForm((cur) => ({ ...cur, [name]: value }));
  }

  function startEditing(v) {
    setEditingId(v.vehicleId);
    setForm({ brand: v.brand, model: v.model, batteryCapacity: String(v.batteryCapacity), currentBattery: String(v.currentBattery), maxChargingPower: String(v.maxChargingPower) });
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function stopEditing() { setEditingId(''); setForm(emptyVehicle); setMessage({ text: '', type: '' }); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    const payload = { brand: form.brand.trim(), model: form.model.trim(), batteryCapacity: Number(form.batteryCapacity), currentBattery: Number(form.currentBattery), maxChargingPower: Number(form.maxChargingPower) };
    try {
      if (editingId) await updateVehicle(editingId, payload);
      else await createVehicle(payload);
      setMessage({ text: editingId ? 'Vehicle updated successfully.' : 'Vehicle added successfully.', type: 'success' });
      stopEditing();
      await loadVehicles();
    } catch (error) {
      setMessage({ text: getErrorMessage(error, 'Unable to save this EV.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function removeVehicle(vehicleId) {
    if (!window.confirm('Delete this EV? This cannot be undone.')) return;
    setMessage({ text: '', type: '' });
    try {
      await deleteVehicle(vehicleId);
      if (editingId === vehicleId) stopEditing();
      await loadVehicles();
    } catch (error) {
      setMessage({ text: getErrorMessage(error, 'Unable to delete this EV.'), type: 'error' });
    }
  }

  const msgStyle = (type) => ({
    background: type === 'error' ? 'rgba(251,113,133,0.1)' : 'rgba(53,211,153,0.1)',
    border: `1px solid ${type === 'error' ? 'rgba(251,113,133,0.3)' : 'rgba(53,211,153,0.3)'}`,
    color: type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)',
    borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '1.25rem',
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p className="eyebrow">Fleet Management</p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.4rem', marginBottom: '0.5rem' }}>My Vehicles</h1>
        <p className="muted" style={{ fontSize: '0.95rem' }}>Add and manage electric vehicles linked to your account.</p>
      </div>

      {!token ? (
        <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
          <p className="muted">Sign in to manage your EVs.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Vehicle List */}
          <div>
            {message.text && <div style={msgStyle(message.type)}>{message.type === 'error' ? '⚠️' : '✅'} {message.text}</div>}

            {loading ? (
              <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚡</div>
                <p className="muted">Loading your vehicles…</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No vehicles yet</h3>
                <p className="muted" style={{ fontSize: '0.9rem' }}>Add your first EV using the form →</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {vehicles.map((v) => (
                  <div key={v.vehicleId} className="surface" style={{ padding: '1.5rem', borderColor: editingId === v.vehicleId ? 'rgba(73,213,255,0.4)' : 'var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{v.brand} {v.model}</h2>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          <span className="muted" style={{ fontSize: '0.82rem' }}>🔋 {v.batteryCapacity} kWh</span>
                          <span className="muted" style={{ fontSize: '0.82rem' }}>⚡ {v.maxChargingPower} kW max</span>
                          <span style={{ fontSize: '0.78rem', background: 'rgba(73,213,255,0.1)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '99px', fontFamily: 'monospace' }}>{v.vehicleId}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" type="button" onClick={() => startEditing(v)} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>✏️ Edit</button>
                        <button type="button" onClick={() => removeVehicle(v.vehicleId)} style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '10px', border: '1px solid rgba(251,113,133,0.3)', background: 'transparent', color: 'var(--accent-red)', cursor: 'pointer' }}>🗑️ Delete</button>
                      </div>
                    </div>
                    <BatteryBar pct={v.currentBattery} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="surface" style={{ padding: '1.75rem', position: 'sticky', top: '92px', borderColor: editingId ? 'rgba(73,213,255,0.35)' : 'var(--border-color)' }}>
            <h2 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>
              {editingId ? '✏️ Edit Vehicle' : '➕ Add a Vehicle'}
            </h2>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { name: 'brand', label: 'Brand', placeholder: 'e.g. Tata', maxLength: 80 },
                { name: 'model', label: 'Model', placeholder: 'e.g. Nexon EV', maxLength: 80 },
              ].map((field) => (
                <div key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <input className="form-input" name={field.name} value={form[field.name]} onChange={updateField} required maxLength={field.maxLength} placeholder={field.placeholder} />
                </div>
              ))}
              {[
                { name: 'batteryCapacity', label: 'Battery Capacity (kWh)', min: 0.1, placeholder: 'e.g. 40.5' },
                { name: 'currentBattery', label: 'Current Battery (%)', min: 0, max: 100, placeholder: '0–100' },
                { name: 'maxChargingPower', label: 'Max Charging Power (kW)', min: 0.1, placeholder: 'e.g. 50' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="form-label">{field.label}</label>
                  <input className="form-input" name={field.name} type="number" min={field.min} max={field.max} step="any" value={form[field.name]} onChange={updateField} required placeholder={field.placeholder} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn-primary" type="submit" disabled={saving} style={{ flex: 1, padding: '12px' }}>
                  {saving ? '⏳ Saving…' : editingId ? '💾 Save Changes' : '➕ Add Vehicle'}
                </button>
                {editingId && (
                  <button className="btn-secondary" type="button" onClick={stopEditing} disabled={saving} style={{ padding: '12px 14px' }}>✕</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
