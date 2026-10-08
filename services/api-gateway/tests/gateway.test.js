const request = require('supertest');
const { app } = require('../src/index');
const { getProxyRoutes } = require('../src/config/proxy');

describe('API Gateway Tests', () => {
  describe('1. Health Check', () => {
    test('GET /health returns 200 with UP status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: {
          service: 'api-gateway',
          status: 'UP'
        },
        message: 'ok'
      });
    });
  });

  describe('2. Internal Routes Blocking (Security)', () => {
    test('GET /internal/status is blocked and returns 404', async () => {
      const res = await request(app).get('/internal/status');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/internal routes/i);
    });

    test('POST /internal/payments is blocked and returns 404', async () => {
      const res = await request(app)
        .post('/internal/payments')
        .send({ amount: 100 });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('PATCH /internal/stations/ST101/queue is blocked and returns 404', async () => {
      const res = await request(app)
        .patch('/internal/stations/ST101/queue')
        .send({ delta: 1 });
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Routing Table Verification', () => {
    test('Configures all 9 required microservice proxy routes per RULEBOOK 6', () => {
      const routes = getProxyRoutes();
      const expectedPaths = [
        '/api/auth',
        '/api/ev',
        '/api/stations',
        '/api/bookings',
        '/api/decision',
        '/api/charging',
        '/api/payments',
        '/api/notifications',
        '/api/analytics'
      ];

      const configuredPaths = routes.map((r) => r.path);
      for (const expected of expectedPaths) {
        expect(configuredPaths).toContain(expected);
      }
      expect(routes.length).toBe(9);
    });
  });

  describe('4. 404 Handler for Unknown Routes', () => {
    test('GET /unknown-path returns 404 envelope', async () => {
      const res = await request(app).get('/unknown-path');
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({
        success: false,
        data: null,
        message: expect.stringMatching(/Route not found/)
      });
    });
  });
});
