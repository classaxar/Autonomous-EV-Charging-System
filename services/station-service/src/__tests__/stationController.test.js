jest.mock('../models/Station', () => ({
  find: jest.fn()
}));

const Station = require('../models/Station');
const { listStations } = require('../controllers/stationController');

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
});
