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
