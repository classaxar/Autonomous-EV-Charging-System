# ⚡ Autonomous EV Charging System

> **Distributed Multi-Service Platform for Autonomous EV Routing, Real-Time Slot Reservation, Simulated Fast Charging & Dynamic Tariffs**

[![Node Version](https://img.shields.io/badge/Node-20.x%20LTS-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-black?style=for-the-badge&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-axar9408%2Fautonomous--ev--charging--system-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/axar9408/autonomous-ev-charging-system/tags)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-ev--system-326CE5?style=for-the-badge&logo=kubernetes)](infra/kubernetes/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![Author](https://img.shields.io/badge/Developer-Axar-orange?style=for-the-badge&logo=github)](https://github.com/classaxar)

---

## 📌 Executive Summary

The **Autonomous EV Charging System** is an enterprise-grade cloud-native microservices platform designed to eliminate urban electric vehicle charging bottlenecks. Developed and engineered from the ground up, it autonomously connects electric vehicles with the most optimal charging stations through a multi-factor decision engine balancing real-time distance, charger speeds, dynamic pricing, queue times, and vehicle battery State of Charge (SoC).

### Key Highlights
- **11 Microservices + React SPA**: Cleanly decoupled domain boundaries with independent, isolated MongoDB databases per service.
- **Autonomous Decision Engine**: Deterministic Multi-Criteria Decision Algorithm (MCDA) with priority boosting for critically depleted batteries.
- **Interactive Live Map & GPS Routing**: Real-time Leaflet map with GPS tracking, destination routing, and station discovery.
- **Unified Docker Hub Distribution**: All 11 microservices published under a single project umbrella: [`axar9408/autonomous-ev-charging-system`](https://hub.docker.com/r/axar9408/autonomous-ev-charging-system/tags).
- **Dual Security Model**: Public routes protected by JWT (`HS256`); internal service-to-service calls secured via `x-internal-key`.
- **Live Battery Simulation Engine**: Real-time charging simulation with physics-based battery ramp curves and configurable acceleration (`SIM_SPEEDUP`).
- **Production-Ready Orchestration**: Docker Compose, instant Docker Hub pulling (`docker-compose.hub.yml`), and full Kubernetes manifests with HPA auto-scaling.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph Clients["Presentation Layer (:3000)"]
        UI["React 18 + Vite SPA\n(Interactive Map, Auth Context, Real-Time Polling, Dark UI)"]
    end

    subgraph Edge["Edge & Security Layer (:5000)"]
        GW["API Gateway\n(Rate Limiter, Reverse Proxy, Central Envelope, Blocks /internal)"]
    end

    subgraph Platform["Platform & Security Services"]
        AUTH["auth-service :5001\n(JWT HS256, Bcrypt, RBAC)"]
        NOTIF["notification-service :5008\n(Real-Time Alerts & Notification Logs)"]
    end

    subgraph CoreDomain["Core Fleet & Station Domain"]
        EV["ev-service :5002\n(Vehicle Specs & Battery SoC)"]
        STATION["station-service :5003\n(Stations, Slots & Geo-Coordinates)"]
        BOOKING["booking-service :5004\n(Reservations & Slot Locking)"]
    end

    subgraph Intelligence["Decision Intelligence & Billing"]
        DECISION["decision-service :5005\n(Stateless MCDA Ranking Algorithm)"]
        CHARGING["charging-service :5006\n(Simulation & Battery Ramp Curve)"]
        PAYMENT["payment-service :5007\n(Dynamic Tariffs & Invoicing)"]
        ANALYTICS["analytics-service :5009\n(Admin Metrics Aggregation)"]
    end

    subgraph Storage["Persistence Plane"]
        DB[("MongoDB :27017\n(Isolated DB Per Microservice)")]
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

## 🧭 Microservices Directory

| Service | Directory | Port | Database | Domain & Core Responsibilities |
|---|---|---|---|---|
| **frontend** | `frontend/` | **3000** | *None* | React 18 + Vite SPA, Leaflet OpenStreetMap, GPS routing, dark dashboard |
| **api-gateway** | `services/api-gateway/` | **5000** | *None* | Reverse proxy, rate limiting (100 req/min), route security & error standardizer |
| **auth-service** | `services/auth-service/` | **5001** | `auth_db` | User identity, RBAC (`SYSTEM_ADMIN`, `USER`), password hashing (Bcrypt), JWT |
| **ev-service** | `services/ev-service/` | **5002** | `ev_db` | EV fleet management, telemetry, battery capacity, current SoC |
| **station-service** | `services/station-service/` | **5003** | `station_db` | Charging station directory, chargers, slot states (`FREE\|BOOKED\|CHARGING`) |
| **booking-service** | `services/booking-service/` | **5004** | `booking_db` | Slot reservations, queue management, cancellation lifecycles |
| **decision-service** | `services/decision-service/` | **5005** | *None* | Autonomous multi-criteria ranking algorithm (Haversine distance, speed, price, queue) |
| **charging-service** | `services/charging-service/` | **5006** | `charging_db` | Live charging session simulation with battery power ramp curve & speedup |
| **payment-service** | `services/payment-service/` | **5007** | `payment_db` | Billing calculations (`energyKwh * tariff`), invoicing, payment checkout |
| **notification-service** | `services/notification-service/` | **5008** | `notification_db`| In-app event alerts, booking updates, and notification history |
| **analytics-service** | `services/analytics-service/` | **5009** | `analytics_db` | Fleet intelligence, daily power consumption, revenue, and utilization stats |

---

## 🔑 Demo Login Credentials

Pre-seeded accounts ready for immediate demonstration:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **System Admin** | `admin@ev.com` | `Admin@123` | Full access to Admin Dashboard, Analytics, Fleet, Stations, and Global Queues |
| **EV Driver / User** | `user@ev.com` | `User@123` | Route planner, slot reservation, charging simulator, and payment checkout |

---

## 🚀 Running the System

### Option 1: Instant Run from Docker Hub (Fastest — No Source Build Required)

All 11 microservices are pre-built, tested, and published to Docker Hub under [`axar9408/autonomous-ev-charging-system`](https://hub.docker.com/r/axar9408/autonomous-ev-charging-system/tags).

```bash
# Pull and start all 11 microservices + MongoDB with one command:
docker compose -f docker-compose.hub.yml up -d

# Check running status:
docker compose -f docker-compose.hub.yml ps

# Open in browser:
# http://localhost:3000
```

To stop:
```bash
docker compose -f docker-compose.hub.yml down
```

---

### Option 2: Local Development Build (Docker Compose)

```bash
# 1. Clone the repository
git clone https://github.com/classaxar/Autonomous-EV-Charging-System.git
cd Autonomous-EV-Charging-System

# 2. Setup environment variables
cp .env.example .env

# 3. Build images locally and launch
docker compose up -d --build

# 4. View logs or check status
docker compose ps
docker compose logs -f api-gateway
```

---

### Option 3: Production Kubernetes Deployment (`infra/kubernetes/`)

Deploy to any Kubernetes cluster (Minikube, Kind, or Cloud K8s):

```bash
# 1. Start Minikube & enable metrics-server
minikube start --cpus=4 --memory=8192
minikube addons enable metrics-server

# 2. Deploy all manifests in order
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secret.yaml
kubectl apply -f infra/kubernetes/mongodb.yaml
kubectl apply -f infra/kubernetes/auth-service.yaml
kubectl apply -f infra/kubernetes/ev-service.yaml
kubectl apply -f infra/kubernetes/station-service.yaml
kubectl apply -f infra/kubernetes/booking-service.yaml
kubectl apply -f infra/kubernetes/decision-service.yaml
kubectl apply -f infra/kubernetes/charging-service.yaml
kubectl apply -f infra/kubernetes/payment-service.yaml
kubectl apply -f infra/kubernetes/notification-service.yaml
kubectl apply -f infra/kubernetes/analytics-service.yaml
kubectl apply -f infra/kubernetes/api-gateway.yaml
kubectl apply -f infra/kubernetes/frontend.yaml
kubectl apply -f infra/kubernetes/ingress.yaml
kubectl apply -f infra/kubernetes/hpa.yaml

# 3. Watch pods transition to Running / Ready
kubectl get pods -n ev-system -w

# 4. Access Frontend
minikube service frontend -n ev-system
```

*(See [scripts/k8s-demo.md](scripts/k8s-demo.md) for automated chaos testing, pod scaling, and self-healing demos).*

---

## 🐳 Docker Hub Unified Repository

All 11 microservices are hosted under one single repository on Docker Hub:
👉 **[https://hub.docker.com/r/axar9408/autonomous-ev-charging-system/tags](https://hub.docker.com/r/axar9408/autonomous-ev-charging-system/tags)**

| Service | Tagged Image in Unified Repo |
|---|---|
| **frontend** | `axar9408/autonomous-ev-charging-system:frontend` |
| **api-gateway** | `axar9408/autonomous-ev-charging-system:api-gateway` |
| **auth-service** | `axar9408/autonomous-ev-charging-system:auth-service` |
| **ev-service** | `axar9408/autonomous-ev-charging-system:ev-service` |
| **station-service** | `axar9408/autonomous-ev-charging-system:station-service` |
| **booking-service** | `axar9408/autonomous-ev-charging-system:booking-service` |
| **decision-service** | `axar9408/autonomous-ev-charging-system:decision-service` |
| **charging-service** | `axar9408/autonomous-ev-charging-system:charging-service` |
| **payment-service** | `axar9408/autonomous-ev-charging-system:payment-service` |
| **notification-service** | `axar9408/autonomous-ev-charging-system:notification-service` |
| **analytics-service** | `axar9408/autonomous-ev-charging-system:analytics-service` |

---

## 🔒 Security Architecture

- **Public Traffic**: Authenticated via JWT bearer tokens (`HS256`) checked at the API Gateway.
- **Service-to-Service**: Internal routes (`/internal/*`) blocked from external callers and secured using `x-internal-key`.
- **Standardized Response Envelope**: Every response adheres strictly to the envelope standard: `{ "success": boolean, "data": ..., "message": "..." }`.

---

## 👨‍💻 Author & Developer

**Developed and engineered by Axar**
- **GitHub:** [@classaxar](https://github.com/classaxar)
- **Docker Hub:** [axar9408](https://hub.docker.com/u/axar9408)

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
