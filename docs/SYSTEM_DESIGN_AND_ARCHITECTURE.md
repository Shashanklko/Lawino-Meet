# LawinoMeet — High-Level System Design & Architecture Specification

> **Platform:** LawinoMeet Legal Tele-Consultation Cloud  
> **Document Type:** System Architecture Design Document (SADD)  
> **Version:** 1.0.0 (Production Grade)  
> **Target Audience:** Architects, Lead Developers, Security Officers & DevOps Engineers  

---

## 1. Executive Architecture Overview

LawinoMeet is an enterprise-grade, distributed **Legal Tele-Consultation & Practice Management Platform**. It connects verified Advocates, High Court legal practitioners, and Law Firms with litigation and corporate advisory clients across India.

The platform is designed around **Domain-Driven Design (DDD)** and a **Microservices-Oriented Architecture (SOA)**, strictly separating concerns across identity, directory discovery, slot reservation concurrency, real-time messaging, WebRTC encrypted media streaming, and asynchronous platform telemetry.

```text
                                 [ End-User Traffic / HTTPS (443) ]
                                                │
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │      Edge API Gateway & Reverse Proxy         │
                        │    (Nginx 1.25 / SSL / Rate-Limiting / WS)    │
                        └───────┬───────────────────────────────┬───────┘
                                │                               │
             ┌──────────────────┴───────────────┐               │
             ▼                                  ▼               ▼
 ┌───────────────────────┐          ┌───────────────────────┐  [ WebSocket Upgrades ]
 │ Client & Lawyer Portal│          │ Platform Master Admin │  ┌────────────────────┐
 │ (React Vite SPA)      │          │ (React Vite Console)  │  │ /ws-chat           │
 │ [Port 3000 / :80]     │          │ [Port 3002 / :80]     │  │ /ws-meeting        │
 └───────────┬───────────┘          └───────────┬───────────┘  └─────────┬──────────┘
             │                                  │                        │
             └──────────────────┬───────────────┴────────────────────────┘
                                │
             ┌──────────────────┼───────────────────────────────┐
             │                  │                               │
             ▼                  ▼                               ▼
 ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
 │  Identity & RBAC     │ │ Advocate Registry &  │ │ Consultation Booking │
 │  Authority           │ │ Multi-Firm Engine    │ │ Concurrency Engine   │
 │  (auth-service:8081) │ │ (user-service:8082)  │ │ (appointment-service)│
 └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
            │                        │                        │
            ▼                        ▼                        ▼
 ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
 │ WebRTC Video Meeting │ │ STOMP Real-Time      │ │ Event-Driven Audit & │
 │ Signaling Engine     │ │ Messaging Broker     │ │ Notification Service │
 │(meeting-service:8084)│ │ (chat-service:8086)  │ │(notification-service)│
 └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │ Decoupled Database Cluster  │
                      │ (MySQL 8.3 / AWS RDS Multi) │
                      │ [auth_db, user_db, appt_db, │
                      │  meet_db, chat_db, notif_db]│
                      └─────────────────────────────┘
```

---

## 2. Platform Sub-System Taxonomy & Formal Nomenclature

Just as modern airline and hospitality ecosystems feature distinct named sub-systems (e.g. *Central Reservation System (CRS)*, *Global Distribution System (GDS)*), LawinoMeet is partitioned into **9 Named Enterprise Sub-Systems**:

