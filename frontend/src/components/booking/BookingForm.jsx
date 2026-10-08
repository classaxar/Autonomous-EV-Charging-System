import { useMemo } from 'react';

export default function BookingForm({
  vehicles = [],
  stations = [],
  selectedVehicleId,
  selectedStationId,
  selectedSlotId,
  duration,
  onSubmit,
  onVehicleChange,
  onStationChange,
  onSlotChange,
  onDurationChange,
  submitting
}) {
  const selectedStation = useMemo(
    () => stations.find((station) => station.stationId === selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Vehicle</label>
        <select value={selectedVehicleId || ''} onChange={onVehicleChange} required>
          <option value="">Select an EV</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
              {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Station</label>
        <select value={selectedStation?.stationId || ''} onChange={onStationChange} required>
          {!stations.length && <option value="">No stations available</option>}
          {stations.map((station) => (
            <option key={station.stationId} value={station.stationId}>
              {station.name} ({station.pricePerKwh}/kWh)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Slot</label>
        <select value={selectedSlotId || ''} onChange={onSlotChange} required>
          {!((selectedStation?.slots || []).some((slot) => slot.status === 'FREE')) && (
            <option value="">No free slots available</option>
          )}
          {(selectedStation?.slots || []).filter((slot) => slot.status === 'FREE').map((slot) => (
            <option key={slot.slotId} value={slot.slotId}>
              {slot.slotId}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Duration (minutes)</label>
        <input type="number" min="1" value={duration} onChange={onDurationChange} required />
      </div>

      <button type="submit" disabled={submitting || !vehicles.length || !stations.length || !selectedSlotId}>
        {submitting ? 'Booking...' : 'Confirm booking'}
      </button>
    </form>
  );
}
