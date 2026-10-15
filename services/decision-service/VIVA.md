# Decision Service Viva Notes

## Formula
Each station receives normalized battery, distance, queue, price, and speed sub-scores. The weighted sum is normalized by the total weights.

## Why autonomous?
The service selects a station from current availability, price, distance, queue, and vehicle constraints without requiring the user to compare stations manually.

## Why stateless?
Recommendations are derived from request data and current station data, so no decision database is required. This makes horizontal scaling straightforward.

## Battery priority
Low battery increases the battery score and changes the label to HIGH at 15% or below, MEDIUM through 40%, and LOW above 40%.

## Availability
Stations with zero available chargers are excluded before scoring.

## Failure behavior
Station-service failures return an explicit 503 envelope rather than a misleading recommendation.

## Scaling
The service can run multiple replicas behind the gateway because requests do not depend on local state.

## Worked example

| Station | Distance | Queue | Price | Power | Decision |
|---|---:|---:|---:|---:|---|
| A | 1.2 km | 1 | 12 | 50 kW | Strong nearby option |
| B | 3.0 km | 0 | 10 | 30 kW | Cheaper, slower |
| C | 2.0 km | 2 | 9 | 60 kW | Cheapest, longer queue |
