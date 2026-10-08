import { useEffect, useState } from 'react';

export default function VehicleForm({ initialValues = {}, onSubmit, submitting }) {
  const [form, setForm] = useState({
    brand: initialValues.brand || '',
    model: initialValues.model || '',
    batteryCapacity: initialValues.batteryCapacity || 60,
    currentBattery: initialValues.currentBattery || 20,
    maxChargingPower: initialValues.maxChargingPower || 11
  });

  useEffect(() => {
    setForm({
      brand: initialValues.brand || '',
      model: initialValues.model || '',
      batteryCapacity: initialValues.batteryCapacity ?? 60,
      currentBattery: initialValues.currentBattery ?? 20,
      maxChargingPower: initialValues.maxChargingPower ?? 11
    });
  }, [initialValues]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      batteryCapacity: Number(form.batteryCapacity),
      currentBattery: Number(form.currentBattery),
      maxChargingPower: Number(form.maxChargingPower)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Brand</label>
        <input value={form.brand} onChange={updateField('brand')} required />
      </div>
      <div>
        <label>Model</label>
        <input value={form.model} onChange={updateField('model')} required />
      </div>
      <div>
        <label>Battery Capacity (kWh)</label>
        <input type="number" min="0.1" step="any" value={form.batteryCapacity} onChange={updateField('batteryCapacity')} required />
      </div>
      <div>
        <label>Current Battery (%)</label>
        <input type="number" min="0" max="100" value={form.currentBattery} onChange={updateField('currentBattery')} required />
      </div>
      <div>
        <label>Max Charging Power (kW)</label>
        <input type="number" min="0.1" step="any" value={form.maxChargingPower} onChange={updateField('maxChargingPower')} required />
      </div>
      <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save vehicle'}</button>
    </form>
  );
}
