# Smoke Verification Checklist

Verification gates for all phases and pull requests.

## Gate 1: Skeleton & Service Readiness
- [ ] `node scripts/gen-token.js` produces valid test JWTs without error.
- [ ] Every service starts on its assigned port (5000 - 5009).
- [ ] `GET /health` on all 10 services returns `200 {"success":true,"data":{"service":"<name>","status":"UP"},"message":"ok"}`.
- [ ] Dockerfiles build cleanly with `docker build`.

## Gate 2: Auth & Gateway (A-03, A-04)
- [ ] `POST /api/auth/register` creates a user with role `USER`.
- [ ] `POST /api/auth/login` returns `{ user, token }`.
- [ ] `GET /api/auth/profile` with Bearer token returns profile.
- [ ] Gateway routes `/api/auth` -> 5001.
- [ ] Gateway blocks `/internal/*` with 404/403.

## Gate 3: Core Domain (B-01, B-02, B-03)
- [ ] Seed script initializes 3 stations around lat 23.21, lng 72.63.
- [ ] `GET /api/stations` returns 3 stations with `availableChargers` and `queueLength`.
- [ ] `POST /api/ev` creates EV for authenticated user.
- [ ] `POST /api/bookings` reserves slot, returns 409 if slot is occupied.

## Gate 4: Decision & Recommendation (C-01, C-02)
- [ ] Scoring engine unit tests pass (>= 8 tests).
- [ ] `POST /api/decision/recommend` returns ranked list and recommended station/slot.

## Gate 5: End-to-End Demo Flow (Phase 1 Exit)
- [ ] Register/Login -> Add EV -> View stations -> Get recommended station -> Book slot.
- [ ] `docker compose up --build` brings the entire fleet up healthy.
