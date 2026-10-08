/**
 * API Gateway routing table per RULEBOOK Section 6
 */

function getProxyRoutes() {
  return [
    {
      path: '/api/auth',
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
      service: 'auth-service'
    },
    {
      path: '/api/ev',
      target: process.env.EV_SERVICE_URL || 'http://localhost:5002',
      service: 'ev-service'
    },
    {
      path: '/api/stations',
      target: process.env.STATION_SERVICE_URL || 'http://localhost:5003',
      service: 'station-service'
    },
    {
      path: '/api/bookings',
      target: process.env.BOOKING_SERVICE_URL || 'http://localhost:5004',
      service: 'booking-service'
    },
    {
      path: '/api/decision',
      target: process.env.DECISION_SERVICE_URL || 'http://localhost:5005',
      service: 'decision-service'
    },
    {
      path: '/api/charging',
      target: process.env.CHARGING_SERVICE_URL || 'http://localhost:5006',
      service: 'charging-service'
    },
    {
      path: '/api/payments',
      target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5007',
      service: 'payment-service'
    },
    {
      path: '/api/notifications',
      target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
      service: 'notification-service'
    },
    {
      path: '/api/analytics',
      target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5009',
      service: 'analytics-service'
    }
  ];
}

module.exports = {
  getProxyRoutes
};
