# Charging service

# Charging Service

Owns simulated charging sessions. It validates confirmed bookings, moves station slots to `CHARGING`, updates progress using `SIM_SPEEDUP`, and creates a pending payment on completion.

Endpoints: `POST /api/charging/start`, `GET /api/charging/:sessionId`, `POST /api/charging/:sessionId/stop`, `GET /api/charging/history`, and internal `GET /internal/charging/all`.

Run with `npm install`, `npm test`, and `npm start`. Configuration is in `.env.example`.
