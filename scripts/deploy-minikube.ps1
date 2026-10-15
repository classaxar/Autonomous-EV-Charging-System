# deploy-minikube.ps1 - Automated Minikube Deployment for Autonomous EV Charging System
# Run from repository root: .\scripts\deploy-minikube.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⚡ Deploying Autonomous EV Charging System to Minikube" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Minikube status
Write-Host "`n[1/5] Checking Minikube status..." -ForegroundColor Yellow
$status = minikube status 2>&1
if ($status -match "host: Running" -and $status -match "apiserver: Running") {
    Write-Host "✅ Minikube is up and running." -ForegroundColor Green
} else {
    Write-Host "⚠️ Minikube is not running. Starting Minikube..." -ForegroundColor Yellow
    minikube start --cpus=4 --memory=8192
}

# 2. Enable metrics-server for HPA
Write-Host "`n[2/5] Enabling metrics-server for HPA autoscaling..." -ForegroundColor Yellow
minikube addons enable metrics-server

# 3. Tag and load local container images into Minikube
Write-Host "`n[3/5] Tagging and loading images into Minikube..." -ForegroundColor Yellow
$services = @(
    "auth-service",
    "ev-service",
    "station-service",
    "booking-service",
    "decision-service",
    "charging-service",
    "payment-service",
    "notification-service",
    "analytics-service",
    "api-gateway",
    "frontend"
)

foreach ($svc in $services) {
    $localTag = "autonomous-ev-system-$svc`:latest"
    $k8sTag = "autonomous-ev/$svc`:v1.0"
    
    Write-Host "  -> Tagging $localTag as $k8sTag..." -ForegroundColor DarkGray
    docker tag $localTag $k8sTag
    
    Write-Host "  -> Loading $k8sTag into Minikube..." -ForegroundColor Cyan
    minikube image load $k8sTag
}

Write-Host "  -> Loading mongo:7 into Minikube..." -ForegroundColor Cyan
minikube image load mongo:7

# 4. Apply Kubernetes manifests in dependency order
Write-Host "`n[4/5] Applying Kubernetes manifests in namespace 'ev-system'..." -ForegroundColor Yellow

$manifests = @(
    "infra/kubernetes/namespace.yaml",
    "infra/kubernetes/configmap.yaml",
    "infra/kubernetes/secret.yaml",
    "infra/kubernetes/mongodb.yaml",
    "infra/kubernetes/auth-service.yaml",
    "infra/kubernetes/ev-service.yaml",
    "infra/kubernetes/station-service.yaml",
    "infra/kubernetes/booking-service.yaml",
    "infra/kubernetes/decision-service.yaml",
    "infra/kubernetes/charging-service.yaml",
    "infra/kubernetes/payment-service.yaml",
    "infra/kubernetes/notification-service.yaml",
    "infra/kubernetes/analytics-service.yaml",
    "infra/kubernetes/api-gateway.yaml",
    "infra/kubernetes/frontend.yaml",
    "infra/kubernetes/hpa.yaml"
)

foreach ($manifest in $manifests) {
    Write-Host "  -> Applying $manifest..." -ForegroundColor DarkGray
    kubectl apply -f $manifest
}

# 5. Display deployment summary
Write-Host "`n[5/5] Manifests applied successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 System is deploying in namespace: ev-system" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`nUseful commands to check status:" -ForegroundColor Cyan
Write-Host "  kubectl get pods -n ev-system -w           # Watch pods initialize"
Write-Host "  kubectl get svc -n ev-system               # Check services and NodePorts"
Write-Host "  kubectl get hpa -n ev-system               # Check horizontal pod autoscalers"

Write-Host "`nTo open the frontend app in your browser, run:" -ForegroundColor Yellow
Write-Host "  minikube service frontend -n ev-system" -ForegroundColor White

Write-Host "`nTo access API Gateway directly, run:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward -n ev-system svc/api-gateway 5000:5000" -ForegroundColor White