| Sub-System Formal Name | Service Module | Architectural Role | Core Technical Capabilities |
|---|---|---|---|
| **1. Zero-Trust Identity, Authentication & RBAC Authority** | `auth-service` | Identity Provider (IdP) | Dual-ID architecture, HMAC-SHA256 JWT minting, single-use refresh token rotation, BCrypt password hashing, and role claims (`CLIENT`, `LAWYER`, `FIRM_ADMIN`, `PLATFORM_ADMIN`). |
| **2. Legal Consultation Reservation & Slot Concurrency Engine** | `appointment-service` | Booking & Reservation Engine | Concurrency-safe atomic slot reservation, conditional status update, double-booking prevention, 24-hour auto-expiration scheduling, and consultation lifecycle governance. |
| **3. Advocate Registry & Multi-Firm Tenancy Management System** | `user-service` | Professional Directory & Tenancy | Bar Council verification audit, advocate profile publishing, multi-firm organization hierarchy, practice area specialization matrix, and S3 media storage. |
| **4. WebRTC Peer-to-Peer Encrypted Tele-Consultation Gateway** | `meeting-service` | Audio/Video Media Streaming | Dynamic ephemeral hearing room provisioning, cryptographic token room clearance, WebRTC ICE/STUN/TURN negotiation, participant mute/video state telemetry. |
| **5. End-to-End Encrypted Case Briefing & STOMP Messaging Broker** | `chat-service` | Real-Time Legal Collaboration | WebSocket STOMP protocol broker, SockJS fallback, conversation thread isolation, read-receipt ack telemetry, and encrypted legal brief attachment handling. |
| **6. Asynchronous Event-Driven Audit & Dispatch Notification Engine** | `notification-service` | Telemetry & Notification Engine | Real-time in-app alerts, unread counter synchronization, system event broadcast, security audit trail dispatch, and 3-second ephemeral toast management. |
| **7. Edge API Gateway & WebSocket Protocol Switcher** | `lawino-gateway` (Nginx) | Ingress Proxy & Traffic Routing | Path-based microservice multiplexing, SSL termination, connection keep-alive, rate limiting, and HTTP 1.1 WebSocket bidirectional upgrade mapping. |
| **8. Dual-Portal Client-Advocate & Master Governance Consoles** | `frontend` & `admin-frontend` | Presentation Layer | Client booking portal & Advocate Chamber CRM (8-language i18n support) + Master Administrative Governance Console with fine-grained 4-theme CSS variables. |
| **9. Decoupled Multi-Tenant Relational Data Cluster** | MySQL 8.3 / AWS RDS | Persistence Tier | Isolated relational schemas per domain service (`auth_db`, `user_db`, `appointment_db`, `meeting_db`, `notification_db`, `chat_db`) adhering to Microservices Database-per-Service pattern. |

---

## 3. Deep-Dive: Core System Design Patterns

### 3.1 Reservation System & Double-Booking Prevention Engine
The **Legal Consultation Reservation Engine** solves the classic high-concurrency ticket/seat reservation problem. When multiple clients attempt to book the same advocate's availability slot simultaneously:

```text
Client A (Request) ──┐
                     ├─► [ATOMIC UPDATE: updateSlotStatusConditionally]
Client B (Request) ──┘   WHERE slot_id = ? AND slot_status = 'AVAILABLE'
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [Affected Rows = 1]     [Affected Rows = 0]
             Reservation Locked!     HTTP 409 Conflict:
             Appointment Created     "SLOT_NOT_AVAILABLE"
```

1. **Optimistic Locking with Conditional Updates:**
   ```sql
   UPDATE availability_slots 
   SET slot_status = 'PENDING', updated_at = :now 
   WHERE public_id = :slotId AND slot_status = 'AVAILABLE';
   ```
2. **Zero Overselling Guarantee:** If two requests arrive in the same millisecond, the database engine grants the write lock to exactly one transaction. The second transaction immediately receives `0 rows updated` and is rejected with `HTTP 409 Conflict: SLOT_NOT_AVAILABLE`.
3. **Cross-Entity Conflict Detection:**
   * Prevents a lawyer from holding overlapping hearings.
   * Prevents a client from holding duplicate concurrent bookings.
4. **Autonomous Expiration Janitor (Scheduled Polling):**
   A Spring `@Scheduled` thread runs every 60 seconds, scanning for unconfirmed appointments past their `response_deadline` (24 hours). Overdue slots are automatically reverted to `AVAILABLE` status.

---

### 3.2 Zero-Trust Dual-Identifier Security & Token Lifecycle
LawinoMeet implements the **Dual-ID Isolation Pattern**:
* **Internal Auto-Increment Primary Keys (`id` BIGINT):** Used exclusively within internal SQL joins for maximum query efficiency and index locality.
* **Cryptographic Public UUIDs (`public_id` VARCHAR(36)):** Exposed externally across REST APIs, WebSockets, and URLs, preventing enumeration/scraping attacks.

```text
[ Client Login ] ──► POST /api/auth/login
                           │
                           ▼
                  [ Auth Service ]
                  ├── Verifies BCrypt hash
                  ├── Mints Access Token (HMAC-SHA256, 15 min expiry)
                  └── Mints Single-Use Refresh Token (Stored in DB, 7 day expiry)
                           │
                           ▼
                  [ Bearer Token in Header ] ──► [ Microservices ]
                                                   Verified locally via
                                                   JwtTokenValidator without
                                                   cross-service network call!
```

