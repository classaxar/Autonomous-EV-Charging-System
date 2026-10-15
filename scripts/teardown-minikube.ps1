# teardown-minikube.ps1 - Clean up Autonomous EV Charging System from Minikube
# Run from repository root: .\scripts\teardown-minikube.ps1

Write-Host "==========================================================" -ForegroundColor Red
Write-Host "🗑️ Deleting Autonomous EV Charging System from Minikube" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Red

Write-Host "`nDeleting namespace 'ev-system' and all associated resources..." -ForegroundColor Yellow
kubectl delete namespace ev-system

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
