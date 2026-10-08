# Autonomous EV Charging System: End-to-End Demo Script

This document details the step-by-step verification and viva demonstration sequence for the Autonomous EV Charging System.

---

## 1. System Launch

Start the complete 10-microservice cluster and UI with Docker Compose:

```bash
# Copy environment variables
cp .env.example .env

# Build and start all containers in detached mode
docker compose up -d --build

# Verify all services and MongoDB report healthy
docker compose ps
```

Health endpoint check across services:
```bash
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health
curl http://localhost:5005/health
curl http://localhost:5006/health
curl http://localhost:5007/health
curl http://localhost:5008/health
curl http://localhost:5009/health
curl http://localhost:3000/health
```

---

## 2. Walkthrough Flow (50% & 100% Milestones)

### Step 1: User Registration & Authentication (Dev A: `auth-service`)
1. Open the Frontend at `http://localhost:3000`.
2. Register a new user:
   - **Name**: "Alex Driver"
   - **Email**: `alex@ev.com`
   - **Password**: `password123`
3. Or log in with the pre-seeded account:
   - **User**: `user@ev.com` / `user123`
   - **Admin**: `admin@ev.com` / `admin123`
4. The system validates credentials, issues a JWT token, stores it in `localStorage` (`ev_token`), and redirects to `/dashboard`.

### Step 2: Vehicle Management (Dev B: `ev-service`)
1. On `/dashboard`, view the connected vehicle status.
2. Navigate to `/ev` ("My EVs") to view or register vehicles.
3. Observe registered battery percentage (e.g. 15% - Low Battery).

### Step 3: Autonomous Station Recommendation (Dev C: `decision-service`)
1. From `/dashboard` or `/recommend`, click **"Find Best Charger"**.
2. Select vehicle with battery 15% and target 80%.
3. The intelligence scoring engine calculates:
   - Distance (Haversine formula from current location)
   - Queue wait time
   - Charger power rating & pricing
   - Low-battery priority boost ($1.5 \times$)
4. Station A (`ST101`, 50 kW Fast Charger Hub) ranks #1 with reasoning "Nearest available charger, low queue, high battery priority".

### Step 4: Slot Reservation & Booking (Dev B: `booking-service`)
1. On the recommendation card, click **"Book Now"**.
2. The user is navigated to `/booking` with prefilled `stationId: ST101` and first available `slotId`.
3. Confirm booking. Status flips to `CONFIRMED`.
4. Observe notification badge 🔔 in the navbar incrementing with `BOOKING_CONFIRMED`.

### Step 5: Live Charging Telemetry (Dev C: `charging-service`)
1. Navigate to `/charging/:sessionId`.
2. Observe simulated battery rise from 15% towards 80% at accelerated simulation speed (`SIM_SPEEDUP=60`).
3. Session automatically completes at target; slot releases to `FREE`.
4. Notification arrives: `CHARGING_COMPLETED`.

### Step 6: Billing & Settlement (Dev C: `payment-service`)
1. Auto-redirected to `/payment`.
2. View kilowatt-hours delivered and invoice total ($kWh \times rate$).
3. Click **"Pay Now"**. Status updates to `PAID`.
4. Notification arrives: `PAYMENT_SUCCESS`.

### Step 7: System Analytics & Admin Dashboard (Dev A: `analytics-service` / `/admin`)
1. Switch to user `admin@ev.com`.
2. Navigate to `/admin`.
3. View real-time aggregated metrics: Total revenue, total energy dispensed, active charging sessions, and daily breakdown bar chart.

---

## 3. Teardown

```bash
docker compose down -v
```
