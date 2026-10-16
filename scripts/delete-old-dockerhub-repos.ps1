# Script to delete the 11 old scattered repositories from Docker Hub
# Leaving axar9408/autonomous-ev-charging-system untouched

$credRaw = "https://index.docker.io/v1/access-token" | & "docker-credential-desktop" get
$cred = $credRaw | ConvertFrom-Json
$token = $cred.Secret

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/json"
}

# First test if Bearer works or if JWT is needed
Write-Host "Verifying token against Docker Hub API..." -ForegroundColor Cyan
try {
    $test = Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/axar9408/?page_size=25" -Headers $headers -Method Get
    Write-Host "Successfully authenticated with Bearer token!" -ForegroundColor Green
} catch {
    Write-Host "Bearer failed, trying JWT..." -ForegroundColor Yellow
    $headers["Authorization"] = "JWT $token"
    try {
        $test = Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/axar9408/?page_size=25" -Headers $headers -Method Get
        Write-Host "Successfully authenticated with JWT header!" -ForegroundColor Green
    } catch {
        Write-Host "Auth Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$reposToDelete = @(
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

Write-Host "`nRepositories currently in Docker Hub account:" -ForegroundColor Cyan
foreach ($r in $test.results) {
    Write-Host " - $($r.name)" -ForegroundColor White
}

Write-Host "`nDeleting the 11 standalone repositories from Docker Hub..." -ForegroundColor Yellow

foreach ($repo in $reposToDelete) {
    $delUrl = "https://hub.docker.com/v2/repositories/axar9408/$repo/"
    try {
        Write-Host "Deleting axar9408/$repo ... " -NoNewline
        $resp = Invoke-RestMethod -Uri $delUrl -Headers $headers -Method Delete
        Write-Host "DELETED" -ForegroundColor Green
    } catch {
        Write-Host "FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "`nDocker Hub Cleanup Completed!" -ForegroundColor Green
