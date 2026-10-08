# System Architecture: Autonomous EV Charging System

## 1. Overview

The **Autonomous EV Charging System** is a distributed, resilient microservices platform designed to orchestrate intelligent electric vehicle routing, real-time charging slot management, queue-aware load balancing, simulated smart charging, and automated payment/notification pipelines.

```mermaid
flowchart TB
    subgraph ClientTier["Presentation Tier (:3000)"]
        UI["React 18 + Vite SPA\n(Client-side Routing, Auth Context, Polling)"]
    end

    subgraph GatewayTier["API Gateway (:5000)"]
        GW["API Gateway\n(Reverse Proxy, CORS, Error Envelope, Blocks /internal)"]
    end

    subgraph PlatformServices["Platform Services (Dev A)"]
        AUTH["auth-service :5001\n(JWT HS256, Bcrypt, RBAC)"]
        NOTIF["notification-service :5008\n(User In-App Notifications)"]
    end

    subgraph CoreDomainServices["Core Domain Services (Dev B)"]
        EV["ev-service :5002\n(Vehicle CRUD, Battery Tracking)"]
        STATION["station-service :5003\n(Stations, Slots, Queues, Seed Data)"]
        BOOKING["booking-service :5004\n(Slot Reservation & Lifecycle)"]
    end

    subgraph IntelligenceServices["Intelligence & Operations (Dev C)"]
        DECISION["decision-service :5005\n(Stateless Multi-Factor Recommendation)"]
        CHARGING["charging-service :5006\n(Simulation Engine, Battery Ramp)"]
        PAYMENT["payment-service :5007\n(Tariff Calculation, Simulated Checkout)"]
        ANALYTICS["analytics-service :5009\n(Admin Metrics Aggregation)"]
    end

    subgraph DataPlane["Data Plane"]
        MDB[("MongoDB :27017\n(auth_db, ev_db, station_db, booking_db,\ncharging_db, payment_db, notification_db, analytics_db)")]
    end

    %% External & Client traffic
    UI -->|HTTP / REST| GW

    %% Gateway Routing
    GW -->|/api/auth| AUTH
    GW -->|/api/ev| EV
    GW -->|/api/stations| STATION
    GW -->|/api/bookings| BOOKING
    GW -->|/api/decision| DECISION
    GW -->|/api/charging| CHARGING
    GW -->|/api/payments| PAYMENT
    GW -->|/api/notifications| NOTIF
    GW -->|/api/analytics| ANALYTICS

    %% Inter-service calls (x-internal-key)
    DECISION -.->|GET /api/stations (forwards JWT)| STATION
    BOOKING -.->|PATCH /internal/stations/:id/slots/:slotId| STATION
    CHARGING -.->|PATCH /internal/bookings/:id/status| BOOKING
    CHARGING -.->|PATCH /internal/stations/:id/slots/:slotId| STATION
    CHARGING -.->|PATCH /internal/ev/:id/battery| EV
    CHARGING -.->|POST /internal/payments| PAYMENT
    CHARGING -.->|POST /internal/notifications| NOTIF
    BOOKING -.->|POST /internal/notifications| NOTIF
    ANALYTICS -.->|GET /internal/charging/all| CHARGING
    ANALYTICS -.->|GET /internal/payments/all| PAYMENT

    %% Database connections
    AUTH --> MDB
    EV --> MDB
    STATION --> MDB
    BOOKING --> MDB
    CHARGING --> MDB
    PAYMENT --> MDB
    NOTIF --> MDB
    ANALYTICS --> MDB
```

---

## 2. Port & Service Directory

| Service | Folder | Port | Database | Ownership |
|---|---|---|---|---|
| **API Gateway** | `services/api-gateway/` | 5000 | *none* | Dev A |
| **Auth Service** | `services/auth-service/` | 5001 | `auth_db` | Dev A |
| **EV Service** | `services/ev-service/` | 5002 | `ev_db` | Dev B |
| **Station Service** | `services/station-service/` | 5003 | `station_db` | Dev B |
| **Booking Service** | `services/booking-service/` | 5004 | `booking_db` | Dev B |
| **Decision Service** | `services/decision-service/` | 5005 | *none (stateless)* | Dev C |
| **Charging Service** | `services/charging-service/` | 5006 | `charging_db` | Dev C |
| **Payment Service** | `services/payment-service/` | 5007 | `payment_db` | Dev C |
| **Notification Service** | `services/notification-service/` | 5008 | `notification_db` | Dev A |
| **Analytics Service** | `services/analytics-service/` | 5009 | `analytics_db` | Dev C |
| **Frontend SPA** | `frontend/` | 3000 | *none* | Dev A (Shell), B, C (Pages) |
| **MongoDB** | Container | 27017 | Database server | Shared Infra |

---

## 3. Security Model

1. **Client Authentication**:
   - Header: `Authorization: Bearer <token>`
   - Algorithm: `HS256`, shared `JWT_SECRET`, 1 day expiration.
   - Claims: `{ userId, role: "USER"|"STATION_ADMIN"|"SYSTEM_ADMIN", email }`.
2. **Service-to-Service Authorization**:
   - Header: `x-internal-key: $INTERNAL_KEY`.
   - Never exposed or proxied through the API Gateway.
   - Gateway strictly drops/blocks external `/internal/*` routes.
3. **Response Envelope**:
   ```json
   {
     "success": true,
     "data": {},
     "message": "ok"
   }
   ```
