# RULEBOOK: Autonomous EV Charging System

Binding for all 3 devs and all AI agents. Terse by design. If a rule conflicts with a task, the rule wins.

---

## 1. OWNERSHIP (no-interference law)

| Dev | Owns (write access) |
|---|---|
| **A** Platform | `services/api-gateway/` `services/auth-service/` `services/notification-service/` `docker-compose.yml` `infra/kubernetes/` `.github/` `.gitignore` `README.md` `docs/architecture.md` `scripts/` (root) `services/_template/` `frontend/src/{App.jsx,main.jsx,api/client.js,context/,components/,pages/auth/,pages/dashboard/,pages/admin/}` |
| **B** Core | `services/ev-service/` `services/station-service/` `services/booking-service/` `frontend/src/{pages/ev/,pages/booking/,pages/history/,components/ev/,components/booking/,api/evApi.js,api/stationApi.js,api/bookingApi.js}` |
| **C** Intelligence | `services/decision-service/` `services/charging-service/` `services/payment-service/` `services/analytics-service/` `frontend/src/{pages/recommendation/,pages/charging/,pages/payment/,components/charging/,api/decisionApi.js,api/chargingApi.js,api/paymentApi.js}` |

Rules:
- R1.1 Editing a path you do not own = PR rejected. No exceptions, no "tiny fixes".
- R1.2 Need a change elsewhere? Open a GitHub issue: label `needs-A|B|C`, title `[from-X] what + why`. Owner does it.
- R1.3 Shared root files (`docker-compose.yml`, `infra/kubernetes/`, `.env.example`) are A only. B and C send env/port needs to A by issue; A's skeleton already contains every service.
- R1.4 Dependency not ready? Use your own mock in `services/<your-service>/src/mocks/` behind `USE_MOCK=true`. Never edit the other service.
- R1.5 `frontend/src/App.jsx` already routes to every page. B and C only replace the placeholder page file inside their own folder. Do not touch routes or nav.

---

## 2. PORTS and NAMES (fixed)

| Service | Folder | Port | DB |
|---|---|---|---|
| gateway | services/api-gateway | 5000 | none |
| auth | services/auth-service | 5001 | auth_db |
| ev | services/ev-service | 5002 | ev_db |
| station | services/station-service | 5003 | station_db |
| booking | services/booking-service | 5004 | booking_db |
| decision | services/decision-service | 5005 | none (stateless) |
| charging | services/charging-service | 5006 | charging_db |
| payment | services/payment-service | 5007 | payment_db |
| notification | services/notification-service | 5008 | notification_db |
| analytics | services/analytics-service | 5009 | analytics_db |
| frontend | frontend | 3000 | none |
| mongodb | (image mongo:7) | 27017 | |

Docker service name = basename (e.g. `http://station-service:5003`). Inside Docker never use `localhost` between services.

---

## 3. STACK (fixed, no swaps)

Node 20, Express 4, Mongoose 8, `jsonwebtoken`, `bcryptjs`, `axios`, `cors`, `dotenv`, `http-proxy-middleware` (gateway only), `jest` (tests). Frontend: React + Vite + `react-router-dom` + `axios`. CommonJS (`require`) in all backends. New dependency only if the task cannot be done without it.

---

## 4. SERVICE TEMPLATE (A creates `services/_template/`, everyone copies it)

```
services/<service>/
  src/index.js            # app + listen
  src/config/db.js
  src/middleware/auth.js  # identical copy from services/_template (verifies JWT, sets req.user)
  src/middleware/internal.js  # checks header x-internal-key
  src/routes/ controllers/ models/ mocks/
  .env.example  .dockerignore  Dockerfile  package.json
```

Mandatory in every service:
- `GET /health` -> `200 {"success":true,"data":{"service":"<name>","status":"UP"},"message":"ok"}` (no auth)
- Response envelope: `{ "success": bool, "data": any, "message": string }`
- Errors: same envelope, `success:false`, `data:null`, proper HTTP code (400 validation, 401 no/bad token, 403 role, 404, 409 conflict, 500).
- Read all config from env. No hardcoded URLs, ports or secrets.
- Log one line per request (method path status). No `console.log` of secrets/bodies.

---

## 5. AUTH and SECURITY CONTRACT

- JWT HS256, secret `JWT_SECRET` (same in all services), expiry 1d.
- Payload: `{ "userId": "U...", "role": "USER|STATION_ADMIN|SYSTEM_ADMIN", "email": "..." }`
- Client header: `Authorization: Bearer <token>`.
- `/api/*` routes require JWT (except `POST /api/auth/register|login` and `/health`).
- `/internal/*` routes require header `x-internal-key: $INTERNAL_KEY`, are called only service-to-service, and the gateway never proxies `/internal`.
- Every user-owned record stores `userId`. USER sees only own records. Admin roles see all.
- Passwords hashed with bcrypt (10 rounds). Never return `password`.
- Secrets only in `.env` (git-ignored). Commit `.env.example` with dummy values.