---

### 3.3 Real-Time WebSocket Message Broker Architecture
The **STOMP Messaging Broker** (`chat-service`) leverages SockJS emulation with STOMP sub-protocol over WebSocket:
* **Topic Subscription:** `/topic/conversation/{conversationId}` for multi-participant conference messaging.
* **User Queue Routing:** `/user/queue/messages` and `/user/queue/notifications` for targeted private client-lawyer alerts.
* **Heartbeat & Resilient Auto-Reconnect:** Client ping intervals set to 25,000ms, automatically rebuilding dropped TCP links without session disruption.

---

### 3.4 WebRTC Peer-to-Peer Tele-Consultation Architecture
For low-latency, end-to-end encrypted video hearings:
1. **Signaling Exchange:** The `meeting-service` serves as the signaling broker over WebSocket (`/ws-meeting`), exchanging SDP (Session Description Protocol) offers, answers, and ICE candidates between browser endpoints.
2. **Media Stream Isolation:** Audio/video packets flow directly Peer-to-Peer (P2P) between the client and advocate's browsers using SRTP (Secure Real-Time Transport Protocol) with AES-128 encryption.
3. **Bandwidth Optimization:** Built-in adaptive bitrate throttling ensuring crisp audio even over 3G/4G connections.

---

## 4. Multi-Tenant Database Architecture

LawinoMeet enforces the **Database-per-Service Pattern**. Services never perform cross-database queries or foreign keys across service boundaries.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MySQL 8.3 / Amazon RDS Engine                   │
├───────────────┬───────────────┬────────────────┬───────────────────────┤
│ auth_db       │ user_db       │ appointment_db │ meeting_db / chat_db  │
├───────────────┼───────────────┼────────────────┼───────────────────────┤
│ users         │ client_prof   │ avail_slots    │ video_meetings        │
│ refresh_tokens│ lawyer_prof   │ appointments   │ chat_conversations    │
│ roles         │ law_firms     │ services       │ chat_messages         │
│               │ firm_members  │ cancellation   │ notifications         │
│               │ specializations                │ audit_logs            │
└───────────────┴───────────────┴────────────────┴───────────────────────┘
```

---

## 5. Deployment Topology & Swarm Mesh Networking

In production, the platform runs on a **Docker Swarm Overlay Mesh**:

```text
                             AWS Cloud Host (EC2)
┌────────────────────────────────────────────────────────────────────────┐
│  Docker Swarm Ingress Network                                          │
│  [ Port 80 / 443 ] ──► lawino-gateway (2 Replicas, Round-Robin)        │
├────────────────────────────────────────────────────────────────────────┤
│  Encrypted Overlay Network (lawino-overlay)                            │
│  ├── frontend:80             (2 Replicas, High Availability)           │
│  ├── admin-frontend:80       (1 Replica, Dedicated Admin)              │
│  ├── auth-service:8081       (2 Replicas, Stateless)                   │
│  ├── user-service:8082       (2 Replicas, Stateless)                   │
│  ├── appointment-service:8083(2 Replicas, Atomic Locking)              │
│  ├── meeting-service:8084    (2 Replicas, Low-Latency Signaling)       │
│  ├── notification-service:8085(2 Replicas, Async Event Bus)            │
│  └── chat-service:8086       (2 Replicas, WebSocket Broker)            │
├────────────────────────────────────────────────────────────────────────┤
│  Persistence Volumes                                                   │
│  ├── mysql_data              (Permanent Multi-DB Database Storage)     │
│  └── uploads_data            (Case Briefs, Evidentiary Documents)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Verification & Architectural Non-Functional Requirements (NFR)

* **Scalability:** All Spring Boot microservices are 100% stateless; horizontal scaling is achieved by incrementing replicas (`docker service scale appointment-service=5`).
* **Availability:** Ingress round-robin load balancing and zero-downtime rolling updates (`update_config: start-first`).
* **Fault Isolation:** Failure of the `chat-service` or `meeting-service` does not impair client booking or advocate onboarding.
* **Compliance & Security:** Dual-ID sanitization prevents scraping, CORS headers strictly bound to whitelisted origins, and BCrypt work factor set to 10.
