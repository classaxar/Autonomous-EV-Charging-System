# Booking Service

The booking service reserves station slots for authenticated users and manages booking lifecycle.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/bookings` | Reserve a FREE slot |
| GET | `/api/bookings` | List the user's bookings |
| GET | `/api/bookings/:id` | Read one owned booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel a pending or confirmed booking |
| PATCH | `/internal/bookings/:id/status` | Advance a booking lifecycle status |
| GET | `/internal/bookings/:id` | Read a booking for another service |

Bookings use `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, or `EXPIRED`.
Valid forward transitions are `PENDING -> CONFIRMED -> ACTIVE -> COMPLETED`.
The expiry worker changes confirmed bookings to `EXPIRED` after `EXPIRY_MINUTES` past `startTime`, frees the station slot, and decrements the queue.

## Run and configuration

```powershell
npm install
npm test
npm start
```

The default port is `5004`. Configure `EXPIRY_MINUTES` and `EXPIRY_CHECK_MINUTES` in `.env`.
Other required variables are listed in `.env.example`.
