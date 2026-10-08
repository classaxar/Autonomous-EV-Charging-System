#!/usr/bin/env bash
# scripts/check-health.sh
# Health check script for all 10 microservices

PORTS=(5000 5001 5002 5003 5004 5005 5006 5007 5008 5009)
NAMES=(
  "api-gateway"
  "auth-service"
  "ev-service"
  "station-service"
  "booking-service"
  "decision-service"
  "charging-service"
  "payment-service"
  "notification-service"
  "analytics-service"
)

echo "=== Microservices Health Check ==="
ALL_PASS=true

for i in "${!PORTS[@]}"; do
  NAME="${NAMES[$i]}"
  PORT="${PORTS[$i]}"
  URL="http://localhost:${PORT}/health"

  RESPONSE=$(curl -s -m 3 "$URL" || echo "")
  if echo "$RESPONSE" | grep -q '"status":"UP"'; then
    printf "✅ %-22s :%s -> UP\n" "$NAME" "$PORT"
  else
    printf "❌ %-22s :%s -> DOWN / UNREACHABLE\n" "$NAME" "$PORT"
    ALL_PASS=false
  fi
done

echo "=================================="
if [ "$ALL_PASS" = true ]; then
  echo "🎉 All services healthy!"
  exit 0
else
  echo "⚠️ Some services are unreachable."
  exit 1
fi
