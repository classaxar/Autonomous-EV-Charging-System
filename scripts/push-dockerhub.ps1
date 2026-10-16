# push-dockerhub.ps1 - Automated Docker Hub Upload Script
# Pushes all Autonomous EV System images to axar9408/<service>

param (
    [string]$DockerUser = "axar9408",
    [string]$VersionTag = "v1.0"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Pushing Autonomous EV System Images to Docker Hub" -ForegroundColor Cyan
Write-Host "   Target Account: $DockerUser" -ForegroundColor Yellow
Write-Host "   Tags: latest, $VersionTag" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$services = @(
    @{ Name = "frontend"; Local = "autonomous-ev-system-frontend:latest" },
    @{ Name = "api-gateway"; Local = "autonomous-ev-system-api-gateway:latest" },
    @{ Name = "auth-service"; Local = "autonomous-ev-system-auth-service:latest" },
    @{ Name = "ev-service"; Local = "autonomous-ev-system-ev-service:latest" },
    @{ Name = "station-service"; Local = "autonomous-ev-system-station-service:latest" },
    @{ Name = "booking-service"; Local = "autonomous-ev-system-booking-service:latest" },
    @{ Name = "decision-service"; Local = "autonomous-ev-system-decision-service:latest" },
    @{ Name = "charging-service"; Local = "autonomous-ev-system-charging-service:latest" },
    @{ Name = "payment-service"; Local = "autonomous-ev-system-payment-service:latest" },
    @{ Name = "notification-service"; Local = "autonomous-ev-system-notification-service:latest" },
    @{ Name = "analytics-service"; Local = "autonomous-ev-system-analytics-service:latest" }
)

$total = $services.Count
$current = 0

foreach ($svc in $services) {
    $current++
    $name = $svc.Name
    $local = $svc.Local
    $remoteLatest = "$DockerUser/$name`:latest"
    $remoteVer = "$DockerUser/$name`:$VersionTag"

    Write-Host "`n[$current/$total] Processing $name..." -ForegroundColor Cyan

    # Tag latest
    Write-Host "  -> Tagging $local -> $remoteLatest" -ForegroundColor DarkGray
    docker tag $local $remoteLatest
    docker tag $local $remoteVer

    # Push latest
    Write-Host "  -> Pushing $remoteLatest..." -ForegroundColor Green
    docker push $remoteLatest

    # Push version tag
    Write-Host "  -> Pushing $remoteVer..." -ForegroundColor Green
    docker push $remoteVer
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "🎉 All $total services successfully uploaded to Docker Hub!" -ForegroundColor Green
Write-Host "   Verify at: https://hub.docker.com/u/$DockerUser" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
