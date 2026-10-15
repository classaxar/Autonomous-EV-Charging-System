import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVehicles } from '../../api/evApi';
import { recommendChargingStation } from '../../api/decisionApi';

const defaultLocation = { latitude: 23.21, longitude: 72.63 };

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [evs, setEvs] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [targetBattery, setTargetBattery] = useState(80);
  const [location, setLocation] = useState(defaultLocation);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getVehicles()
      .then((data) => {
        setEvs(data);
        if (data[0]) setVehicleId(data[0].vehicleId);
      })
      .catch((error) => setMessage(error.response?.data?.message || error.message || 'Unable to load EVs.'));
  }, []);

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setMessage('Browser geolocation is unavailable; using the default location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setMessage('Unable to read browser location; using the default location.')
    );
  }

  async function submit(event) {
    event.preventDefault();
    const ev = evs.find((item) => item.vehicleId === vehicleId);
    if (!ev) {
      setMessage('Select an EV before requesting a recommendation.');
      return;
    }
    try {
      setMessage('');
      setResult(await recommendChargingStation({
        vehicleId,
        currentBattery: ev.currentBattery,
        targetBattery: Number(targetBattery),
        batteryCapacity: ev.batteryCapacity,
        maxChargingPower: ev.maxChargingPower,
        location
      }));
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to get a recommendation.');
    }
  }

  return (
    <main>
      <h1>Find the best charger</h1>
      <form onSubmit={submit}>
        <label>EV
          <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} required>
            <option value="">Select an EV</option>
            {evs.map((ev) => <option key={ev.vehicleId} value={ev.vehicleId}>{ev.brand} {ev.model}</option>)}
          </select>
        </label>
        <label>Target battery (%)
          <input type="number" min="0" max="100" value={targetBattery} onChange={(event) => setTargetBattery(event.target.value)} />
        </label>
        <button type="button" onClick={useBrowserLocation}>Use my location</button>
        <button type="submit">Recommend</button>
      </form>
      {message && <p role="alert">{message}</p>}
      {result?.recommended && (
        <section>
          <h2>{result.recommended.name}</h2>
          <p>{result.recommended.reason}</p>
          <p>Distance: {result.recommended.distanceKm} km | Queue: {result.recommended.queueLength}</p>
          <p>Price: {result.recommended.pricePerKwh} / kWh | Estimated time: {result.recommended.estimatedMinutes} minutes</p>
          <button type="button" disabled={!result.recommended.slotId} onClick={() => navigate('/booking', {
            state: { vehicleId, stationId: result.recommended.stationId, slotId: result.recommended.slotId }
          })}>Book Now</button>
          <h3>Ranked stations</h3>
          <ol>{result.ranked.map((station) => <li key={station.stationId}>{station.name}: {station.score}</li>)}</ol>
        </section>
      )}
    </main>
  );
}
