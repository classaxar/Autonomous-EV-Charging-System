# scripts/check-health.ps1
# Pings /health on all 10 microservices and reports their status

$services = @(
  @{ name="api-gateway"; port=5000 },
  @{ name="auth-service"; port=5001 },
  @{ name="ev-service"; port=5002 },
  @{ name="station-service"; port=5003 },
  @{ name="booking-service"; port=5004 },
  @{ name="decision-service"; port=5005 },
  @{ name="charging-service"; port=5006 },
  @{ name="payment-service"; port=5007 },
  @{ name="notification-service"; port=5008 },
  @{ name="analytics-service"; port=5009 }
)

Write-Host "`n=== Microservices Health Check ===" -ForegroundColor Cyan

$allPass = $true
foreach ($s in $services) {
  $url = "http://localhost:$($s.port)/health"
  try {
    $res = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3 -ErrorAction Stop
    if ($res.success -and $res.data.status -eq "UP") {
      Write-Host "✅ $($s.name.PadRight(22)) :$($s.port) -> UP" -ForegroundColor Green
    } else {
      Write-Host "⚠️ $($s.name.PadRight(22)) :$($s.port) -> UNEXPECTED RESPONSE ($($res | ConvertTo-Json -Compress))" -ForegroundColor Yellow
      $allPass = $false
    }
  } catch {
    Write-Host "❌ $($s.name.PadRight(22)) :$($s.port) -> DOWN / UNREACHABLE ($($_.Exception.Message))" -ForegroundColor Red
    $allPass = $false
  }
}

Write-Host "==================================`n" -ForegroundColor Cyan
if ($allPass) {
  Write-Host "🎉 All services healthy!" -ForegroundColor Green
} else {
  Write-Host "⚠️ Some services are unreachable or reported issues." -ForegroundColor Yellow
}
