const { validateBookingPayload, isValidBookingStatus } = require('../utils/bookingValidation');

describe('booking validation', () => {
  test('accepts valid booking payload', () => {
    const result = validateBookingPayload({
      vehicleId: 'EV101',
      stationId: 'ST101',
      slotId: 'S01',
      startTime: '2026-10-08T10:00:00Z',
      duration: 60
    });

    expect(result.valid).toBe(true);
  });

  test('rejects missing slot', () => {
    const result = validateBookingPayload({
      vehicleId: 'EV101',
      stationId: 'ST101',
      startTime: '2026-10-08T10:00:00Z',
      duration: 60
    });

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/slotId/i);
  });

  test('validates status enum', () => {
    expect(isValidBookingStatus('CONFIRMED')).toBe(true);
    expect(isValidBookingStatus('INVALID')).toBe(false);
  });
});
