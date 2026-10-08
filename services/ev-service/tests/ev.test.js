const jwt = require('jsonwebtoken');
const EV = require('../src/models/EV');
const { app } = require('../src');

describe('EV API', () => {
  let server;
  let baseUrl;
  const userToken = jwt.sign(
    { userId: 'U101', role: 'USER', email: 'user@example.com' },
    'test-secret',
    { algorithm: 'HS256' }
  );
  const otherUserToken = jwt.sign(
    { userId: 'U202', role: 'USER', email: 'other@example.com' },
    'test-secret',
    { algorithm: 'HS256' }
  );

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.INTERNAL_KEY = 'test-internal-key';
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  afterEach(() => jest.restoreAllMocks());

  async function request(path, options = {}) {
    return fetch(`${baseUrl}${path}`, options);
  }

  test('creates an EV for the authenticated user', async () => {
    const vehicle = { vehicleId: 'EV101', userId: 'U101', brand: 'Example', model: 'One' };
    jest.spyOn(EV, 'create').mockResolvedValue(vehicle);
    const response = await request('/api/ev', {
      method: 'POST',
      headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: 'U202',
        brand: 'Example',
        model: 'One',
        batteryCapacity: 60,
        currentBattery: 45,
        maxChargingPower: 100
      })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(EV.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'U101' }));
    expect(body.data.userId).toBe('U101');
  });

  test('lists only the authenticated user vehicles', async () => {
    jest.spyOn(EV, 'find').mockResolvedValue([]);
    const response = await request('/api/ev', {
      headers: { authorization: `Bearer ${userToken}` }
    });

    expect(response.status).toBe(200);
    expect(EV.find).toHaveBeenCalledWith({ userId: 'U101' });
  });

  test('does not reveal another user vehicle', async () => {
    jest.spyOn(EV, 'findOne').mockResolvedValue(null);
    const response = await request('/api/ev/EV101', {
      headers: { authorization: `Bearer ${otherUserToken}` }
    });

    expect(response.status).toBe(404);
    expect(EV.findOne).toHaveBeenCalledWith({ vehicleId: 'EV101', userId: 'U202' });
  });

  test('rejects invalid battery values', async () => {
    const response = await request('/api/ev', {
      method: 'POST',
      headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        brand: 'Example',
        model: 'One',
        batteryCapacity: 60,
        currentBattery: 101,
        maxChargingPower: 100
      })
    });

    expect(response.status).toBe(400);
  });

  test('updates the battery through the protected internal endpoint', async () => {
    const vehicle = { vehicleId: 'EV101', currentBattery: 70 };
    jest.spyOn(EV, 'findOneAndUpdate').mockResolvedValue(vehicle);
    const response = await request('/internal/ev/EV101/battery', {
      method: 'PATCH',
      headers: {
        'x-internal-key': 'test-internal-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ currentBattery: 70 })
    });

    expect(response.status).toBe(200);
    expect(EV.findOneAndUpdate).toHaveBeenCalledWith(
      { vehicleId: 'EV101' },
      { $set: { currentBattery: 70 } },
      { new: true, runValidators: true }
    );
  });
});
