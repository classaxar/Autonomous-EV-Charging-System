# Autonomous EV Charging System

> Full-stack autonomous EV charging platform — microservices monorepo.

## Team

| Dev | Role | Owns |
|---|---|---|
| A | Platform | api-gateway, auth-service, notification-service, infra |
| B | Core Domain | ev-service, station-service, booking-service |
| C | Intelligence | decision-service, charging-service, payment-service, analytics-service |

## Stack

Node 20 · Express 4 · MongoDB · Docker · Kubernetes · React + Vite

## Quick Start

```bash
cp .env.example .env   # fill secrets
docker compose up --build
```

See `docs/architecture.md` for the full diagram.
