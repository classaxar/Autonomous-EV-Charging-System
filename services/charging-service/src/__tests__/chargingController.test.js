const { progress } = require('../controllers/chargingController');

test('calculates simulated progress and energy from elapsed time', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:30:00Z'));
  process.env.SIM_SPEEDUP = '1';
  const result = progress({
    startedAt: new Date('2026-01-01T00:00:00Z'),
    startBattery: 20,
    targetBattery: 80,
    duration: 60,
    batteryCapacity: 50
  });

  expect(result.currentBattery).toBe(50);
  expect(result.energy).toBe(15);
  jest.useRealTimers();
});

test('caps progress at the target battery', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-02T00:00:00Z'));
  process.env.SIM_SPEEDUP = '60';
  expect(progress({
    startedAt: new Date('2026-01-01T00:00:00Z'),
    startBattery: 20,
    targetBattery: 80,
    duration: 60,
    batteryCapacity: 50
  }).currentBattery).toBe(80);
  jest.useRealTimers();
});
