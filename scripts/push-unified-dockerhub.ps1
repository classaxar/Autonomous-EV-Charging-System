# Push all microservices under ONE unified repository on Docker Hub
# Repository: axar9408/autonomous-ev-charging-system:<service-tag>

$DOCKER_USER = "axar9408"
$REPO_NAME = "autonomous-ev-charging-system"

$services = @(
    "frontend",
    "api-gateway",
    "auth-service",
    "ev-service",
    "station-service",
    "booking-service",
    "decision-service",
    "charging-service",
    "payment-service",
    "notification-service",
    "analytics-service"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Pushing All Services Under Unified Repository: $DOCKER_USER/$REPO_NAME" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

foreach ($svc in $services) {
    $localImage = "autonomous-ev-system-$svc`:latest"
    $remoteTag = "$DOCKER_USER/$REPO_NAME`:$svc"
    $remoteTagV1 = "$DOCKER_USER/$REPO_NAME`:$svc-v1.0"

    Write-Host "`n---> Tagging & Pushing $svc ..." -ForegroundColor Yellow
    docker tag $localImage $remoteTag
    docker tag $localImage $remoteTagV1

    docker push $remoteTag
    docker push $remoteTagV1
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "SUCCESS! All 11 services are unified under one Docker Hub repository:" -ForegroundColor Green
Write-Host "https://hub.docker.com/r/$DOCKER_USER/$REPO_NAME/tags" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
