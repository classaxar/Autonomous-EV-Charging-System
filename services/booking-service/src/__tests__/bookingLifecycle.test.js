jest.mock('axios', () => jest.fn());
jest.mock('../models/Booking', () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

const axios = require('axios');
const Booking = require('../models/Booking');
const { expireBookings } = require('../services/expiryJob');

describe('booking expiry lifecycle', () => {
  beforeEach(() => {
    process.env.EXPIRY_MINUTES = '15';
    process.env.STATION_SERVICE_URL = 'http://station-service:5003';
    process.env.INTERNAL_KEY = 'test-key';
    axios.mockResolvedValue({ data: { success: true } });
    Booking.find.mockReset();
    Booking.findOneAndUpdate.mockReset();
  });

  test('expires stale confirmed bookings and releases resources', async () => {
    Booking.find.mockResolvedValue([{
      bookingId: 'B1001',
      stationId: 'ST101',
      slotId: 'S01'
    }]);
    Booking.findOneAndUpdate.mockResolvedValue({
      bookingId: 'B1001',
      stationId: 'ST101',
      slotId: 'S01',
      status: 'EXPIRED'
    });

    const expired = await expireBookings(new Date('2026-10-13T12:00:00.000Z'));

    expect(expired).toBe(1);
    expect(Booking.find).toHaveBeenCalledWith({
      status: 'CONFIRMED',
      startTime: { $lte: '2026-10-13T11:45:00.000Z' }
    });
    expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
      { bookingId: 'B1001', status: 'CONFIRMED' },
      { $set: { status: 'EXPIRED' } },
      { new: true }
    );
    expect(axios).toHaveBeenCalledTimes(2);
    expect(axios.mock.calls[0][0].data).toEqual({ status: 'FREE' });
    expect(axios.mock.calls[1][0].data).toEqual({ delta: -1 });
  });
});
