# Presentation & Viva Outline: Autonomous EV Charging System

A comprehensive presentation structure for academic review, project defense, and architectural viva.

---

## Slide 1: Title & Team Roles
- **Project Title**: Autonomous Electric Vehicle Charging & Grid Load Optimization System
- **Tagline**: Decentralized, Resilient Microservices Platform for Real-Time EV Scheduling and Intelligent Power Allocation
- **Team & Ownership**:
  - **Dev A (Platform & Infrastructure)**: Repository Architecture, API Gateway, Auth Service, Notification Service, Docker, Kubernetes, CI/CD, Frontend Shell.
  - **Dev B (Core Domain)**: EV Management Service, Station Service (IoT Telemetry & Slots), Booking Service (Lifecycle & Expiry).
  - **Dev C (Intelligence & Operations)**: Decision Recommendation Engine (Multi-Factor Scoring), Charging Simulation Service, Payment Service, System Analytics.

---

## Slide 2: Problem Statement & Motivation
- **The Challenge**: Rapid EV adoption causes peak-hour charging congestion, long physical queues, unpredictable tariffs, and grid stress.
- **The Gap**: Existing apps are static registries requiring drivers to manually hunt and gamble on charger availability.
- **The Solution**: An autonomous platform that evaluates real-time queue states, distance, pricing, and vehicular state-of-charge (SoC) to make deterministic, real-time optimal charging decisions.

---

## Slide 3: Microservices Architecture & Design Principles
- **Architectural Paradigm**: Distributed Microservices with Database-per-Service pattern.
- **Technology Stack**: Node.js 20, Express, MongoDB 7, React 18 + Vite, Docker, Kubernetes.
- **Decoupling Strategy**:
  - Independent database per service preventing cross-domain schema coupling.
  - API Gateway as unified ingress point handling SSL/CORS/Rate-limiting.
  - Internal service communication secured via cryptographic header `x-internal-key`.
  - Non-fatal downstream failure handling with standard JSON envelope responses.

---

## Slide 4: Microservices Breakdown by Developer
- **Platform (Dev A)**:
  - `api-gateway` (:5000): In-memory sliding window rate limiter, upstream 503 fallback envelopes, strict `/internal*` blocking.
  - `auth-service` (:5001): RBAC (User, Station Admin, System Admin), bcrypt salt hashing (10 rounds), HS256 JWT tokens.
  - `notification-service` (:5008): Event-driven alerts (`BOOKING_CONFIRMED`, `CHARGING_COMPLETED`, etc.) polled in real time.
- **Core Domain (Dev B)**:
  - `ev-service` (:5002): Vehicle telemetry, battery capacity, SoC updates.
  - `station-service` (:5003): Charging hubs, slot states (`FREE`/`BOOKED`), dynamic queue length tracking.
  - `booking-service` (:5004): Slot reservation concurrency, status state machine (`PENDING` -> `CONFIRMED` -> `COMPLETED`).
- **Intelligence (Dev C)**:
  - `decision-service` (:5005): Stateless multi-factor heuristic scoring engine with battery urgency boost.
  - `charging-service` (:5006): Time-accelerated battery simulation engine (`SIM_SPEEDUP=60`).
  - `payment-service` (:5007): Consumption-based invoice computation and idempotent settlement.
  - `analytics-service` (:5009): Cross-service metrics aggregation and utilization analytics.

---

## Slide 5: The Decision Intelligence Scoring Engine
- **Multi-Factor Objective Function**:
  $$\text{Score} = w_{\text{dist}} \cdot \text{DistNorm} + w_{\text{queue}} \cdot \text{QueueNorm} + w_{\text{price}} \cdot \text{PriceNorm} + w_{\text{pwr}} \cdot \text{PowerNorm}$$
- **Battery Urgency Boost**:
  - When EV Battery $\le 20\%$, weight multiplier ($1.5 \times$) is applied to distance and queue to guarantee the nearest reachable charger.
- **Zero-Availability Guard**:
  - Automatically filters out stations with zero available chargers and saturated queues.

---

## Slide 6: Containerization & Cloud-Native Deployment (Docker)
- **Local Dev vs. Production Profiles**:
  - `docker-compose.yml`: Multi-stage source build with volume mounts and live health checks.
  - `docker-compose.prod.yml`: Lightweight pre-built Docker Hub images for immutable deployments.
- **Fault-Tolerant Mongo Healthcheck**:
  - `mongosh --eval "db.adminCommand('ping')"` with start-period retry buffers.

---

## Slide 7: Kubernetes Orchestration & High Availability
- **Namespace Isolation**: `ev-system`.
- **Stateless Scaling**:
  - Horizontal Pod Autoscaler (HPA) targeting CPU utilization:
    - `decision-service`: Min 2, Max 5 replicas at 60% CPU.
    - `booking-service`: Min 2, Max 4 replicas at 70% CPU.
- **Zero Downtime**: Rolling updates with liveness and readiness probes on `/health`.
- **Self-Healing**: Automatic pod replacement upon container crash or node eviction.

---

## Slide 8: Live Demonstration Sequence
1. User registration and JWT issuance.
2. EV registration with critical battery status (15%).
3. Autonomous station recommendation query.
4. Booking slot reservation and notification delivery.
5. Simulated smart charging progress to 80%.
6. Automated billing and simulated checkout.
7. System administrator live energy telemetry dashboard.

---

## Slide 9: Future Scope & ML Enhancement
- Predictive queue wait time estimation via LSTM time-series models.
- Dynamic renewable energy pricing integration (solar/wind grid tariffs).
- Open Charge Point Protocol (OCPP 2.0.1) hardware bridge.
