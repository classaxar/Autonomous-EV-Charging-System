# push-dockerhub.ps1 - Automated Docker Hub Upload Script
# Pushes all Autonomous EV System images to unified repository:
# axar9408/autonomous-ev-charging-system:<service-tag>

param (
    [string]$DockerUser = "axar9408",
    [string]$RepoName = "autonomous-ev-charging-system",
    [string]$VersionTag = "v1.0"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Pushing Autonomous EV System Images to Unified Docker Hub" -ForegroundColor Cyan
Write-Host "   Repository: $DockerUser/$RepoName" -ForegroundColor Yellow
Write-Host "   Tags: <service>, <service>-$VersionTag" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

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

$total = $services.Count
$current = 0

foreach ($svc in $services) {
    $current++
    $local = "autonomous-ev-system-$svc`:latest"
    $remoteTag = "$DockerUser/$RepoName`:$svc"
    $remoteVer = "$DockerUser/$RepoName`:$svc-$VersionTag"

    Write-Host "`n[$current/$total] Processing $svc..." -ForegroundColor Cyan

    # Tag
    Write-Host "  -> Tagging $local -> $remoteTag & $remoteVer" -ForegroundColor DarkGray
    docker tag $local $remoteTag
    docker tag $local $remoteVer

    # Push
    Write-Host "  -> Pushing $remoteTag..." -ForegroundColor Green
    docker push $remoteTag
    docker push $remoteVer
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "🎉 All $total services successfully uploaded to Unified Repository!" -ForegroundColor Green
Write-Host "   Verify at: https://hub.docker.com/r/$DockerUser/$RepoName/tags" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
