# ⚡ Autonomous EV Charging System

> **Distributed Multi-Service Platform for Autonomous EV Routing, Real-Time Slot Reservation, Simulated Fast Charging & Dynamic Tariffs**

[![Node Version](https://img.shields.io/badge/Node-20.x%20LTS-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-ev--system-326CE5?style=for-the-badge&logo=kubernetes)](infra/kubernetes/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](frontend/)

---

## 📌 Executive Summary

The **Autonomous EV Charging System** is an enterprise-grade microservices architecture designed to solve urban EV charging bottlenecks. It connects electric vehicles with charging stations through an autonomous multi-factor recommendation engine that balances distance, charging speeds, dynamic tariffs, queue length, and vehicle State of Charge (SoC).

### Key Highlights
- **10 Microservices + React SPA**: Cleanly decoupled boundaries with independent databases per domain.
- **Autonomous Decision Engine**: Deterministic multi-criteria decision algorithm with priority boosting.
- **Dual Security Model**: Public routes protected by JWT (HS256); internal service-to-service calls secured via `x-internal-key`.
- **Zero-Interference Ownership**: Strict domain separation between 3 teams (Platform, Core Domain, Intelligence).
- **Containerized & Orchestrated**: Complete Docker Compose local development environment and Kubernetes deployment with HPA scaling.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph Clients["Presentation Layer (:3000)"]
        UI["React 18 + Vite SPA\n(Auth Context, Real-Time Charging Poll, Dark UI)"]
    end

    subgraph Edge["Edge & Security Layer (:5000)"]
        GW["API Gateway\n(Reverse Proxy, CORS, Error Envelope, Blocks /internal)"]
    end

    subgraph Platform["Dev A: Platform & Infra"]
        AUTH["auth-service :5001\n(JWT HS256, Bcrypt, RBAC)"]
        NOTIF["notification-service :5008\n(In-App User Notifications)"]
    end

    subgraph CoreDomain["Dev B: Core Domain"]
        EV["ev-service :5002\n(Vehicle Specs & SoC)"]
        STATION["station-service :5003\n(Stations, Slots & Queues)"]
        BOOKING["booking-service :5004\n(Reservations & Slot Locking)"]
    end

    subgraph Intelligence["Dev C: Intelligence & Billing"]
        DECISION["decision-service :5005\n(Stateless Decision Engine)"]
        CHARGING["charging-service :5006\n(Simulation & Ramp Engine)"]
        PAYMENT["payment-service :5007\n(Billing & Tariff Calculation)"]
        ANALYTICS["analytics-service :5009\n(Admin Metrics Aggregation)"]
    end

    subgraph Storage["Persistence Plane"]
        DB[("MongoDB :27017\n(Isolated DB Per Service)")]
    end

    UI -->|HTTP / REST| GW
    GW -->|/api/auth| AUTH
    GW -->|/api/ev| EV
    GW -->|/api/stations| STATION
    GW -->|/api/bookings| BOOKING
    GW -->|/api/decision| DECISION
    GW -->|/api/charging| CHARGING
    GW -->|/api/payments| PAYMENT
    GW -->|/api/notifications| NOTIF
    GW -->|/api/analytics| ANALYTICS

    AUTH & EV & STATION & BOOKING & CHARGING & PAYMENT & NOTIF & ANALYTICS --> DB
```

---

## 🧭 Service Port Matrix & Ownership

| Service | Folder | Port | Database | Primary Owner | Description |
|---|---|---|---|---|---|
| **api-gateway** | `services/api-gateway/` | **5000** | *None* | **Dev A** (Platform) | Reverse proxy, central error envelope, blocks `/internal` |
| **auth-service** | `services/auth-service/` | **5001** | `auth_db` | **Dev A** (Platform) | Registration, login, profile, password hashing, JWT tokens |
| **ev-service** | `services/ev-service/` | **5002** | `ev_db` | **Dev B** (Core) | Vehicle registry, battery capacity, current state of charge |
| **station-service** | `services/station-service/` | **5003** | `station_db` | **Dev B** (Core) | Station metadata, slot state (`FREE\|BOOKED\|CHARGING`), seed data |
| **booking-service** | `services/booking-service/` | **5004** | `booking_db` | **Dev B** (Core) | Slot reservations, queue increments, cancellation lifecycle |
| **decision-service** | `services/decision-service/` | **5005** | *None* | **Dev C** (Intel) | Stateless multi-criteria ranking algorithm (Haversine, price, speed) |
| **charging-service** | `services/charging-service/` | **5006** | `charging_db` | **Dev C** (Intel) | Simulated charging sessions (`SIM_SPEEDUP`), battery ramp |
| **payment-service** | `services/payment-service/` | **5007** | `payment_db` | **Dev C** (Intel) | Billing calculations (`energyKwh * price`), payment checkout |
| **notification-service**| `services/notification-service/`| **5008** | `notification_db` | **Dev A** (Platform) | Real-time event notifications for users |
| **analytics-service** | `services/analytics-service/` | **5009** | `analytics_db` | **Dev C** (Intel) | Admin operational intelligence & daily energy statistics |
| **frontend** | `frontend/` | **3000** | *None* | Shared | React 18 + Vite SPA |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20.x LTS or higher
- **Docker & Docker Compose**: v2.x or higher
- **npm** or **yarn**

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/classaxar/Autonomous-EV-Charging-System.git
cd Autonomous-EV-Charging-System

# Copy root environment variables
cp .env.example .env
```

### 3. Generate Test JWT Tokens
```bash
# Prints pre-configured USER, STATION_ADMIN, and SYSTEM_ADMIN test tokens
node scripts/gen-token.js
```

### 4. Run Health Checks Across Services
```bash
# On Linux / macOS / Git Bash:
./scripts/check-health.sh

# On Windows PowerShell:
.\scripts\check-health.ps1
```

---

## 🔒 Security & Contracts

- **Authentication**: JWT `HS256`, Bearer header token on all `/api/*` endpoints except auth and `/health`.
- **Internal Protection**: Header `x-internal-key` is required on all `/internal/*` routes. Never proxied through the API Gateway.
- **Contract & Architecture Reference**: See `RULEBOOK.md` (Section 6) for endpoint schemas, and [docs/architecture.md](docs/architecture.md) for architecture.
- **Rules of Engagement**: See `RULEBOOK.md` (Section 8) for Git conventions and PR requirements.
- **Tasks & Milestones**: See `TASKBOOK.md` for current phase deliverables.
