# Booking Service Viva Notes

## 1. What does the booking service own?

It owns reservations, booking status, user ownership, and coordination with the station service for slot and queue changes.

## 2. Why is each service assigned its own database?

Database-per-service keeps domain ownership clear, prevents accidental coupling, and lets each service evolve or scale independently.

## 3. How is a slot protected from double booking?

Booking first checks the slot and then asks station-service to perform a conditional atomic state change. Only one request can change a FREE slot to BOOKED; a competing request receives a conflict.

## 4. Why are internal endpoints separate from user endpoints?

Internal endpoints support trusted service-to-service workflows. They require `x-internal-key` and are never exposed through the API gateway.

## 5. What are the valid booking transitions?

The forward lifecycle is `PENDING -> CONFIRMED -> ACTIVE -> COMPLETED`. Cancellation is allowed only from `PENDING` or `CONFIRMED`; expired, cancelled, and completed bookings are terminal.

## 6. How does expiry work?

An interval scans confirmed bookings. When `startTime` is older than `EXPIRY_MINUTES`, it atomically claims the booking, marks it `EXPIRED`, frees its station slot, and decrements the queue.

## 7. How are downstream failures handled?

Service calls use a five-second timeout and one retry. Notification failures are non-fatal; booking reservation failures are returned as explicit errors so the client does not see a false success.

## 8. Why use REST between services?

REST with JSON envelopes is simple to inspect, easy to test with curl or Postman, and keeps service contracts explicit while allowing independent deployment.
