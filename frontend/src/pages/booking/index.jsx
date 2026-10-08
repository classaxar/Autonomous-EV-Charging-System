import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../../api/client';
import { createBooking } from '../../api/bookingApi';
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
  const [duration, setDuration] = useState('60');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [vehicleResponse, stationList] = await Promise.all([
        client.get('/api/ev'),
        getStations()
      ]);
      const nextVehicles = vehicleResponse.data.data || [];
      const nextStations = stationList;
      setVehicles(nextVehicles);
      setStations(nextStations);

      const chosenStationId = nextStations.some((station) => station.stationId === routeState.stationId)
        ? routeState.stationId
        : nextStations.some((station) => station.stationId === stationId)
          ? stationId
          : nextStations[0]?.stationId || '';
      const selectedStation = nextStations.find((station) => station.stationId === chosenStationId);
      const freeSlots = (selectedStation?.slots || []).filter((slot) => slot.status === 'FREE');
      setVehicleId((current) => nextVehicles.some((vehicle) => vehicle.vehicleId === current)
        ? current
        : routeState.vehicleId || nextVehicles[0]?.vehicleId || '');
      setStationId(chosenStationId);
      setSlotId((current) => {
        if (selectedStation && freeSlots.some((slot) => slot.slotId === current)) return current;
        if (routeState.slotId && freeSlots.some((slot) => slot.slotId === routeState.slotId)) return routeState.slotId;
        return freeSlots[0]?.slotId || '';
      });
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to load vehicles and stations.'));
    } finally {
      setLoading(false);
    }
  }, [routeState.stationId, routeState.slotId, routeState.vehicleId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions, token]);

  const selectedStation = stations.find((station) => station.stationId === stationId);
  const freeSlots = (selectedStation?.slots || []).filter((slot) => slot.status === 'FREE');

  function changeStation(event) {
    const nextStationId = event.target.value;
    const nextStation = stations.find((station) => station.stationId === nextStationId);
    setStationId(nextStationId);
    setSlotId((nextStation?.slots || []).find((slot) => slot.status === 'FREE')?.slotId || '');
    setMessage('');
  }

  async function refreshSlots() {
    if (!stationId) return;
    const nextSlots = await getStationSlots(stationId);
    setStations((current) => current.map((station) => station.stationId === stationId
      ? { ...station, slots: nextSlots }
      : station));
    setSlotId(nextSlots.find((slot) => slot.status === 'FREE')?.slotId || '');
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await createBooking({
        vehicleId,
        stationId,
        slotId,
        startTime: new Date().toISOString(),
        duration: Number(duration)
      });
      setBooking(result);
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to create this booking.'));
      if (error.response?.status === 409) {
        try {
          await refreshSlots();
        } catch (refreshError) {
          setMessage(getErrorMessage(refreshError, 'The slot is unavailable and could not be refreshed.'));
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>Book a charging slot</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Choose your EV, station, and a currently free slot.</p>
      </header>

      {loading ? (
        <p role="status">Loading booking options...</p>
      ) : booking ? (
        <section aria-live="polite" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-green)', borderRadius: '0.75rem', padding: '1.5rem' }}>
          <h2 style={{ color: 'var(--accent-green)', marginBottom: '0.75rem' }}>Booking {booking.status}</h2>
          <p>Booking ID: {booking.bookingId}</p>
          <p>Station: {booking.stationId} · Slot: {booking.slotId}</p>
          <p>Duration: {booking.duration} minutes</p>
        </section>
      ) : (
        <>
          {message && <p role="alert" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>{message}</p>}
          {vehicles.length === 0 ? (
            <p role="status">Add an EV before making a booking.</p>
          ) : stations.length === 0 ? (
            <p role="status">There are no charging stations available.</p>
          ) : (
            <form onSubmit={submit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', display: 'grid', gap: '1rem' }}>
              <label>
                EV
                <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
                  <option value="">Select an EV</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                      {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Station
                <select value={stationId} onChange={changeStation} required>
                  {stations.map((station) => (
                    <option key={station.stationId} value={station.stationId}>
                      {station.name} · {station.pricePerKwh} / kWh
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Charging slot
                <select value={slotId} onChange={(event) => setSlotId(event.target.value)} required disabled={freeSlots.length === 0}>
                  {freeSlots.length === 0 && <option value="">No free slots</option>}
                  {freeSlots.map((slot) => <option key={slot.slotId} value={slot.slotId}>{slot.slotId}</option>)}
                </select>
              </label>
              <label>
                Duration (minutes)
                <input type="number" min="1" step="1" value={duration} onChange={(event) => setDuration(event.target.value)} required />
              </label>
              <button type="submit" disabled={submitting || !slotId}>
                {submitting ? 'Booking...' : 'Confirm booking'}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
