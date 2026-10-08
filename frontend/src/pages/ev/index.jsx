import { useCallback, useEffect, useState } from 'react';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from '../../api/evApi';
import { useAuth } from '../../context/AuthContext';

const emptyVehicle = {
  brand: '',
  model: '',
  batteryCapacity: '',
  currentBattery: '',
  maxChargingPower: ''
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '0.75rem',
  padding: '1.25rem'
};

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function EVPage() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      setVehicles(await getVehicles());
      setMessage('');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to load your EVs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles, token]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEditing(vehicle) {
    setEditingId(vehicle.vehicleId);
    setForm({
      brand: vehicle.brand,
      model: vehicle.model,
      batteryCapacity: String(vehicle.batteryCapacity),
      currentBattery: String(vehicle.currentBattery),
      maxChargingPower: String(vehicle.maxChargingPower)
    });
    setMessage('');
  }

  function stopEditing() {
    setEditingId('');
    setForm(emptyVehicle);
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      batteryCapacity: Number(form.batteryCapacity),
      currentBattery: Number(form.currentBattery),
      maxChargingPower: Number(form.maxChargingPower)
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(payload);
      }
      stopEditing();
      await loadVehicles();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to save this EV.'));
    } finally {
      setSaving(false);
    }
  }

  async function removeVehicle(vehicleId) {
    if (!window.confirm('Delete this EV?')) return;

    setMessage('');
    try {
      await deleteVehicle(vehicleId);
      if (editingId === vehicleId) stopEditing();
      await loadVehicles();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to delete this EV.'));
    }
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>EV Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Add and manage the electric vehicles linked to your account.</p>
      </header>

      <form onSubmit={submit} style={{ ...cardStyle, display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>{editingId ? 'Edit EV' : 'Add an EV'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
          <label>
            Brand
            <input name="brand" value={form.brand} onChange={updateField} required maxLength={80} />
          </label>
          <label>
            Model
            <input name="model" value={form.model} onChange={updateField} required maxLength={80} />
          </label>
          <label>
            Battery capacity (kWh)
            <input name="batteryCapacity" type="number" min="0.1" step="any" value={form.batteryCapacity} onChange={updateField} required />
          </label>
          <label>
            Current battery (%)
            <input name="currentBattery" type="number" min="0" max="100" step="any" value={form.currentBattery} onChange={updateField} required />
          </label>
          <label>
            Max charging power (kW)
            <input name="maxChargingPower" type="number" min="0.1" step="any" value={form.maxChargingPower} onChange={updateField} required />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add EV'}</button>
          {editingId && <button type="button" onClick={stopEditing} disabled={saving}>Cancel</button>}
        </div>
      </form>

      {message && <p role="alert" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>{message}</p>}
      {loading ? (
        <p role="status">Loading EVs...</p>
      ) : vehicles.length === 0 ? (
        <p style={{ ...cardStyle, color: 'var(--text-secondary)' }}>No EVs yet. Add one above to get started.</p>
      ) : (
        <ul style={{ display: 'grid', gap: '1rem', listStyle: 'none' }}>
          {vehicles.map((vehicle) => (
            <li key={vehicle.vehicleId} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{vehicle.brand} {vehicle.model}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {vehicle.batteryCapacity} kWh battery · {vehicle.maxChargingPower} kW max charging
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <button type="button" onClick={() => startEditing(vehicle)}>Edit</button>
                  <button type="button" onClick={() => removeVehicle(vehicle.vehicleId)}>Delete</button>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span>Battery</span><span>{vehicle.currentBattery}%</span>
                </div>
                <progress value={vehicle.currentBattery} max="100" style={{ width: '100%' }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
import { useEffect, useState } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../api/evApi';
import VehicleForm from '../../components/ev/VehicleForm';

export default function EVPage() {
  const [vehicles, setVehicles] = useState([]);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token') || '';

  const loadVehicles = async () => {
    if (!token) {
      setMessage('Sign in to manage your EVs.');
      setLoading(false);
      return;
    }

    try {
      setMessage('');
      setVehicles(await getVehicles(token));
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to load EVs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [token]);

  const handleCreateOrUpdate = async (payload) => {
    setSubmitting(true);
    setMessage('');
    try {
      if (editingVehicleId) {
        await updateVehicle(token, editingVehicleId, payload);
      } else {
        await createVehicle(token, payload);
      }
      setEditingVehicleId(null);
      await loadVehicles();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to save EV.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    setMessage('');
    try {
      await deleteVehicle(token, vehicleId);
      if (editingVehicleId === vehicleId) {
        setEditingVehicleId(null);
      }
      await loadVehicles();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to delete EV.');
    }
  };

  return (
    <div>
      <h2>EV Management</h2>
      <VehicleForm
        initialValues={vehicles.find((vehicle) => vehicle.vehicleId === editingVehicleId) || {}}
        onSubmit={handleCreateOrUpdate}
        submitting={submitting}
      />

      {message && <p role="alert">{message}</p>}
      {loading && <p>Loading EVs...</p>}
      {!loading && !message && vehicles.length === 0 && <p>No EVs yet. Add one above to get started.</p>}
      <ul>
        {vehicles.map((vehicle) => (
          <li key={vehicle.vehicleId}>
            <strong>{vehicle.brand} {vehicle.model}</strong> - {vehicle.currentBattery}% battery, {vehicle.maxChargingPower}kW
            <button type="button" onClick={() => setEditingVehicleId(vehicle.vehicleId)}>Edit</button>
            <button type="button" onClick={() => handleDelete(vehicle.vehicleId)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
