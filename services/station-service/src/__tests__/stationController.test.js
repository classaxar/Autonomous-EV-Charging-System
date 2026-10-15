jest.mock('../models/Station', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

const Station = require('../models/Station');
const { listStations, updateSlotStatus } = require('../controllers/stationController');

describe('station controller', () => {
  test('derives available chargers from slots for stale station records', async () => {
    const station = {
      availableChargers: 0,
      slots: [
        { slotId: 'S01', status: 'FREE' },
        { slotId: 'S02', status: 'BOOKED' },
        { slotId: 'S03', status: 'FREE' }
      ],
      toObject() {
        return {
          stationId: 'ST101',
          availableChargers: this.availableChargers,
          queueLength: 0,
          slots: this.slots
        };
      }
    };
    const json = jest.fn();
    const res = {
      status: jest.fn(() => ({ json }))
    };
    Station.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([station])
    });

    await listStations({}, res);

    expect(json.mock.calls[0][0].data[0].availableChargers).toBe(2);
    expect(json.mock.calls[0][0].data[0].queueLength).toBe(0);
  });

  test('updates a slot atomically and recomputes availability', async () => {
    const updatedStation = {
      stationId: 'ST101',
      availableChargers: 1
    };
    const response = {
      status: jest.fn(() => ({ json: jest.fn() }))
    };
    Station.findOneAndUpdate.mockResolvedValue(updatedStation);

    await updateSlotStatus({
      params: { id: 'ST101', slotId: 'S01' },
      body: { status: 'BOOKED' }
    }, response);

    expect(Station.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stationId: 'ST101',
        slots: { $elemMatch: { slotId: 'S01', status: { $ne: 'BOOKED' } } }
      }),
      expect.any(Array),
      { new: true }
    );
    expect(response.status).toHaveBeenCalledWith(200);
  });

  test('treats repeating the same slot update as idempotent', async () => {
    const json = jest.fn();
    const response = {
      status: jest.fn(() => ({ json }))
    };
    Station.findOneAndUpdate.mockResolvedValue(null);
    Station.findOne.mockResolvedValue({
      stationId: 'ST101',
      slots: [{ slotId: 'S01', status: 'BOOKED' }]
    });

    await updateSlotStatus({
      params: { id: 'ST101', slotId: 'S01' },
      body: { status: 'BOOKED' }
    }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(json.mock.calls[0][0].message).toBe('Slot status unchanged');
  });
});
