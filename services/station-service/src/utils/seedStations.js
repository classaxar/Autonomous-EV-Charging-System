const Station = require('../models/Station');
const { buildSlots } = require('./stationValidation');

const seedData = [
  {
    stationId: 'ST101',
    name: 'Station A',
    location: { latitude: 23.2105, longitude: 72.6301 },
    chargerPowerKw: 50,
    pricePerKwh: 12,
    totalChargers: 10,
    queueLength: 0
  },
  {
    stationId: 'ST102',
    name: 'Station B',
    location: { latitude: 23.218, longitude: 72.6362 },
    chargerPowerKw: 30,
    pricePerKwh: 10,
    totalChargers: 8,
    queueLength: 0
  },
  {
    stationId: 'ST103',
    name: 'Station C',
    location: { latitude: 23.205, longitude: 72.643 },
    chargerPowerKw: 60,
    pricePerKwh: 9,
    totalChargers: 12,
    queueLength: 0
  }
];

async function seedStationsIfNeeded() {
  try {
    const count = await Station.countDocuments();
    if (count > 0) {
      return;
    }

    const stationDocs = seedData.map((station) => ({
      ...station,
      slots: buildSlots(station.totalChargers)
    }));

    await Station.insertMany(stationDocs);
    console.log('[Station Seed] Seeded default stations');
  } catch (error) {
    console.warn('[Station Seed] Unable to seed stations:', error.message);
  }
}

module.exports = {
  seedStationsIfNeeded,
  seedData
};
