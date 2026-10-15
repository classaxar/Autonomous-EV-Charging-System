# Payment service

# Payment Service

Owns payment records and simulated checkout. Internal creation is idempotent by `sessionId`; amounts are calculated as `energyKwh * pricePerKwh` and rounded to two decimals.

Endpoints: `PATCH /api/payments/:id/pay`, `GET /api/payments`, `GET /api/payments/:id`, internal `POST /internal/payments`, and internal `GET /internal/payments/all`.

Run with `npm install`, `npm test`, and `npm start`. Configuration is in `.env.example`.
