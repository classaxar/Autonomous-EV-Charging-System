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

  describe('5. Rate Limiting (A-11)', () => {
    test('Injects rate limit headers on responses', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('100');
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    test('Custom rate limiter blocks after exceeding threshold', () => {
      const { createRateLimiter } = require('../src/middleware/rateLimiter');
      const testLimiter = createRateLimiter({ windowMs: 1000, max: 2 });

      const req = { ip: '10.0.0.1', headers: {} };
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      testLimiter(req, res, next); // 1
      testLimiter(req, res, next); // 2
      expect(next).toHaveBeenCalledTimes(2);

      testLimiter(req, res, next); // 3 (exceeds 2)
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Rate limit exceeded/i)
        })
      );
    });
  });

  describe('6. Role Guard Helper (A-11)', () => {
    const jwt = require('jsonwebtoken');
    const { requireGatewayRole } = require('../src/middleware/roleGuard');
    const secret = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';

    test('Passes when token matches allowed role', () => {
      const token = jwt.sign({ userId: 'A1', role: 'SYSTEM_ADMIN' }, secret);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      requireGatewayRole('SYSTEM_ADMIN')(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user.role).toBe('SYSTEM_ADMIN');
    });

    test('Blocks when token has unauthorized role', () => {
      const token = jwt.sign({ userId: 'U1', role: 'USER' }, secret);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      requireGatewayRole('SYSTEM_ADMIN')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

