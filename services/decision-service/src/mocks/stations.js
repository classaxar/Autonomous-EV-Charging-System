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
  },
  {
    stationId: 'ST201',
    name: 'Modhera Sun Temple Solar EV Hub',
    location: { latitude: 23.5835, longitude: 72.1332 },
    chargerPowerKw: 60,
    pricePerKwh: 11,
    totalChargers: 8,
    availableChargers: 6,
    queueLength: 0,
    slots: Array.from({ length: 8 }, (_, index) => ({ slotId: `MS${String(index + 1).padStart(2, '0')}`, status: index < 6 ? 'FREE' : 'BOOKED' }))
  },
  {
    stationId: 'ST202',
    name: 'Mehsana Bypass Power EV Hub',
    location: { latitude: 23.5920, longitude: 72.3750 },
    chargerPowerKw: 50,
    pricePerKwh: 12,
    totalChargers: 6,
    availableChargers: 5,
    queueLength: 1,
    slots: Array.from({ length: 6 }, (_, index) => ({ slotId: `MH${String(index + 1).padStart(2, '0')}`, status: index < 5 ? 'FREE' : 'BOOKED' }))
  },
  {
    stationId: 'ST203',
    name: 'Patan Rani ki Vav Heritage EV Station',
    location: { latitude: 23.8520, longitude: 72.1060 },
    chargerPowerKw: 60,
    pricePerKwh: 10,
    totalChargers: 10,
    availableChargers: 8,
    queueLength: 1,
    slots: Array.from({ length: 10 }, (_, index) => ({ slotId: `PT${String(index + 1).padStart(2, '0')}`, status: index < 8 ? 'FREE' : 'BOOKED' }))
  },
  {
    stationId: 'ST204',
    name: 'Adalaj Stepwell Heritage Charger',
    location: { latitude: 23.1670, longitude: 72.5810 },
    chargerPowerKw: 60,
    pricePerKwh: 11,
    totalChargers: 6,
    availableChargers: 6,
    queueLength: 0,
    slots: Array.from({ length: 6 }, (_, index) => ({ slotId: `AD${String(index + 1).padStart(2, '0')}`, status: 'FREE' }))
  },
  {
    stationId: 'ST205',
    name: 'Vadnagar Archaeological EV Port',
    location: { latitude: 23.7850, longitude: 72.6360 },
    chargerPowerKw: 50,
    pricePerKwh: 11,
    totalChargers: 6,
    availableChargers: 4,
    queueLength: 1,
    slots: Array.from({ length: 6 }, (_, index) => ({ slotId: `VD${String(index + 1).padStart(2, '0')}`, status: index < 4 ? 'FREE' : 'BOOKED' }))
  }
];
