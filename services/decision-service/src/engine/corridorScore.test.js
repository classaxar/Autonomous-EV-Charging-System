const { scoreCorridorStations } = require('./corridorScore');
const mockStations = require('../mocks/stations');

describe('Corridor & Leisure Scoring Engine', () => {
  const mehsanaToPatanInput = {
    origin: { latitude: 23.5880, longitude: 72.3693, name: 'Mehsana' },
    destination: { latitude: 23.8584, longitude: 72.1017, name: 'Patan' },
    currentBattery: 25,
    targetBattery: 80,
    batteryCapacity: 60,
    maxChargingPower: 60,
    maxDetourKm: 25
  };

  test('successfully identifies and recommends Modhera Sun Temple EV Hub along Mehsana-Patan corridor', () => {
    const result = scoreCorridorStations(mehsanaToPatanInput, mockStations);

    expect(result).toBeDefined();
    expect(result.directDistanceKm).toBeGreaterThan(30);
    expect(result.recommended).toBeDefined();
    expect(result.recommended.stationId).toBe('ST201'); // Modhera Sun Temple Hub
    expect(result.recommended.touristSpot).toBeDefined();
    expect(result.recommended.touristSpot.name).toContain('Modhera Sun Temple');
    expect(result.recommended.detourKm).toBeLessThan(15);
  });

  test('synchronizes charging duration with tourist spot exploration time', () => {
    const result = scoreCorridorStations(mehsanaToPatanInput, mockStations);
    const rec = result.recommended;

    expect(rec.estimatedMinutes).toBeGreaterThan(0);
    expect(rec.touristSpot.recommendedTourMinutes).toBe(45);
    expect(rec.touristSynergyText).toContain('syncs with');
  });

  test('filters out stations that require excessive detour', () => {
    const strictDetourInput = {
      ...mehsanaToPatanInput,
      maxDetourKm: 2 // too small for any off-highway detour
    };
    const result = scoreCorridorStations(strictDetourInput, mockStations);
    // Should filter out stations exceeding 2 km detour
    result.ranked.forEach(station => {
      expect(station.detourKm).toBeLessThanOrEqual(2);
    });
  });

  test('handles empty stations gracefully', () => {
    const result = scoreCorridorStations(mehsanaToPatanInput, []);
    expect(result.recommended).toBeNull();
    expect(result.ranked).toEqual([]);
  });

  test('provides available slot ID for seamless booking', () => {
    const result = scoreCorridorStations(mehsanaToPatanInput, mockStations);
    expect(result.recommended.slotId).toBeDefined();
    expect(typeof result.recommended.slotId).toBe('string');
  });
});
