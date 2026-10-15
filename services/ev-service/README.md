# EV Service

The EV service owns user vehicles and their current battery state.

## Endpoints

All `/api/ev` routes require a JWT. A USER can access only their own vehicles.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ev` | Create a vehicle |
| GET | `/api/ev` | List the authenticated user's vehicles |
| GET | `/api/ev/:id` | Read one owned vehicle |
| PUT | `/api/ev/:id` | Update one owned vehicle |
| DELETE | `/api/ev/:id` | Delete one owned vehicle |
| PATCH | `/internal/ev/:id/battery` | Update battery from another service |

## Model

`vehicleId`, `userId`, `brand`, `model`, `batteryCapacity`, `currentBattery`, and `maxChargingPower`.
Battery percentages must be between 0 and 100.

## Run

```powershell
npm install
npm test
npm start
```

Required environment variables are listed in `.env.example`. The default port is `5002`.
