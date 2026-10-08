# Autonomous EV System: API Contracts Reference

Source of Truth per RULEBOOK Section 6.

## ID Convention
Prefix + unique number/string:
- Users: `U101`
- Vehicles: `EV101`
- Stations: `ST101`
- Slots: `S01`
- Bookings: `B1001`
- Charging Sessions: `CS101`
- Payments: `P101`
- Notifications: `N101`

---

## 1. Gateway Routing (A) :5000
- `/api/auth/*` -> `http://auth-service:5001`
- `/api/ev/*` -> `http://ev-service:5002`
- `/api/stations/*` -> `http://station-service:5003`
- `/api/bookings/*` -> `http://booking-service:5004`
- `/api/decision/*` -> `http://decision-service:5005`
- `/api/charging/*` -> `http://charging-service:5006`
- `/api/payments/*` -> `http://payment-service:5007`
- `/api/notifications/*` -> `http://notification-service:5008`
- `/api/analytics/*` -> `http://analytics-service:5009`

---

## 2. Service Endpoints Summary

### auth-service (A) :5001
- `POST /api/auth/register` `{name, email, password}` -> `{user, token}`
- `POST /api/auth/login` `{email, password}` -> `{user, token}`
- `GET /api/auth/profile` -> `user`

### ev-service (B) :5002
- `POST /api/ev` | `GET /api/ev` | `GET /api/ev/:id` | `PUT /api/ev/:id` | `DELETE /api/ev/:id`
- `PATCH /internal/ev/:id/battery` `{currentBattery}`

### station-service (B) :5003
- `GET /api/stations` -> `[{stationId, name, location, chargerPowerKw, pricePerKwh, totalChargers, availableChargers, queueLength, slots}]`
- `GET /api/stations/:id`
- `POST /api/stations` | `PUT /api/stations/:id` | `DELETE /api/stations/:id`
- `GET /api/stations/:id/slots`
- `PATCH /internal/stations/:id/slots/:slotId` `{status}`
- `PATCH /internal/stations/:id/queue` `{delta}`

### booking-service (B) :5004
- `POST /api/bookings` `{vehicleId, stationId, slotId, startTime, duration}`
- `GET /api/bookings` | `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`
- `PATCH /internal/bookings/:id/status` `{status}`
- `GET /internal/bookings/:id`

### decision-service (C) :5005
- `POST /api/decision/recommend`
  Body: `{ vehicleId, currentBattery, targetBattery, batteryCapacity, maxChargingPower, location: { latitude, longitude } }`
  Response: `{ priority, recommended: { stationId, slotId, ... }, ranked: [...] }`

### charging-service (C) :5006
- `POST /api/charging/start` `{bookingId}`
- `GET /api/charging/:sessionId`
- `POST /api/charging/:sessionId/stop`
- `GET /api/charging/history`
- `GET /internal/charging/all`

### payment-service (C) :5007
- `POST /internal/payments` `{userId, bookingId, sessionId, energyKwh, pricePerKwh}`
- `PATCH /api/payments/:id/pay`
- `GET /api/payments` | `GET /api/payments/:id`
- `GET /internal/payments/all`

### notification-service (A) :5008
- `POST /internal/notifications` `{userId, type, message}`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### analytics-service (C) :5009
- `GET /api/analytics/summary`
- `GET /api/analytics/daily`
- `GET /api/analytics/stations`
