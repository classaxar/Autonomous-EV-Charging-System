#!/usr/bin/env bash
set -e

# Docker registry / namespace
DOCKER_USER="${DOCKER_USER:-autonomous-ev}"
TAG="${TAG:-v1.0}"

echo "=========================================================="
echo " Building & Pushing Autonomous EV Images ($DOCKER_USER:$TAG)"
echo "=========================================================="

SERVICES=(
  "api-gateway:services/api-gateway"
  "auth-service:services/auth-service"
  "ev-service:services/ev-service"
  "station-service:services/station-service"
  "booking-service:services/booking-service"
  "decision-service:services/decision-service"
  "charging-service:services/charging-service"
  "payment-service:services/payment-service"
  "notification-service:services/notification-service"
  "analytics-service:services/analytics-service"
  "frontend:frontend"
)

for item in "${SERVICES[@]}"; do
  SVC_NAME="${item%%:*}"
  SVC_PATH="${item##*:}"
  IMAGE_NAME="${DOCKER_USER}/${SVC_NAME}:${TAG}"

  echo "--> Building ${IMAGE_NAME} from ${SVC_PATH}..."
  docker build -t "${IMAGE_NAME}" "${SVC_PATH}"

  echo "--> Pushing ${IMAGE_NAME}..."
  docker push "${IMAGE_NAME}" || echo "Warning: Push failed for ${IMAGE_NAME} (ensure docker login is executed)"
done

echo "=========================================================="
echo " All images built and processed!"
echo "=========================================================="
