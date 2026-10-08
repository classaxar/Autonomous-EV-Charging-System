# Kubernetes Demonstration Guide: Autonomous EV Charging System

This guide provides step-by-step instructions for deploying, inspecting, scaling, and demonstrating the resilience of the **Autonomous EV Charging System** on Kubernetes (Minikube / Kind / Managed K8s).

---

## 1. Prerequisites & Metrics Server

Ensure `kubectl` and a Kubernetes cluster are running:
```bash
# Start Minikube (if local)
minikube start --cpus=4 --memory=8192

# Enable Metrics Server for HPA autoscaling
minikube addons enable metrics-server

# Verify metrics-server is active
kubectl get deployment metrics-server -n kube-system
```

---

## 2. Manifest Apply Order

Deploy the complete system into the isolated `ev-system` namespace in order of dependency:

```bash
# Step 1: Create Namespace
kubectl apply -f infra/kubernetes/namespace.yaml

# Step 2: ConfigMap and Secrets
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secret.yaml

# Step 3: MongoDB Persistent Storage & Service
kubectl apply -f infra/kubernetes/mongodb.yaml

# Step 4: Core Domain & Intelligence Microservices
kubectl apply -f infra/kubernetes/auth-service.yaml
kubectl apply -f infra/kubernetes/ev-service.yaml
kubectl apply -f infra/kubernetes/station-service.yaml
kubectl apply -f infra/kubernetes/booking-service.yaml
kubectl apply -f infra/kubernetes/decision-service.yaml
kubectl apply -f infra/kubernetes/charging-service.yaml
kubectl apply -f infra/kubernetes/payment-service.yaml
kubectl apply -f infra/kubernetes/notification-service.yaml
kubectl apply -f infra/kubernetes/analytics-service.yaml

# Step 5: API Gateway & Frontend UI
kubectl apply -f infra/kubernetes/api-gateway.yaml
kubectl apply -f infra/kubernetes/frontend.yaml

# Step 6: Ingress & Horizontal Pod Autoscalers (HPA)
kubectl apply -f infra/kubernetes/ingress.yaml
kubectl apply -f infra/kubernetes/hpa.yaml
```

---

## 3. Monitor Rollout & Pod Status

Watch pods transition from `ContainerCreating` to `Running` and passing readiness probes:
```bash
kubectl get pods -n ev-system -w
```

Check all deployments and services:
```bash
kubectl get deployments,services,hpa -n ev-system
```

---

## 4. Viva & Live Demonstration Scenarios

### Scenario A: Self-Healing Pods (Resilience Demo)
Delete any active pod and observe Kubernetes immediately reconciling the desired replica state:
```bash
# List pods
kubectl get pods -n ev-system -l app=decision-service

# Kill one pod
kubectl delete pod $(kubectl get pods -n ev-system -l app=decision-service -o jsonpath='{.items[0].metadata.name}') -n ev-system

# Observe instantaneous recreation
kubectl get pods -n ev-system -l app=decision-service -w
```

### Scenario B: Rolling Update with Zero Downtime
Demonstrate updating a service with rolling deployment strategy:
```bash
kubectl set image deployment/decision-service decision-service=autonomous-ev/decision-service:v1.0 -n ev-system

# Watch rolling rollout status
kubectl rollout status deployment/decision-service -n ev-system
```

### Scenario C: Horizontal Pod Autoscaler (HPA) Load Test
Generate synthetic CPU load on `decision-service` to demonstrate dynamic horizontal scaling from 2 to 4+ replicas:
```bash
# Watch HPA metrics in real time
kubectl get hpa -n ev-system -w

# In a separate terminal, launch a load-generating job:
kubectl run -i --tty load-generator --rm --image=busybox:1.35 --restart=Never -n ev-system -- /bin/sh -c "while true; do wget -q -O- http://decision-service:5005/health; done"

# Observe decision-service scaling:
kubectl get deployment decision-service -n ev-system
```

### Scenario D: Manual Scaling
Scale any service on-demand:
```bash
kubectl scale deployment/decision-service --replicas=5 -n ev-system
kubectl get pods -n ev-system -l app=decision-service
```
