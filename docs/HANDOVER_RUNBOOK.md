# LawinoMeet - Platform Handover & Production Operations Runbook

> **Platform Version:** 1.0.0-SNAPSHOT  
> **Architecture:** Microservices + React SPAs + Docker Swarm + AWS Cloud  
> **All 14 Phases (Phase 0 - Phase 13) 100% Implemented & Verified**

---

## 1. Complete Technology Stack Matrix

| Layer | Technology | Purpose & Implementation |
|---|---|---|
| **Frontend** | **React.js 18 (Vite)** | Consumer/Advocate portal (`frontend`) and Law Firm/Platform Admin portal (`admin-frontend`) with Tailwind CSS & 8-language multilingual support. |
| **Backend** | **Java 21 LTS, Spring Boot 3.3.5** | Multi-module Maven reactor powering 6 decoupled, domain-driven microservices. |
| **Database** | **MySQL 8.3 & Amazon RDS** | Independent database schemas per service hosted on a single AWS Free Tier `db.t3.micro` instance ($0 budget). |
| **Authentication** | **Spring Security & JWT** | Dual-ID architecture, HMAC-SHA256 JWT signing, single-use refresh token rotation, and RBAC (`CLIENT`, `LAWYER`, `FIRM_ADMIN`, `PLATFORM_ADMIN`). |
| **Real-time Communication** | **WebSocket (STOMP / SockJS)** | In-browser instant messaging, message status updates, and real-time appointment notifications. |
| **Video Consultation** | **WebRTC** | Encrypted peer-to-peer video conferencing rooms with audio, video, and screen-sharing capability (`meeting-service`). |
| **Containerization** | **Docker & Docker Compose** | Multi-stage distroless/alpine Dockerfiles and 10-container `docker-compose.yml` local orchestration stack. |
| **Cluster Orchestration** | **Docker Swarm** | `docker-stack.yml` with overlay network `lawino-overlay`, zero-downtime rolling updates, and service replication. |
| **CI/CD Pipeline** | **Jenkins** | Declarative 7-stage `Jenkinsfile` for automated checkout, test execution, container image tagging, registry push, and Swarm rollout. |
| **Cloud Hosting** | **AWS EC2** | Ubuntu 22.04 LTS host instance running Docker Swarm node and Nginx gateway. |
| **Reverse Proxy / Gateway** | **Nginx 1.25** | Edge API gateway handling SSL termination, path-based microservice routing, and WebSocket upgrades. |
| **Monitoring & Alarms** | **AWS CloudWatch** | Centralized `/lawino-meet/production` log group, EC2 CPU alarms (>80%), and RDS free storage alarms (<2GB). |
| **Cloud Object Storage** | **Amazon S3** | Profile photos and chat legal document attachments with CORS support and automatic local disk fallback. |
| **Version Control** | **Git & GitHub** | Monorepo structure with automated branch protection and feature workflows. |

---

## 2. Microservice Architecture & Port Allocations

```text
                           Internet / Clients
                                   │
                           [ Port 80 / 443 ]
                                   │
                      ┌────────────▼────────────┐
                      │    Nginx Edge Gateway   │
                      │      (Reverse Proxy)    │
                      └────────────┬────────────┘
                                   │
       ┌───────────┬───────────────┼───────────────┬────────────┐
       │           │               │               │            │
 ┌─────▼─────┐ ┌───▼────┐    ┌─────▼─────┐   ┌─────▼────┐ ┌─────▼────┐
 │  Port 80  │ │Port 80 │    │ Port 8081 │   │Port 8082 │ │Port 8083 │
 │ Frontend  │ │ Admin  │    │   Auth    │   │   User   │ │Appointment│
 └───────────┘ └────────┘    └─────┬─────┘   └─────┬────┘ └─────┬────┘
                                   │               │            │
                             ┌─────▼───────────────▼────────────▼─────┐
                             │         MySQL / AWS RDS                │
                             │  (auth_db, user_db, appointment_db)   │
                             └────────────────────────────────────────┘
```

| Service | Port | Database | Responsibilities |
|---|---|---|---|
| `gateway` | `80`, `3001` | - | Nginx edge proxy, path routing, WebSocket upgrade |
| `frontend` | `3000` | - | Client booking, advocate chamber, multilingual UI |
| `admin-frontend` | `3002` | - | Law firm management, sub-admin delegation, audit |
| `auth-service` | `8081` | `auth_db` | Registration, login, token refresh, password hashing |
| `user-service` | `8082` | `user_db` | Profiles, firm hierarchy, directory search, S3 upload |
| `appointment-service`| `8083` | `appointment_db` | Slots concurrency, booking lifecycle, retainer escrow |
| `meeting-service` | `8084` | `meeting_db` | WebRTC room generation, participant validation |
| `notification-service`| `8085` | `notification_db` | Real-time push alerts, audit logs |
| `chat-service` | `8086` | `chat_db` | Encrypted legal thread, STOMP WebSocket, file sharing |

---

## 3. Quickstart: Local Docker Deployment

Run the entire 10-container stack locally with a single command:

```powershell
# Copy environment template
Copy-Item .env.example .env

# Start all microservices, databases, and frontends
docker compose up -d --build
```

Access Points:
- **Public Website & Lawyer Chamber:** `http://localhost:80`
- **Law Firm & Admin Portal:** `http://localhost:3002`
- **Nginx API Gateway Direct:** `http://localhost:80/api/*`

---

## 4. Quickstart: AWS Free Tier Cloud Deployment ($0 Cost)

### Step 1: Provision Free Tier RDS MySQL & S3
Run the automated 1-click script:

```powershell
# Windows PowerShell
.\infrastructure\scripts\create-rds.ps1 -Region "us-east-1"

# Or Linux / macOS Bash
bash ./infrastructure/scripts/create-rds.sh
```

### Step 2: Initialize Database Schemas
Connect to your RDS endpoint and execute the multi-DB initialization:

```bash
mysql -h <your-rds-endpoint> -u admin -p < ./infrastructure/scripts/init-rds-dbs.sql
```

### Step 3: Launch Docker Swarm Cluster on EC2
On your EC2 host:

```bash
# Clone the repository
git clone https://github.com/Lawino-Meet/Lawino-Meet.git
cd Lawino-Meet

# Run the 1-click Swarm deploy script
bash ./infrastructure/scripts/deploy-swarm.sh
```

---

## 5. Verification & Testing Tools

1. **Automated End-to-End Smoke Test:**
   ```powershell
   .\infrastructure\scripts\test-e2e-api.ps1 -GatewayUrl "http://localhost:80"
   ```
2. **Postman API Suite:**
   Import `docs/postman/LawinoMeet_API_Collection.json` into Postman. Includes pre-configured authorization variables and test assertions across all 6 microservices.

---

## 6. Disaster Recovery & Maintenance

- **Database Backup (Automated RDS Snapshot):** Configured with 1-day retention in Terraform (`backup_retention_period = 1`).
- **Manual DB Dump:**
  ```bash
  mysqldump -h <rds-host> -u admin -p --all-databases > backup_$(date +%F).sql
  ```
- **Zero-Downtime Service Update:**
  ```bash
  docker service update --image lawinomeet/user-service:latest lawino_user-service
  ```
