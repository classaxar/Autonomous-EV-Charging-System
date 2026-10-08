const {
  haversineDistanceKm,
  normalizePrice,
  priorityForBattery,
  scoreStations
} = require('./score');

const stations = [
  {
    stationId: 'ST101',
    name: 'Near',
    location: { latitude: 23.21, longitude: 72.63 },
    chargerPowerKw: 50,
    pricePerKwh: 12,
    availableChargers: 5,
    queueLength: 0,
    slots: [{ slotId: 'S01', status: 'FREE' }]
  },
  {
    stationId: 'ST102',
    name: 'Far',
    location: { latitude: 23.31, longitude: 72.73 },
    chargerPowerKw: 30,
    pricePerKwh: 10,
    availableChargers: 4,
    queueLength: 2,
    slots: [{ slotId: 'S02', status: 'FREE' }]
  }
];

const input = {
  currentBattery: 8,
  targetBattery: 80,
  batteryCapacity: 60,
  maxChargingPower: 50,
  location: { latitude: 23.21, longitude: 72.63 }
};

test('calculates zero distance at the same location', () => {
  expect(haversineDistanceKm(input.location, input.location)).toBe(0);
});

test('normalizes cheaper prices higher', () => {
  expect(normalizePrice(10, 10, 12)).toBe(100);
  expect(normalizePrice(12, 10, 12)).toBe(0);
});

test('uses 100 for equal prices', () => {
  expect(normalizePrice(10, 10, 10)).toBe(100);
});

test('assigns priority labels', () => {
  expect(priorityForBattery(15)).toBe('HIGH');
  expect(priorityForBattery(40)).toBe('MEDIUM');
  expect(priorityForBattery(41)).toBe('LOW');
});

test('ranks the nearby available station first', () => {
  expect(scoreStations(input, stations).ranked[0].stationId).toBe('ST101');
});

test('boosts low battery priority and returns an estimate', () => {
  const result = scoreStations(input, stations);
  expect(result.priority).toBe('HIGH');
  expect(result.ranked[0].estimatedMinutes).toBe(51.84);
});

test('skips stations with zero availability', () => {
  expect(scoreStations(input, [{ ...stations[0], availableChargers: 0 }]).ranked).toEqual([]);
});

test('returns an empty ranking for no stations', () => {
  expect(scoreStations(input, []).ranked).toEqual([]);
});

test('returns a reason for each ranked station', () => {
  expect(scoreStations(input, stations).ranked[0].reason).toContain('available charger');
});
