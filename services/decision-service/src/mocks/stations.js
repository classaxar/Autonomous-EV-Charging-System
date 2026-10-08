module.exports = [
  {
    stationId: 'ST101',
    name: 'Station A',
    location: { latitude: 23.21, longitude: 72.63 },
    chargerPowerKw: 50,
    pricePerKwh: 12,
    totalChargers: 10,
    availableChargers: 10,
    queueLength: 0,
    slots: Array.from({ length: 10 }, (_, index) => ({ slotId: `S${String(index + 1).padStart(2, '0')}`, status: 'FREE' }))
  },
  {
    stationId: 'ST102',
    name: 'Station B',
    location: { latitude: 23.215, longitude: 72.635 },
    chargerPowerKw: 30,
    pricePerKwh: 10,
    totalChargers: 8,
    availableChargers: 8,
    queueLength: 2,
    slots: Array.from({ length: 8 }, (_, index) => ({ slotId: `S${String(index + 11).padStart(2, '0')}`, status: 'FREE' }))
  },
  {
    stationId: 'ST103',
    name: 'Station C',
    location: { latitude: 23.205, longitude: 72.625 },
    chargerPowerKw: 60,
    pricePerKwh: 9,
    totalChargers: 12,
    availableChargers: 12,
    queueLength: 8,
    slots: Array.from({ length: 12 }, (_, index) => ({ slotId: `S${String(index + 19).padStart(2, '0')}`, status: 'FREE' }))
  }
];
