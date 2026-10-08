jest.mock('axios', () => jest.fn());
jest.mock('../models/Booking', () => ({
  create: jest.fn(),
  findOne: jest.fn()
}));

const axios = require('axios');
const Booking = require('../models/Booking');
const mockStationClient = require('../mocks/stationClient');
const { createBooking, cancelBooking } = require('../controllers/bookingController');

function createResponse() {
  const response = {};
  response.status = jest.fn(() => response);
  response.json = jest.fn(() => response);
  return response;
}

function createRequest(stationId, slotId) {
  return {
    body: {
      vehicleId: 'EV101',
      stationId,
      slotId,
      startTime: '2026-10-09T12:00:00.000Z',
      duration: 60
    },
    headers: { authorization: 'Bearer test-token' },
    params: {},
    user: { userId: 'U101', role: 'USER' }
  };
}

describe('booking flow', () => {
  const originalUseMock = process.env.USE_MOCK;

  beforeEach(() => {
    process.env.USE_MOCK = 'true';
    axios.mockReset();
    axios.mockResolvedValue({ data: { success: true } });
    Booking.create.mockReset();
    Booking.findOne.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalUseMock === undefined) {
      delete process.env.USE_MOCK;
    } else {
      process.env.USE_MOCK = originalUseMock;
    }
    jest.restoreAllMocks();
  });

  test('creates a confirmed booking and reserves its free slot', async () => {
    const booking = {
      bookingId: 'B1001',
      userId: 'U101',
      vehicleId: 'EV101',
      stationId: 'ST201',
      slotId: 'S01',
      status: 'CONFIRMED'
    };
    Booking.create.mockResolvedValue(booking);
    const response = createResponse();

    await createBooking(createRequest('ST201', 'S01'), response);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(Booking.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'U101',
      stationId: 'ST201',
      slotId: 'S01',
      status: 'CONFIRMED'
    }));
    await expect(mockStationClient.getSlot('ST201', 'S01')).resolves.toEqual({
      slotId: 'S01',
      status: 'BOOKED'
    });
  });

  test('rejects a second booking for a reserved slot with 409', async () => {
    Booking.create.mockResolvedValue({ bookingId: 'B1002', status: 'CONFIRMED' });
    const firstResponse = createResponse();
    await createBooking(createRequest('ST202', 'S02'), firstResponse);

    const secondResponse = createResponse();
    await createBooking(createRequest('ST202', 'S02'), secondResponse);

    expect(secondResponse.status).toHaveBeenCalledWith(409);
    expect(Booking.create).toHaveBeenCalledTimes(1);
  });

  test('cancelling a booking frees its slot', async () => {
    const booking = {
      bookingId: 'B1003',
      userId: 'U101',
      stationId: 'ST203',
      slotId: 'S03',
      status: 'CONFIRMED',
      save: jest.fn().mockResolvedValue(undefined)
    };
    await mockStationClient.updateSlot('ST203', 'S03', 'BOOKED');
    Booking.findOne.mockResolvedValue(booking);
    const request = createRequest('ST203', 'S03');
    request.params.id = 'B1003';
    const response = createResponse();

    await cancelBooking(request, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(booking.status).toBe('CANCELLED');
    await expect(mockStationClient.getSlot('ST203', 'S03')).resolves.toEqual({
      slotId: 'S03',
      status: 'FREE'
    });
  });
});
