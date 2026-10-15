jest.mock('axios', () => ({ get: jest.fn() }));

const axios = require('axios');
const { summary, aggregate } = require('../controllers/analyticsController');

function response() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('aggregates sessions and revenue', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { data: [{ status: 'COMPLETED', energyConsumed: 24, duration: 30 }] } })
    .mockResolvedValueOnce({ data: { data: [{ amount: 288 }] } });
  const res = response();

  await summary({}, res);

  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ totalSessions: 1, totalEnergyKwh: 24, totalRevenue: 288 })
  }));
});

test('reuses aggregate data during the cache window', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: { data: [] } });
  await aggregate();
  await aggregate();
  expect(axios.get).toHaveBeenCalledTimes(0);
});
