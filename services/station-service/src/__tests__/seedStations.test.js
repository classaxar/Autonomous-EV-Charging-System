jest.mock('../models/Station', () => ({
  countDocuments: jest.fn(),
  insertMany: jest.fn()
}));

const Station = require('../models/Station');
const { seedStationsIfNeeded } = require('../utils/seedStations');

describe('station seed data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('seeds free slots and matching available charger counts', async () => {
    Station.countDocuments.mockResolvedValue(0);
    Station.insertMany.mockResolvedValue([]);

    await seedStationsIfNeeded();

    const [stations] = Station.insertMany.mock.calls[0];
    expect(stations).toHaveLength(3);
    stations.forEach((station) => {
      expect(station.availableChargers).toBe(station.totalChargers);
      expect(station.slots).toHaveLength(station.totalChargers);
      expect(station.slots.every((slot) => slot.status === 'FREE')).toBe(true);
    });
  });
});
