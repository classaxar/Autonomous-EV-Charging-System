const { buildSlots, calculateAvailableChargers } = require('../utils/stationValidation');

describe('station validation', () => {
  test('builds free slots for a station', () => {
    const slots = buildSlots(3);

    expect(slots).toHaveLength(3);
    expect(slots[0].slotId).toBe('S01');
    expect(slots[0].status).toBe('FREE');
  });

  test('counts available free chargers', () => {
    const available = calculateAvailableChargers([
      { slotId: 'S01', status: 'FREE' },
      { slotId: 'S02', status: 'BOOKED' },
      { slotId: 'S03', status: 'FREE' }
    ]);

    expect(available).toBe(2);
  });

  test('rejects invalid total charger count', () => {
    const slots = buildSlots(0);
    expect(slots).toHaveLength(0);
  });
});
