# Station Service

The station service owns station metadata, charger slots, availability, and queue counts.

## Endpoints

Public station reads are available through the gateway. Station writes require a `STATION_ADMIN` or `SYSTEM_ADMIN` JWT.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/stations` | List stations with derived availability |
| GET | `/api/stations/:id` | Read one station |
| GET | `/api/stations/:id/slots` | List station slots |
| POST | `/api/stations` | Create a station |
| PUT | `/api/stations/:id` | Update station metadata |
| PUT | `/api/stations/:id/slots/:slotId` | Admin slot update |
| DELETE | `/api/stations/:id` | Delete a station |
| PATCH | `/internal/stations/:id/slots/:slotId` | Atomic service slot update |
| PATCH | `/internal/stations/:id/queue` | Increment or decrement queue |

Slot statuses are `FREE`, `BOOKED`, `CHARGING`, and `OFFLINE`. `availableChargers` is recomputed from FREE slots.

## Model and seed data

Stations contain location, charger power, price, total chargers, availability, queue length, and embedded slots.
An empty database is seeded with three stations.

## Run

```powershell
npm install
npm test
npm start
```

Required environment variables are listed in `.env.example`. The default port is `5003`.
