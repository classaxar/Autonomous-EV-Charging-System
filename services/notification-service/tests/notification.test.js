const jwt = require('jsonwebtoken');
const Notification = require('../src/models/Notification');
const {
  createInternalNotification,
  listOwnNotifications,
  markNotificationRead
} = require('../src/controllers/notificationController');
const { requireInternalKey } = require('../src/middleware/internal');
const { authenticate } = require('../src/middleware/auth');

jest.mock('../src/models/Notification');

describe('Notification Service Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';
  const INTERNAL_KEY = process.env.INTERNAL_KEY || 'internal_secret_key_2026_ev_system';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Internal Notification Creation', () => {
    test('Successfully creates notification when given valid internal payload', async () => {
      const mockCreatedNotif = {
        notificationId: 'notif_123',
        userId: 'U101',
        type: 'BOOKING_CONFIRMED',
        message: 'Your slot at Station A is confirmed',
        read: false,
        createdAt: new Date()
      };
      Notification.create.mockResolvedValue(mockCreatedNotif);

      const req = {
        body: {
          userId: 'U101',
          type: 'BOOKING_CONFIRMED',
          message: 'Your slot at Station A is confirmed'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createInternalNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCreatedNotif,
          message: 'Notification created successfully'
        })
      );
    });

    test('Rejects internal creation when required fields are missing', async () => {
      const req = {
        body: {
          userId: 'U101'
          // missing type and message
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createInternalNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required')
        })
      );
    });

    test('Internal middleware rejects requests with missing or wrong x-internal-key', () => {
      const req = {
        headers: { 'x-internal-key': 'wrong_key' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireInternalKey(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('Internal middleware permits requests with valid x-internal-key', () => {
      const req = {
        headers: { 'x-internal-key': INTERNAL_KEY }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      requireInternalKey(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('2. User Notification Retrieval & Auth', () => {
    test('Returns user notifications list for authenticated user', async () => {
      const mockList = [
        {
          notificationId: 'notif_1',
          userId: 'U101',
          type: 'SESSION_STARTED',
          message: 'Charging started',
          read: false
        }
      ];

      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockList)
        })
      });

      const req = {
        user: { userId: 'U101' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await listOwnNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockList
        })
      );
    });

    test('Authenticate middleware rejects request without Bearer token', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('3. Mark Notification as Read', () => {
    test('Successfully marks notification as read', async () => {
      const mockUpdated = {
        notificationId: 'notif_1',
        userId: 'U101',
        read: true
      };
      Notification.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const req = {
        params: { id: 'notif_1' },
        user: { userId: 'U101' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await markNotificationRead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUpdated,
          message: 'Notification marked as read'
        })
      );
    });

    test('Returns 404 when notification does not exist or user mismatch', async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      const req = {
        params: { id: 'notif_nonexistent' },
        user: { userId: 'U101' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await markNotificationRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
