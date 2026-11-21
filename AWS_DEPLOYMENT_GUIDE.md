# LawinoMeet — AWS, Docker Swarm & Jenkins CI/CD Production Deployment Guide

This comprehensive, step-by-step runbook details how to migrate and deploy the **LawinoMeet** enterprise legal consultation platform to **Amazon Web Services (AWS)** using **Docker Swarm** for container orchestration, **Jenkins** for automated continuous integration & zero-downtime continuous deployment (CI/CD), **AWS RDS (MySQL 8)** for relational persistence, and **AWS S3** for secure document storage.

---

## Table of Contents
1. [Target Production Architecture](#1-target-production-architecture)
2. [Prerequisites & AWS Setup](#2-prerequisites--aws-setup)
3. [Phase 1: AWS Infrastructure Provisioning (VPC, RDS, S3, EC2)](#3-phase-1-aws-infrastructure-provisioning)
4. [Phase 2: Docker Swarm Cluster Setup](#4-phase-2-docker-swarm-cluster-setup)
5. [Phase 3: Container Image Registry (AWS ECR or Docker Hub)](#5-phase-3-container-image-registry)
6. [Phase 4: Jenkins CI/CD Server Configuration](#6-phase-4-jenkins-cicd-server-configuration)
7. [Phase 5: Docker Stack Deployment & Configuration](#7-phase-5-docker-stack-deployment--configuration)
8. [Phase 6: Domain, SSL/TLS, and Ingress Gateway](#8-phase-6-domain-ssltls-and-ingress-gateway)
9. [Phase 7: Day-2 Operations, Scaling, Health Checks & Rollbacks](#9-phase-7-day-2-operations-scaling-health-checks--rollbacks)

---

## 1. Target Production Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Internet Users                 │
                    │   Clients, Advocates, Firm Admins, System    │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTPS (Port 443) / WSS
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │     AWS Application Load Balancer (ALB)      │
                    │      (ACM SSL/TLS + Sticky WebSockets)       │
                    └──────────────────────┬───────────────────────┘
                                           │ Port 80 (HTTP) & 3001
                                           ▼
 ┌───────────────────────────────── AWS VPC ──────────────────────────────────┐
 │                                                                            │
 │  ┌──────────────────────── Public Subnets ──────────────────────────────┐  │
 │  │                                                                      │  │
 │  │   ┌──────────────────────────────────────────────────────────────┐   │  │
 │  │   │          Docker Swarm Manager (EC2 t3.large / Ubuntu)        │   │  │
 │  │   │  - Ingress Overlay Network (lawino-overlay)                  │   │  │
 │  │   │  - Edge Gateway (Nginx Proxy, 2 Replicas)                    │   │  │
 │  │   │  - Frontend Consumer Portal (Nginx, 2 Replicas)              │   │  │
 │  │   │  - Admin Frontend Portal (Nginx, 1 Replica)                  │   │  │
 │  │   └──────────────────────────────┬───────────────────────────────┘   │  │
 │  │                                  │ Overlay Mesh                      │  │
 │  │   ┌──────────────────────────────┴───────────────────────────────┐   │  │
 │  │   │          Docker Swarm Worker (EC2 t3.large / Ubuntu)         │   │  │
 │  │   │  - auth-service (2 Replicas)                                 │   │  │
 │  │   │  - user-service (2 Replicas)                                 │   │  │
 │  │   │  - appointment-service (2 Replicas)                          │   │  │
 │  │   │  - chat-service (2 Replicas)                                 │   │  │
 │  │   │  - meeting-service (2 Replicas)                              │   │  │
 │  │   │  - notification-service (1 Replica)                          │   │  │
 │  │   │  - rabbitmq (1 Replica, stateful)                            │   │  │
 │  │   │  - eureka-server (1 Replica)                                 │   │  │
 │  │   └──────────────────────────────────────────────────────────────┘   │  │
 │  └──────────────────────────────────────────────────────────────────────┘  │
 │                                                                            │
 │  ┌────────────────────── Private Isolated Subnets ──────────────────────┐  │
 │  │                                                                      │  │
 │  │   ┌──────────────────────────────┐   ┌───────────────────────────┐   │  │
 │  │   │       AWS RDS MySQL 8        │   │        AWS S3 Bucket      │   │  │
 │  │   │  - auth_db       - user_db   │   │  - Case documents         │   │  │
 │  │   │  - appointment_db - meeting_db│  │  - Bar Council ID proof   │   │  │
 │  │   │  - chat_db       - notif_db  │   │  - Profile avatars        │   │  │
 │  │   └──────────────────────────────┘   └───────────────────────────┘   │  │
 │  └──────────────────────────────────────────────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & AWS Setup

Before starting, ensure you have:
1. **AWS Account** with administrative privileges.
2. **AWS CLI v2** installed and configured (`aws configure`).
3. **Terraform** (>= 1.5.0) or AWS Console access.
4. **Domain Name** managed in Route 53 or Cloudflare.
5. **Git Repository** (GitHub, GitLab, or AWS CodeCommit) with the LawinoMeet codebase.
6. **SSH Key Pair** (`lawino-swarm-key.pem`) generated in your target AWS region.

---

## 3. Phase 1: AWS Infrastructure Provisioning

### 3.1 Provisioning via Terraform (Automated)

The project includes ready-to-use Terraform modules in `infrastructure/terraform/`.

1. **Review and customize `infrastructure/terraform/variables.tf`:**
   ```bash
   cd infrastructure/terraform
   ```
2. **Initialize and apply Terraform:**
   ```bash
   terraform init
   terraform plan -out=tfplan
   terraform apply tfplan
   ```
3. Terraform will output:
   * `swarm_manager_public_ip`
   * `swarm_worker_public_ip`
   * `rds_endpoint`
   * `s3_bucket_name`

---

### 3.2 Manual Provisioning (AWS CLI / Console Alternative)

If you prefer provisioning via AWS Console or CLI:

#### A. Security Groups
Create three security groups in your VPC:
1. **`lawino-alb-sg`**:
   - Inbound: Port 80 (HTTP) from `0.0.0.0/0`, Port 443 (HTTPS) from `0.0.0.0/0`.
   - Outbound: All traffic.
2. **`lawino-swarm-sg`**:
   - Inbound:
     - Port 22 (SSH) from your admin IP.
     - Port 80 & 3001 from `lawino-alb-sg`.
     - Port 2377 (TCP) from `lawino-swarm-sg` (Swarm cluster management).
     - Port 7946 (TCP/UDP) from `lawino-swarm-sg` (Node communication).
     - Port 4789 (UDP) from `lawino-swarm-sg` (Overlay network traffic).
3. **`lawino-rds-sg`**:
   - Inbound: Port 3306 from `lawino-swarm-sg`.
   - Outbound: None.

#### B. AWS RDS MySQL 8 Instance
```bash
aws rds create-db-instance \
    --db-instance-identifier lawino-rds-mysql \
    --db-instance-class db.t3.medium \
    --engine mysql \
    --engine-version 8.0.35 \
    --allocated-storage 50 \
    --master-username root \
    --master-user-password "YourStrongProductionPassword123!" \
    --vpc-security-group-ids <lawino-rds-sg-id> \
    --backup-retention-period 7 \
    --no-publicly-accessible
```

#### C. Database Schemas Initialization
Once the RDS instance is `available`, connect via a bastion or EC2 instance:
```bash
mysql -h <rds-endpoint>.rds.amazonaws.com -u root -p < infrastructure/scripts/init-rds-dbs.sql
```
*This creates all 6 microservice databases (`auth_db`, `user_db`, `appointment_db`, `meeting_db`, `chat_db`, `notification_db`) with proper character sets and privileges.*

#### D. AWS S3 Bucket Creation
```bash
aws s3api create-bucket \
    --bucket lawinomeet-production-assets \
    --region ap-south-1 \
    --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-public-access-block \
    --bucket lawinomeet-production-assets \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

## 4. Phase 2: Docker Swarm Cluster Setup

Launch 2 EC2 instances (Ubuntu 22.04 LTS, `t3.large`, 40 GB gp3 storage):
- **Node 1:** `lawino-swarm-manager` (Elastic IP attached)
- **Node 2:** `lawino-swarm-worker-1`

### 4.1 Install Docker Engine on Both Nodes
Run on each node via SSH:
```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

### 4.2 Initialize Swarm Manager (on Node 1)
```bash
MANAGER_PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
docker swarm init --advertise-addr $MANAGER_PRIVATE_IP
```
Save the worker join token generated by this command.

### 4.3 Join Worker Node (on Node 2)
```bash
docker swarm join --token <WORKER_JOIN_TOKEN> <MANAGER_PRIVATE_IP>:2377
```

### 4.4 Verify Swarm Cluster (on Manager)
```bash
docker node ls
```
Output will list both nodes with `Ready` status and Manager marked as `Leader`.

### 4.5 Create Overlay Network (on Manager)
```bash
docker network create --driver overlay --attachable lawino-overlay
```

---

## 5. Phase 3: Container Image Registry

You can use **AWS ECR (Recommended)** or **Docker Hub**.

### 5.1 Using AWS ECR
1. Create repositories for all services:
   ```bash
   SERVICES=("gateway" "frontend" "admin-frontend" "auth-service" "user-service" "appointment-service" "meeting-service" "chat-service" "notification-service")
   for svc in "${SERVICES[@]}"; do
       aws ecr create-repository --repository-name "lawinomeet/$svc" --region ap-south-1
   done
   ```
2. Authenticate Docker on Swarm nodes:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
   ```

---

## 6. Phase 4: Jenkins CI/CD Server Configuration

### 6.1 Launch Dedicated Jenkins EC2 Instance
- **Instance Type:** `t3.xlarge` (4 vCPU, 16 GB RAM recommended for parallel Maven & Vite builds).
- **OS:** Ubuntu 22.04 LTS.
- **Security Group:** Port 22 (SSH), Port 8080 (Jenkins UI).

### 6.2 Install Jenkins, Java 21, Maven, Node.js & Docker
```bash
sudo apt-get update
# Install Java 21 & Maven
sudo apt-get install -y openjdk-21-jdk maven

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker jenkins

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update && sudo apt-get install -y jenkins
sudo systemctl enable --now jenkins
```

### 6.3 Configure Jenkins UI & Plugins
1. Open `http://<JENKINS_PUBLIC_IP>:8080` and unlock Jenkins using `/var/lib/jenkins/secrets/initialAdminPassword`.
2. Install recommended plugins, plus:
   - **Docker Pipeline**
   - **Pipeline: Stage View**
   - **SSH Agent Plugin**
   - **AnsiColor**
3. Configure Global Tool Configuration:
   - **JDK:** Name: `JDK-21`, JAVA_HOME: `/usr/lib/jvm/java-21-openjdk-amd64`
   - **Maven:** Name: `Maven-3.9`, Path: `/usr/share/maven`
   - **NodeJS:** Name: `NodeJS-20`

### 6.4 Configure Jenkins Credentials
Navigate to `Manage Jenkins` → `Credentials` → `System` → `Global credentials`:
1. `docker-hub-credentials` (or AWS ECR credentials): Username & Password.
2. `swarm-ssh-key`: SSH Private Key for `ubuntu` on the Swarm Manager EC2 instance.
3. `swarm-manager-ip`: Secret text holding the Private IP of the Swarm Manager.

---

## 7. Phase 5: Docker Stack Deployment & Configuration

### 7.1 Production Environment Variables
On the Swarm Manager, create `~/.env.production`:
```bash
cat << 'EOF' > ~/.env.production
REGISTRY=<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/lawinomeet
TAG=latest

# Database Connection (AWS RDS)
MYSQL_HOST=lawino-rds-mysql.<hash>.ap-south-1.rds.amazonaws.com
MYSQL_USER=root
MYSQL_PASSWORD=YourStrongProductionPassword123!

# Security Secrets
JWT_SECRET=production-grade-256-bit-minimum-secret-key-for-lawino-auth-tokens
JWT_ISSUER=lawino-meet

# AWS S3 Storage
S3_BUCKET_NAME=lawinomeet-production-assets
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_USER=lawino
RABBITMQ_PASSWORD=rabbit_strong_production_pw_123

# Service Discovery
EUREKA_SERVER_URL=http://eureka-server:8761/eureka/
EOF
```

### 7.2 Deploying the Stack
Execute using the included automation script `infrastructure/scripts/deploy-swarm.sh`:
```bash
./infrastructure/scripts/deploy-swarm.sh lawino docker-stack.yml
```
Or directly via Docker CLI:
```bash
source ~/.env.production
docker stack deploy --with-registry-auth -c docker-stack.yml lawino
```

### 7.3 Verifying Swarm Services
```bash
docker stack services lawino
```
Expected output:
```
ID             NAME                         MODE         REPLICAS   IMAGE
xxxxxxxxxxxx   lawino_admin-frontend        replicated   1/1        .../admin-frontend:latest
xxxxxxxxxxxx   lawino_appointment-service   replicated   2/2        .../appointment-service:latest
xxxxxxxxxxxx   lawino_auth-service          replicated   2/2        .../auth-service:latest
xxxxxxxxxxxx   lawino_chat-service          replicated   2/2        .../chat-service:latest
xxxxxxxxxxxx   lawino_eureka-server         replicated   1/1        .../eureka-server:latest
xxxxxxxxxxxx   lawino_frontend              replicated   2/2        .../frontend:latest
xxxxxxxxxxxx   lawino_gateway               replicated   2/2        .../gateway:latest
xxxxxxxxxxxx   lawino_meeting-service       replicated   2/2        .../meeting-service:latest
xxxxxxxxxxxx   lawino_notification-service  replicated   1/1        .../notification-service:latest
xxxxxxxxxxxx   lawino_rabbitmq              replicated   1/1        rabbitmq:3.13-management-alpine
xxxxxxxxxxxx   lawino_user-service          replicated   2/2        .../user-service:latest
```

---

## 8. Phase 6: Domain, SSL/TLS, and Ingress Gateway

### 8.1 AWS Application Load Balancer (ALB) Setup
1. Create a Target Group:
   - Target Type: `Instances`
   - Protocol: `HTTP`, Port: `80`
   - Health Check Path: `/actuator/health` or `/`
   - Register both Swarm EC2 instances.
2. Create an Application Load Balancer:
   - Scheme: Internet-facing.
   - Listeners:
     - **Port 80 (HTTP):** Redirects to HTTPS (Port 443).
     - **Port 443 (HTTPS):** Forwards to Target Group. Attach AWS Certificate Manager (ACM) SSL Certificate.
3. Enable WebSocket Support:
   - In Target Group attributes, enable **Stickiness** (Duration-based, 1 day) to support seamless STOMP WebSocket sessions (`/ws-chat`, `/ws-meeting`).

### 8.2 Route 53 DNS Record
Point your apex and wildcard domains to the ALB:
- `meet.yourdomain.com` -> `A Record (Alias to ALB)`
- `admin.yourdomain.com` -> `A Record (Alias to ALB)`

---

## 9. Phase 7: Day-2 Operations, Scaling, Health Checks & Rollbacks

### 9.1 Inspecting Running Tasks
```bash
docker stack ps lawino --no-trunc
```

### 9.2 Real-time Service Logs
```bash
# Stream chat-service logs across all replicas
docker service logs -f lawino_chat-service

# Stream appointment-service logs
docker service logs -f lawino_appointment-service
```

### 9.3 Horizontal Auto-Scaling
To scale any microservice dynamically under heavy courtroom or consultation load:
```bash
docker service scale lawino_chat-service=4
docker service scale lawino_appointment-service=4
```

### 9.4 Automated Zero-Downtime Rolling Update & Rollback
The `docker-stack.yml` is configured with:
```yaml
update_config:
  parallelism: 1
  delay: 10s
  order: start-first
  failure_action: rollback
rollback_config:
  parallelism: 1
  delay: 5s
  order: stop-first
```
If a new release fails its `/actuator/health` probe during deployment, Docker Swarm **automatically rolls back** to the previously healthy container without downtime.

To trigger an emergency manual rollback:
```bash
docker service rollback lawino_chat-service
```

---

*LawinoMeet is fully configured for zero-downtime, production-ready continuous deployment across AWS and Docker Swarm.*