---

## 6. API CONTRACTS (source of truth; do not read other services' code)

ID formats are strings: `U101`, `EV101`, `ST101`, `S04`, `B1001`, `CS101`, `P101`, `N101`. Generate with a prefix plus a counter or random suffix; unique per collection.

### Gateway routing (A)
`/api/auth`->auth, `/api/ev`->ev, `/api/stations`->station, `/api/bookings`->booking, `/api/decision`->decision, `/api/charging`->charging, `/api/payments`->payment, `/api/notifications`->notification, `/api/analytics`->analytics. CORS allows `http://localhost:3000`.

### auth-service (A)
- `POST /api/auth/register` `{name,email,password}` -> `{user,token}` (role forced to USER)
- `POST /api/auth/login` `{email,password}` -> `{user,token}`
- `GET /api/auth/profile` -> `user`
- Seed script creates `admin@ev.com` / `Admin@123` (SYSTEM_ADMIN) and `user@ev.com` / `User@123`.

### ev-service (B) model: `{vehicleId,userId,brand,model,batteryCapacity(kWh),currentBattery(%),maxChargingPower(kW)}`
- `POST /api/ev` | `GET /api/ev` (own) | `GET /api/ev/:id` | `PUT /api/ev/:id` | `DELETE /api/ev/:id`
- `PATCH /internal/ev/:id/battery` `{currentBattery}`

### station-service (B)
Model: `{stationId,name,location{latitude,longitude},chargerPowerKw,pricePerKwh,totalChargers,availableChargers,queueLength,slots[{slotId,status}]}`; slot status `FREE|BOOKED|CHARGING|OFFLINE`.
- `GET /api/stations` -> all, each with `availableChargers` and `queueLength`
- `GET /api/stations/:id`
- `POST /api/stations` | `PUT /api/stations/:id` | `DELETE /api/stations/:id` (STATION_ADMIN or SYSTEM_ADMIN)
- `GET /api/stations/:id/slots`
- `PATCH /internal/stations/:id/slots/:slotId` `{status}` (recomputes `availableChargers`)
- `PATCH /internal/stations/:id/queue` `{delta}` (+1 / -1)
- Seed: 3 stations around lat 23.21 lng 72.63 (A: 10 slots, B: 8, C: 12) with different price (12/10/9) and power (50/30/60 kW).

### booking-service (B) model: `{bookingId,userId,vehicleId,stationId,slotId,startTime,duration(min),status}`
Status: `PENDING|CONFIRMED|ACTIVE|COMPLETED|CANCELLED|EXPIRED`.
- `POST /api/bookings` `{vehicleId,stationId,slotId,startTime,duration}` -> checks slot FREE (via station internal API), sets slot BOOKED, queue +1, status CONFIRMED, notifies user. 409 if slot taken.
- `GET /api/bookings` (own) | `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel` -> frees slot, queue -1, status CANCELLED
- `PATCH /internal/bookings/:id/status` `{status}`
- `GET /internal/bookings/:id`

### decision-service (C) stateless
- `POST /api/decision/recommend`
  Request: `{ vehicleId, currentBattery, targetBattery, batteryCapacity, maxChargingPower, location{latitude,longitude} }`
  Response `data`: `{ priority:"HIGH|MEDIUM|LOW", recommended:{stationId,slotId,...}, ranked:[{stationId,name,score,distanceKm,queueLength,pricePerKwh,estimatedMinutes,reason}] }`
