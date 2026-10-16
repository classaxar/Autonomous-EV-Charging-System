# 🚗 Autonomous EV Charging & Fleet Management System
## 🎓 Complete Presentation Master Guide — "All Under One Roof"

> **Quick Status**: All 11 Microservices are running on Docker & Minikube Kubernetes, fully pushed to GitHub (`main` & `develop`), and published to Docker Hub (`axar9408`).

---

## 📌 1. Master Links & Quick Access ("One Roof")

| Resource | Direct Link / Location | Purpose |
|---|---|---|
| 🌐 **Live Web Application** | [http://localhost:3000](http://localhost:3000) or [http://10.224.18.24:3000](http://10.224.18.24:3000) | Live interactive dashboard for user & fleet tracking |
| 🚪 **API Gateway** | [http://localhost:5000](http://localhost:5000) | Single entry point for all microservices |
| 🐳 **Docker Hub Profile** | [hub.docker.com/u/axar9408](https://hub.docker.com/u/axar9408) | All 11 production images published with `:latest` and `:v1.0` |
| 🐙 **GitHub Repository** | [github.com/classaxar/Autonomous-EV-Charging-System](https://github.com/classaxar/Autonomous-EV-Charging-System) | Full source code (`main` & `develop` branches synced) |
| 📄 **Comprehensive Word Report** | `Autonomous_EV_Charging_System_Comprehensive_Report.docx` | Full 10-section report with embedded Docker Desktop screenshot |
| ☸️ **Kubernetes Deployment** | `infra/kubernetes/` | Complete K8s manifests (Deployments, Services, ConfigMaps, Secrets) |

---

## 👥 2. 3-Person Team Division & What to Say to the Professor

### 👤 Person 1: Frontend, Interactive Maps & Docker Containerization
* **Assigned Modules:**
  * React Frontend UI Architecture & Dashboard layout
  * Interactive Live Map (Leaflet.js) showing EV live telemetry and charging stations
  * Dockerization (writing Dockerfiles, building multi-stage images, managing container networking)
* **What to Say:**
  > *"I was responsible for the user interface, the map visualization, and the containerization layer. I built the React application with an interactive live map that tracks vehicle coordinates and charging station statuses in real-time. On the DevOps side, I containerized each microservice with optimized Dockerfiles and orchestrated them using Docker Compose and pushed production-ready images to Docker Hub (`axar9408`)."*

---

### 👤 Person 2: User Management, Notifications, Billing & Verification (Easy & Clear Role)
* **Assigned Modules:**
  * Authentication & Authorization Service (JWT token handling, role-based access)
  * Notification Service (Email/Alert triggers upon booking, charging start/completion)
  * Payment & Billing Service (Fare calculations, wallet deductions, invoice generation)
  * System Testing & Verification (Health checks and end-to-end user journey validation)
* **What to Say:**
  > *"I focused on the business services and customer-facing workflows. I implemented the Authentication Service using JWT to protect user and admin endpoints, the Payment Service to handle charging session transactions and invoices, and the Notification Service to keep EV owners informed in real-time. I also coordinated end-to-end testing across all services to ensure seamless cross-service communication."*

---

### 👤 Person 3: Backend Microservices Architecture, Kubernetes & Core AI Routing
* **Assigned Modules:**
  * Core Microservices (EV Fleet Service, Station Service, Booking Service, Analytics Service)
  * Intelligent Decision & Routing Engine (Dynamic station selection algorithm considering battery SoC, distance, queue length, and charging speed)
  * Kubernetes Orchestration (Minikube cluster, Deployments, ClusterIP & NodePort Services, health probes, self-healing)
  * MongoDB Multi-collection schema design & inter-service REST communication
* **What to Say:**
  > *"I architected the distributed backend and production Kubernetes deployment. I developed the EV Fleet and Station Services, as well as the Decision Engine—an algorithmic service that evaluates vehicle battery levels, real-time station congestion, and geographic distance to autonomously route EVs to the optimal charging slot. To ensure enterprise scalability and high availability, I deployed the entire microservices mesh on Kubernetes with automated rolling updates, health checks, and self-healing pods."*

---

## ⚡ 3. The 30-Second Elevator Pitch

> *"Our project is an **Autonomous Electric Vehicle Fleet Management and Smart Charging Ecosystem**. When an electric vehicle's battery drops below a critical threshold, our system autonomously detects the low charge, uses our **Decision Engine** to calculate the best nearby charging station based on distance, queue, and power rating, automatically reserves a slot, monitors the charging progress in real-time, deducts the payment, and visualizes the entire fleet on an interactive live map—all built on an enterprise-grade **11-microservice architecture orchestrated with Docker and Kubernetes**."*

---

## 🚀 4. How to Run Everything (1-Command Easy Guide)

### Option A: Run via Docker (Currently Running & Ready!)
All 11 microservices are already running on Docker Desktop. To stop and restart at any time:
```bash
# Start all 11 services and MongoDB
docker compose up -d

# Verify all services are healthy
docker ps
```

### Option B: Run via Kubernetes (Easiest Way with 1 Script)
We have a ready PowerShell script that deploys everything onto Minikube:
```powershell
# 1-Click deploy to Kubernetes:
.\scripts\deploy-minikube.ps1

# Check cluster status:
kubectl get pods -n ev-charging
kubectl get services -n ev-charging
```
To tear down later:
```powershell
.\scripts\teardown-minikube.ps1
```

---

## 🎯 5. Top 5 Professor Questions & Winning Answers

1. **Q: Why did you choose a Microservices architecture instead of a Monolith?**
   * *A:* EV fleets require high concurrency and independent scaling. If charging session traffic spikes, only the Charging & Booking services scale up without wasting resources on Auth or Analytics. Failure in one service (e.g. notifications) also does not bring down the vehicle routing system.

2. **Q: How does the Decision / Routing Service choose the best station?**
   * *A:* It runs a multi-factor weighting algorithm:
     $$\text{Score} = w_1 \cdot \text{Distance} + w_2 \cdot \text{Queue Wait Time} + w_3 \cdot \text{Charging Speed (kW)} + w_4 \cdot \text{Tariff}$$
     The station with the optimal score and available compatible plug is chosen automatically.

3. **Q: Why did you use Docker and Kubernetes?**
   * *A:* Docker guarantees that all 11 services run identically across all operating systems without dependency conflicts. Kubernetes provides container orchestration: auto-restart on container crash (self-healing), declarative configuration, service discovery, and rolling zero-downtime updates.

4. **Q: Are your images publicly available?**
   * *A:* Yes! All 11 microservice images are publicly published on Docker Hub under `axar9408/` with `:latest` and `:v1.0` tags.

5. **Q: How do microservices communicate?**
   * *A:* Client requests enter through the centralized **API Gateway** (Port 5000). The Gateway verifies authentication via JWT and forwards traffic to internal microservices via REST API calls over a private Docker network / Kubernetes ClusterIP.
