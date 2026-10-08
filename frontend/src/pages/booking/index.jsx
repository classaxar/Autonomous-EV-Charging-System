import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getVehicles } from '../../api/evApi';
import { getStations, getStationSlots } from '../../api/stationApi';
import { createBooking } from '../../api/bookingApi';
import BookingForm from '../../components/booking/BookingForm';

export default function BookingPage() {
  const location = useLocation();
  const bookingInfo = location.state || {};
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(bookingInfo.vehicleId || '');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [duration, setDuration] = useState(60);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    let active = true;

    const loadBookingOptions = async () => {
      if (!token) {
        setMessage('Sign in to create a booking.');
        setLoading(false);
        return;
      }

      try {
        setMessage('');
        const [vehicleList, stationList] = await Promise.all([
          getVehicles(token),
          getStations(token)
        ]);
        if (!active) return;

        setVehicles(vehicleList);
        setStations(stationList);
        const nextStationId = bookingInfo.stationId || stationList[0]?.stationId || '';
        setSelectedStationId(nextStationId);
        setSelectedVehicleId((current) =>
          vehicleList.some((vehicle) => vehicle.vehicleId === current)
            ? current
            : vehicleList[0]?.vehicleId || ''
        );
        const selectedStation = stationList.find((station) => station.stationId === nextStationId);
        const freeSlots = (selectedStation?.slots || []).filter((slot) => slot.status === 'FREE');
        const prefilledSlot = freeSlots.find((slot) => slot.slotId === bookingInfo.slotId);
        setSelectedSlotId(prefilledSlot?.slotId || freeSlots[0]?.slotId || '');
      } catch (error) {
        if (active) {
          setMessage(error.response?.data?.message || error.message || 'Unable to load booking options.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBookingOptions();
    return () => {
      active = false;
    };
  }, [token, bookingInfo.stationId, bookingInfo.slotId]);

  const handleStationChange = (event) => {
    const nextStationId = event.target.value;
    setSelectedStationId(nextStationId);
    const station = stations.find((item) => item.stationId === nextStationId);
    setSelectedSlotId((station?.slots || []).find((slot) => slot.status === 'FREE')?.slotId || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const result = await createBooking(token, {
        vehicleId: selectedVehicleId,
        stationId: selectedStationId,
        slotId: selectedSlotId,
        startTime: new Date().toISOString(),
        duration: Number(duration)
      });
      setBooking(result);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to create booking.');
      if (error.response?.status === 409) {
        try {
          const slots = await getStationSlots(token, selectedStationId);
          const updatedStation = stations.find((station) => station.stationId === selectedStationId);
          if (updatedStation) {
            const nextStations = stations.map((station) =>
              station.stationId === selectedStationId
                ? { ...station, slots }
                : station
            );
            setStations(nextStations);
            setSelectedSlotId(slots.find((slot) => slot.status === 'FREE')?.slotId || '');
          }
        } catch (refreshError) {
          setMessage(refreshError.response?.data?.message || refreshError.message || 'Unable to refresh available slots.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Booking</h2>
      {loading && <p>Loading booking options...</p>}
      {!loading && message && <p role="alert">{message}</p>}
      {!loading && booking && (
        <section aria-live="polite">
          <h3>Booking confirmed</h3>
          <p>{booking.bookingId} — {booking.status}</p>
          <p>{booking.stationId} / {booking.slotId}</p>
        </section>
      )}
      {!loading && !booking && (
        <BookingForm
          vehicles={vehicles}
          stations={stations}
          selectedVehicleId={selectedVehicleId}
          selectedStationId={selectedStationId}
          selectedSlotId={selectedSlotId}
          duration={duration}
          submitting={submitting}
          onSubmit={handleSubmit}
          onVehicleChange={(event) => setSelectedVehicleId(event.target.value)}
          onStationChange={handleStationChange}
          onSlotChange={(event) => setSelectedSlotId(event.target.value)}
          onDurationChange={(event) => setDuration(event.target.value)}
        />
      )}
    </div>
  );
}
