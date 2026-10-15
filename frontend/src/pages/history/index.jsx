import { useCallback, useEffect, useState } from 'react';
import { cancelBooking, getBookings } from '../../api/bookingApi';
import client from '../../api/client';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function mergeHistory(bookings, sessions, payments) {
  const sessionsByBooking = new Map(sessions.map((session) => [session.bookingId, session]));
  const paymentsBySession = new Map(payments.map((payment) => [payment.sessionId, payment]));

  return bookings.map((booking) => {
    const session = sessionsByBooking.get(booking.bookingId);
    const payment = session ? paymentsBySession.get(session.sessionId) : undefined;
    return {
      id: booking.bookingId,
      date: session?.createdAt || booking.startTime || booking.createdAt,
      stationId: booking.stationId || session?.stationId,
      energy: session?.energyConsumed ?? session?.energyKwh,
      amount: payment?.amount,
      status: payment?.status || session?.status || booking.status,
      booking
    };
  });
}

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionId, setActionId] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [bookingsResponse, sessionsResponse, paymentsResponse] = await Promise.all([
        getBookings(),
        client.get('/api/charging/history'),
        client.get('/api/payments')
      ]);
      setRows(mergeHistory(
        bookingsResponse,
        sessionsResponse.data.data || [],
        paymentsResponse.data.data || []
      ));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to load activity history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleCancel(bookingId) {
    setActionId(bookingId);
    setErrorMessage('');
    try {
      await cancelBooking(bookingId);
      await loadHistory();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to cancel this booking.'));
    } finally {
      setActionId('');
    }
  }

  if (loading) return <main><p>Loading activity history...</p></main>;

  return (
    <main style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Activity & Charging History</h1>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {!errorMessage && rows.length === 0 && <p>No bookings or charging sessions found.</p>}
      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Booking</th>
                <th>Station</th>
                <th>Energy (kWh)</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const canCancel = ['PENDING', 'CONFIRMED'].includes(row.booking.status);
                return (
                  <tr key={row.id}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.id}</td>
                    <td>{row.stationId || '—'}</td>
                    <td>{row.energy ?? '—'}</td>
                    <td>{row.amount == null ? '—' : Number(row.amount).toFixed(2)}</td>
                    <td>{row.status || '—'}</td>
                    <td>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancel(row.id)}
                          disabled={actionId === row.id}
                        >
                          {actionId === row.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
