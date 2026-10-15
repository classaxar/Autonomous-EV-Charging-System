import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createBooking } from '../../api/bookingApi';
import { getVehicles } from '../../api/evApi';
import { getStationSlots, getStations } from '../../api/stationApi';
import { useAuth } from '../../context/AuthContext';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function BookingPage() {
  const location = useLocation();
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
  const [message, setMessage] = useState('');

  const loadOptions = useCallback(async () => {
    if (!token) {
      setMessage('Sign in to create a booking.');
      setLoading(false);
      return;
    }
    try {
      const [nextVehicles, nextStations] = await Promise.all([getVehicles(), getStations()]);
      setVehicles(nextVehicles);
      setStations(nextStations);
      const chosenStationId = nextStations.some((station) => station.stationId === routeState.stationId)
        ? routeState.stationId : nextStations[0]?.stationId || '';
      const selectedStation = nextStations.find((station) => station.stationId === chosenStationId);
      const freeSlots = (selectedStation?.slots || []).filter((slot) => slot.status === 'FREE');
      setVehicleId((current) => nextVehicles.some((vehicle) => vehicle.vehicleId === current)
        ? current : nextVehicles[0]?.vehicleId || '');
      setStationId(chosenStationId);
      setSlotId(freeSlots.some((slot) => slot.slotId === routeState.slotId)
        ? routeState.slotId : freeSlots[0]?.slotId || '');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to load vehicles and stations.'));
    } finally {
      setLoading(false);
    }
  }, [routeState.stationId, routeState.slotId, token]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedStation = stations.find((station) => station.stationId === stationId);
  const freeSlots = (selectedStation?.slots || []).filter((slot) => slot.status === 'FREE');

  function changeStation(event) {
    const nextStationId = event.target.value;
    const nextStation = stations.find((station) => station.stationId === nextStationId);
    setStationId(nextStationId);
    setSlotId((nextStation?.slots || []).find((slot) => slot.status === 'FREE')?.slotId || '');
  }

  async function refreshSlots() {
    if (!stationId) return;
    try {
      const nextSlots = await getStationSlots(stationId);
      setStations((current) => current.map((station) => station.stationId === stationId ? { ...station, slots: nextSlots } : station));
      setSlotId(nextSlots.find((slot) => slot.status === 'FREE')?.slotId || '');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to refresh station slots.'));
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (!vehicleId || !stationId || !slotId) {
      setMessage('Select an EV, station, and free slot before booking.');
      return;
    }
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 1440) {
      setMessage('Duration must be a whole number between 1 and 1440 minutes.');
      return;
    }
    try {
      setBooking(await createBooking({
        vehicleId, stationId, slotId, startTime: new Date().toISOString(), duration: Number(duration)
      }));
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to create this booking.'));
      if (error.response?.status === 409) await refreshSlots();
    }
  }

  if (loading) return <main><p>Loading booking options...</p></main>;
  if (booking) return <main><h1>Booking confirmed</h1><p>Booking {booking.bookingId} is {booking.status}.</p></main>;

  if (!vehicles.length || !stations.length) {
    return (
      <main>
        <h1>Book a charging slot</h1>
        {message && <p role="alert">{message}</p>}
        {!vehicles.length && <p role="status">Add an EV before creating a booking.</p>}
        {!stations.length && <p role="status">No charging stations are currently available.</p>}
      </main>
    );
  }

  return (
    <main>
      <h1>Book a charging slot</h1>
      {message && <p role="alert">{message}</p>}
      <form onSubmit={submit}>
        <label>EV
          <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
            <option value="">Select an EV</option>
            {vehicles.map((vehicle) => <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.brand} {vehicle.model}</option>)}
          </select>
        </label>
        <label>Station
          <select value={stationId} onChange={changeStation} required>
            <option value="">Select a station</option>
            {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
          </select>
        </label>
        <label>Slot
          <select value={slotId} onChange={(event) => setSlotId(event.target.value)} required>
            <option value="">Select a free slot</option>
            {freeSlots.map((slot) => <option key={slot.slotId} value={slot.slotId}>{slot.slotId}</option>)}
          </select>
        </label>
        <label>Duration (minutes)<input type="number" min="1" max="1440" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} required /></label>
        <div>
          <h2>Station slots</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem' }}>
            {(selectedStation?.slots || []).map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                disabled={slot.status !== 'FREE'}
                onClick={() => setSlotId(slot.slotId)}
                style={{ border: slot.slotId === slotId ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)' }}
                aria-label={`${slot.slotId} ${slot.status}`}
              >
                {slot.slotId}<br />{slot.status}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={!vehicleId || !stationId || !slotId || !freeSlots.length}>Confirm booking</button>
      </form>
    </main>
  );
}
