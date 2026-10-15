# Decision Service

Stateless recommendation engine using battery priority, distance, queue, price, and charging speed. Weights can be overridden with `SCORE_WEIGHT_*` environment variables.

Endpoint: authenticated `POST /api/decision/recommend`. It returns a priority, recommended station and slot, and ranked alternatives. Use `USE_MOCK=true` for local station fixtures.

Run with `npm install`, `npm test`, and `npm start`. The optional load test uses `npm install autocannon` followed by `node scripts/load-test.js`.
