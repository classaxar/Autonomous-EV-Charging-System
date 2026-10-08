# Project Roadmap & Task Tracker (`todo.md`)

Tracking development of the Autonomous EV Charging System monorepo across Dev A (Platform), Dev B (Core Domain), and Dev C (Intelligence).

---

## 🏁 Phase 1: 50% Demo Milestone (M1)

### Dev A (Platform & Infra)
- [x] **A-00** Repo bootstrap (`.gitignore`, `.github/PULL_REQUEST_TEMPLATE.md`, `README.md`, `AGENTS.md`, `RULEBOOK.md`, `TASKBOOK.md`, branch setup)
- [x] **A-01** Skeleton (10 service directories under `services/` from `_template/`, working `/health`, `gen-token.js`, root `.env.example`, docs & scripts)
- [ ] **A-02** `docker-compose.yml` (all 10 services + frontend + mongodb with healthchecks & volume)
- [ ] **A-03** `auth-service` (register, login, profile, bcrypt, JWT, roles, seed script, 3+ jest tests)
- [ ] **A-04** `api-gateway` (routing table, CORS, error envelope, blocks `/internal`, /health)
- [ ] **A-05** Frontend shell (Vite app, router with all routes, placeholder pages, `client.js`, auth context)
- [ ] **A-06** Screens: Login, Register, Dashboard
- [ ] **A-07** Demo script `scripts/demo.md` + frontend Dockerfile + `v0.5-demo` tag

### Dev B (Core Domain)
- [ ] **B-01** `ev-service` (model, CRUD, ownership by `userId`, internal battery patch, 3+ tests, Dockerfile)
- [ ] **B-02** `station-service` (model, CRUD, slots list, internal slot & queue patch, seed script, Dockerfile)
- [ ] **B-03** `booking-service` (reservation, slot validation, mock fallback, cancel, Dockerfile)
- [ ] **B-04** Frontend EV Management page (`pages/ev/`, `api/evApi.js`)
- [ ] **B-05** Frontend Booking page (`pages/booking/`, `api/bookingApi.js`)

### Dev C (Intelligence & Charging)
- [ ] **C-01** `decision-service` scoring engine (`src/engine/score.js`, pure function, 8+ jest tests)
- [ ] **C-02** `POST /api/decision/recommend` endpoint (fetch stations, fallback mock, slot assignment, Dockerfile)
- [ ] **C-03** Frontend Recommendation page (`pages/recommendation/`, `api/decisionApi.js`)
- [ ] **C-04** Stub services (`charging-service`, `payment-service`, `analytics-service` UP with Dockerfile & /health)

---

## 🚀 Phase 2: 100% Final Milestone (M2)

### Dev A
- [ ] **A-10** `notification-service` full implementation
- [ ] **A-11** Gateway hardening (rate limiting, upstream failure handling, 503 envelopes)
- [ ] **A-12** Admin Dashboard frontend & notification bell
- [ ] **A-13** Docker Hub push script (`scripts/push-images.sh`) & `docker-compose.prod.yml`
- [ ] **A-14** Kubernetes base (`namespace.yaml`, `configmap.yaml`, `secret.yaml`, `mongodb.yaml`)
- [ ] **A-15** Kubernetes service deployments & ingress (`ingress.yaml`)
- [ ] **A-16** HPA autoscaling (`hpa.yaml`) & `scripts/k8s-demo.md`
- [ ] **A-17** Final documentation & architectural audit

### Dev B
- [ ] **B-10** Station slot concurrency locking & admin endpoints
- [ ] **B-11** Booking lifecycle & auto-expiry job (`node-cron`)
- [ ] **B-12** Frontend History page (`pages/history/`)
- [ ] **B-13** EV & Booking UI polish
- [ ] **B-14** Service READMEs & 5+ tests per service
- [ ] **B-15** `booking-service/VIVA.md`

### Dev C
- [ ] **C-10** `charging-service` simulation pipeline & state machine
- [ ] **C-11** `payment-service` billing, idempotent checkouts
- [ ] **C-12** `analytics-service` admin aggregation endpoints
- [ ] **C-13** Frontend Live Charging page (`pages/charging/`)
- [ ] **C-14** Frontend Payment page (`pages/payment/`)
- [ ] **C-15** Decision engine v2 (configurable weights, stress load testing)
- [ ] **C-16** Service READMEs & `decision-service/VIVA.md`

---

## 🏆 Phase 3: Final Integration & Presentation (All Devs)
- [ ] **F-01** End-to-end regression testing across Docker and Kubernetes
- [ ] **F-02** Issue triage and resolution
- [ ] **F-03** Presentation and viva outline (`docs/presentation-outline.md`)
- [ ] **F-04** Viva rehearsal & scaling demo
- [ ] **F-05** Merge to `main`, tag `v1.0.0`, push production images