- It fetches stations from `GET $STATION_SERVICE_URL/api/stations` (forwards the caller's JWT).
- Scoring (all sub-scores 0-100, weights normalized to sum 1):
  - batteryPriority = 100 - currentBattery
  - distanceScore = max(0, 100 - distanceKm*10) (Haversine)
  - queueScore = max(0, 100 - queueLength*15)
  - priceScore = 100*(maxPrice - price)/(maxPrice - minPrice) (100 if all equal)
  - speedScore = min(100, min(stationPowerKw, maxChargingPower)/50*100)
  - weights: battery 0.30, distance 0.20*(1+batteryPriority/100), queue 0.20, price 0.15, speed 0.15, then divide by their sum
  - skip stations with `availableChargers = 0`
  - priority: battery <=15 HIGH, <=40 MEDIUM, else LOW
  - estimatedMinutes = (target-current)/100 * batteryCapacity / min(stationPowerKw,maxChargingPower) * 60
  - Put constants in `src/config/scoring.js`. Scoring is a pure function in `src/engine/score.js` with jest tests.

### charging-service (C) model: `{sessionId,userId,bookingId,vehicleId,stationId,startBattery,targetBattery,currentBattery,energyConsumed(kWh),duration(min),status}`
Status: `STARTED|CHARGING|COMPLETED|STOPPED`.
- `POST /api/charging/start` `{bookingId}` -> reads booking and EV, booking ACTIVE, slot CHARGING
- `GET /api/charging/:sessionId` -> live progress (simulated: battery rises by elapsed time * `SIM_SPEEDUP`, default 60)
- `POST /api/charging/:sessionId/stop`
- `GET /api/charging/history` (own)
- On complete/stop: set booking COMPLETED, slot FREE, queue -1, update EV battery, call payment create, send notification.
- `GET /internal/charging/all` (for analytics)

### payment-service (C) model: `{paymentId,userId,bookingId,sessionId,energyKwh,pricePerKwh,amount,status,createdAt}`; status `PENDING|PAID|FAILED`
- `POST /internal/payments` `{userId,bookingId,sessionId,energyKwh,pricePerKwh}` -> amount = energy*price, status PENDING
- `PATCH /api/payments/:id/pay` -> simulated, status PAID, notifies user
- `GET /api/payments` (own) | `GET /api/payments/:id`
- `GET /internal/payments/all`

### notification-service (A) model: `{notificationId,userId,type,message,read,createdAt}`
- `POST /internal/notifications` `{userId,type,message}`
- `GET /api/notifications` (own) | `PATCH /api/notifications/:id/read`
- Types: `STATION_SELECTED, BOOKING_CONFIRMED, SESSION_STARTED, TARGET_REACHED, CHARGING_COMPLETED, PAYMENT_SUCCESS`

### analytics-service (C)
- `GET /api/analytics/summary` -> `{totalSessions,totalEnergyKwh,totalRevenue,avgChargingMinutes,activeSessions}` (admin only)
- `GET /api/analytics/daily` -> `[{date,sessions,energyKwh,revenue}]`
- `GET /api/analytics/stations` -> `[{stationId,sessions,energyKwh,revenue}]`
- Source: internal `/internal/charging/all` and `/internal/payments/all`.

### Service-to-service calls
Use `axios` with header `x-internal-key`, timeout 5000 ms, one retry. If the callee is down, return 503 with the envelope; never crash.

---

## 7. ENV VARS (names fixed; A owns the `.env.example` files)

`PORT` `MONGO_URI` `JWT_SECRET` `INTERNAL_KEY` `NODE_ENV` `USE_MOCK`
URLs: `AUTH_SERVICE_URL` `EV_SERVICE_URL` `STATION_SERVICE_URL` `BOOKING_SERVICE_URL` `DECISION_SERVICE_URL` `CHARGING_SERVICE_URL` `PAYMENT_SERVICE_URL` `NOTIFICATION_SERVICE_URL` `ANALYTICS_SERVICE_URL`
Other: `SIM_SPEEDUP` (charging). Frontend: `VITE_API_URL` (default `http://localhost:5000`).
Mongo URI pattern: `mongodb://mongodb:27017/<db>`; in Kubernetes it comes from ConfigMap/Secret with the same env names.

---

## 8. GIT RULES

- Single monorepo. Branches: `main` (demo-ready only), `develop` (integration), `feature/<TASK-ID>-<slug>` e.g. `feature/B-02-station-service`.
- R8.1 One task ID = one branch = one PR into `develop`. Never push directly to `main` or `develop`.
- R8.2 Start of every task: `git checkout develop && git pull origin develop && git checkout -b feature/<ID>-<slug>`.
- R8.3 Commit format: `feat(service): msg` | `fix(service): msg` | `docker: msg` | `k8s: msg` | `docs: msg` | `test(service): msg`. Small commits, present tense.
- R8.4 PR title: `[<TASK-ID>] short description`. Fill the PR template (what, how tested, `docker compose` OK checkbox).
- R8.5 Merge needs 1 approval from a teammate. Reviewer checks only: (a) touched paths are owned by the author, (b) Docker build passes, (c) Definition of Done met. Use squash merge.
- R8.6 Push after every completed task, never batch the day's work. This also shows each member's contribution.
- R8.7 Pull `develop` before each new branch. If a merge conflict appears, you touched a path you do not own. Fix by dropping that change.
- R8.8 No force-push on shared branches. No committing `node_modules`, `.env`, `*.log`, `dist`.
- R8.9 A merges `develop` -> `main` only at milestones and tags: `v0.5-demo`, `v1.0.0`.
- R8.10 Mark the task `[x]` in TASKBOOK in the same PR (only the line of your own task; this single-line edit to TASKBOOK is the one allowed cross-file edit).

---

## 9. DOCKER RULES

- Every service has `Dockerfile`, `.dockerignore` (`node_modules`, `.env`, `.git`, `*.log`), `/health`.
- Base `node:20-alpine`, copy `package*.json` first, `npm install --omit=dev`, then `COPY . .`, `EXPOSE <port>`, `CMD ["node","src/index.js"]`.
- Compose has a named volume `mongo-data`, a mongo healthcheck, and `depends_on: condition: service_healthy` for DB-using services.
- Before every PR: `docker compose up --build <your-service> mongodb` must start clean and `/health` must return 200.
- Image names: `<dockerhub-user>/ev-<service>:<tag>`; tags `v0.5` for demo and `v1.0` for final.
- Never bake secrets into images. Pass them through env.
- Run services you do not own from Docker (`docker compose up`), not by reading their code.

---

## 10. KUBERNETES RULES (A only; others supply nothing)

- Namespace `ev-system`. One file per service in `infra/kubernetes/` plus `namespace.yaml`, `configmap.yaml`, `secret.yaml`, `mongodb.yaml`, `ingress.yaml`, `hpa.yaml`.
- Every Deployment has: `replicas`, resource requests/limits, liveness and readiness probe on `GET /health`, env from ConfigMap/Secret.
- Secrets: `secret.yaml` committed with dummy base64 values only, real ones are applied by hand.
- HPA: decision-service (min 2, max 5, CPU 60%) and booking-service (min 2, max 4, CPU 70%).

---

## 11. CODE QUALITY

- Validate request bodies (required fields, types). Return 400 with a clear message.
- Controllers thin, logic in `services/` or `engine/`. No giant files (>250 lines).
- Each service has at least 3 jest tests (C's scoring engine: at least 8).
- Comments only where logic is non-obvious. No dead code, no TODOs left in merged code.
- Follow the same indentation (2 spaces), `const`/`let`, async/await, no unhandled promise rejections.

### Definition of Done (every task)
- [ ] Meets the task's "Done when" line
- [ ] Only owned paths changed
- [ ] `GET /health` OK and Docker build passes
- [ ] Tested with Postman/curl or jest (mention which in the PR)
- [ ] No secrets, no `node_modules`
- [ ] PR opened to `develop`, TASKBOOK line ticked

---

## 12. AGENT BEHAVIOR (token-saving rules)

1. Read only: RULEBOOK sections you need, your own dev block in TASKBOOK, files you will edit. Do not scan the repo.
2. Do not re-read a file you just wrote. Do not print whole files back. Use diffs or file paths.
3. One task at a time, in listed order. Do not start work outside the task list. No refactors, renames, or "improvements".
4. Use the contracts in section 6 as truth. Never open another dev's code.
5. Do not ask permission for decisions already in these docs. Ask only when truly blocked, and ask one concise question.
6. If blocked by another dev's unfinished work: use mock (R1.4), note it in the PR, continue.
7. Keep tool output small: `npm test --silent`, `docker compose up -d --build <svc>`, `curl -s`. Avoid dumping logs; tail 20 lines.
8. Generate code compactly. No long explanations in chat, no summaries of what the code does.
9. After each task, reply with exactly:
   ```
   DONE <TASK-ID> | branch: <name> | PR: <title>
   Tested: <how>
   Next: <next TASK-ID> | Blockers: <none|text>
   ```
10. Never invent endpoints, fields, ports, or env names. If missing, open an issue per R1.2.

---

## 13. CONTRACT CHANGES

Contracts (sections 2, 5, 6, 7) change only via: issue labelled `contract` -> both other devs approve with a thumbs-up -> the requester opens a PR editing RULEBOOK.md only -> merge -> everyone pulls `develop`. Until then, old contract stands.

---

## 14. FRONTEND RULES

- Vite + React, base API URL from `VITE_API_URL`, token stored in `localStorage` key `ev_token`, axios instance in `api/client.js` (A) attaches `Authorization` header. B and C import it; they do not create their own axios instances.
- Page folders per section 1. One page = one folder with `index.jsx` plus optional local components. Do not edit another dev's pages or `components/` subfolders.
- Poll live data (charging) every 3 s with `setInterval`, clear on unmount.
- Show loading and error states on every API call.
- Minimal CSS; one `index.css` owned by A. Dev-specific styles via CSS modules inside own folders.
