# Lawino-Meet Architecture & Technical Specification
**Version:** 2.0 (Stabilized Architecture)  
**Date:** 2026-11-20  
**Target Environment:** Local Docker & Docker Compose (Zero AWS Dependencies)

---

## 1. System Overview

Lawino-Meet is an enterprise legal consultation platform connecting clients with legal professionals and law firms. It provides:
1. **Identity & Authentication**: JWT authentication with refresh token rotation (`auth-service`).
2. **Profiles & Organizations**: Client profiles, lawyer profiles with configurable working schedules, and law firms (`user-service`).
3. **Dynamic 1-Hour Appointment Scheduling**: Real-time validation against lawyer working hours and atomic overlap prevention without static slot storage (`appointment-service`).
4. **Financial Operations & Double-Entry Ledger**: Client and lawyer wallet accounting, platform commission treasury (10%), escrow holding, settlement release, and immutable debits/credits (`user-service` Finance domain).
5. **Real-time Messaging**: Authenticated 1-to-1 STOMP WebSocket messaging with read receipts and deletion ("delete for me", "delete for everyone") (`chat-service`).
6. **WebRTC Video Consultations**: Authorized 1-to-1 signaling with room access control and ICE configuration (`meeting-service`).
7. **In-App Notifications**: Event-driven notification dispatch and unread badge counts (`notification-service`).
8. **Service Discovery & Edge Routing**: Netflix Eureka (`eureka-server`) and Nginx Gateway (`gateway`).
9. **Event Broker**: RabbitMQ (`rabbitmq`) for asynchronous event delivery.

---

## 2. Multi-Identifier Strategy

To guarantee security, clean URLs, and database integrity, every primary entity maintains three distinct identifiers:

| Identifier | Format | Purpose | Exposure |
|---|---|---|---|
| **Internal ID** | `BIGINT` (Auto-Increment / Sequence) | Primary key, foreign key joins, internal query performance | Strictly internal, NEVER exposed via public URLs or client responses. |
| **Public UID** | Exactly 7 alphanumeric characters (`[A-Za-z0-9]`), e.g., `A7K9P2X` | Short public reference identifier, compact receipt/booking code, unique across platform | Publicly visible, guaranteed unique with DB constraint and retry generator. |
| **Username / Slug** | Lowercase URL-friendly slug (`[a-z0-9\-]`), e.g., `adv-raghavan-nambiar` | Public profile routing: `/lawyers/:username` or `/firms/:slug` | Public profile URLs. |
| **UUID (System)** | 36-char RFC 4122 UUID v4 | Cross-service authorization claims, JWT subjects (`sub`), and inter-service tokens | Used in JWT payloads and inter-service HTTP/AMQP headers. |

---

## 3. Dynamic Lawyer Availability & 1-Hour Booking Model

### 3.1 Elimination of Static Predefined Slots
- The obsolete `availability_slots` table is deprecated. No static slots are pre-generated or stored in the database.
- A lawyer's profile owns their working schedule configuration:
  - `workingDays`: Configurable working days (e.g. `["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]`, `["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]`, or all 7 days).
  - `workingHoursStart`: e.g., `"09:00"`.
  - `workingHoursEnd`: e.g., `"18:00"`.
  - `breakStartTime` & `breakEndTime`: Optional lunch/recess break (e.g., `"13:00"` to `"14:00"`).
  - `timeZone`: e.g., `"Asia/Kolkata"`.
  - `availabilityStatus`: `"AVAILABLE"`, `"BUSY"`, or `"ON_LEAVE"`.

### 3.2 Dynamic Booking Workflow
```
[ Client ]
   │
   ├─► 1. Views Lawyer Profile at /lawyers/:username
   │      (Backend returns lawyer details + workingDays + workingHours + timeZone)
   │
   ├─► 2. Client selects Date (e.g. 2026-11-25) and preferred Start Time (e.g. 11:30 AM)
   │
   ├─► 3. Client Frontend auto-calculates End Time: Start + 60 minutes (12:30 PM)
   │
   ▼
[ Appointment Service (POST /api/appointments) ]
   │
   ├─► 4. Validates Date is in the future.
   ├─► 5. Validates Day of Week is within lawyer's configured workingDays.
   ├─► 6. Validates Start & End Time fall strictly within workingHours (and outside breaks).
   ├─► 7. Atomically checks for overlapping PENDING, AWAITING_PAYMENT, or CONFIRMED appointments
   │      WHERE (startTime < reqEnd AND endTime > reqStart) AND lawyerId = targetLawyer.
   │
   ├─► 8. If conflict exists -> Returns HTTP 409 CONFLICT ("Selected consultation hour is already booked").
   │
   ├─► 9. If valid -> Creates Appointment entity in PENDING status, sets 60-min window,
   │      and generates 7-character Public UID (e.g. "APT7K9P").
   │
   ▼
[ Notification Service ]
   └─► Dispatches APPOINTMENT_REQUESTED notification to Lawyer.
```

---

## 4. Financial Domain & Double-Entry Ledger

### 4.1 Ledger Model
Every financial mutation produces balanced double-entry `financial_ledger` records:
- **Client Wallet Top-up (Deposit)**:
  - Debit: Gateway Clearing Account
  - Credit: Client Wallet Balance
- **Appointment Payment (Retainer Hold)**:
  - Debit: Client Wallet Balance
  - Credit: Platform Escrow Holding Account
- **Consultation Completion & Settlement**:
  - Debit: Platform Escrow Holding Account (100% of Fee)
  - Credit: Platform Commission Treasury Account (10% of Fee)
  - Credit: Lawyer Wallet Balance (90% of Fee)
- **Refund (Disputed / Cancelled)**:
  - Debit: Platform Escrow Holding Account
  - Credit: Client Wallet Balance

### 4.2 Invariants
1. Wallet balances can NEVER be updated without a corresponding ledger transaction entry.
2. New wallets are initialized with zero balance (`BigDecimal.ZERO`).
3. Floating point types are prohibited; all monetary amounts use `BigDecimal` with precision 12, scale 2.
4. Idempotency keys (`referenceId`) prevent duplicate billing or settlement.

---

## 5. Event-Driven Messaging & Inter-Service Security

1. **Internal Service Authentication**:
   - `/api/notifications/events` is permitted for internal service dispatch.
   - Error handling re-throws checked `ApiException` to prevent corrupt partial state transitions.
2. **RabbitMQ Topic Exchange**:
   - Exchange: `lawino.events`
   - Routing Keys:
     - `appointment.created`
     - `appointment.accepted`
     - `appointment.paid`
     - `appointment.completed`
     - `notification.dispatch`
     - `wallet.transaction`
3. **Eureka Discovery**:
   - All services register as Eureka instances with dynamic heartbeat health reporting.

---

## 6. Minimal Seed Data Specification

The database initialization seeds **strictly**:
1. **1 Client Account**:
   - Username: `rohit_client`
   - Email: `rohit.verma@example.com`
   - Short UID: `CLT1001`
   - Password: `Password123!` (BCrypt `$2a$10$a3kqTBEd1eBStYSQtTdKFO6SjuwYsQpfheRv.VVtsdXqphLMGQ.UK`)
   - Role: `CLIENT`
   - Profile: Rohit Verma, New Delhi, India.
2. **1 Super Admin Account**:
   - Username: `platform_admin`
   - Email: `admin@lawinomeet.com`
   - Short UID: `ADM1001`
   - Password: `Password123!`
   - Role: `PLATFORM_ADMIN`
3. **2 Lawyer Accounts**:
   - Lawyer 1: `adv_raghavan` (Slug: `adv-raghavan-nambiar`, Short UID: `LAW1001`, Senior Partner, Corporate Law, 18 yrs exp, ₹2500/hr, Mon-Fri 09:00-18:00).
   - Lawyer 2: `adv_meera` (Slug: `adv-meera-deshmukh`, Short UID: `LAW1002`, Criminal Defense, 12 yrs exp, ₹1800/hr, Mon-Sat 10:00-19:00).
4. **1 Law Firm**:
   - Name: `Lex Veritas Legal LLP` (Slug: `lex-veritas-legal-llp`, Short UID: `FRM1001`, Managing Partner: `adv_raghavan`).
5. **Zero Dummy Operational Data**:
   - 0 dummy appointments, 0 dummy chat messages, 0 dummy notifications, 0 dummy transactions.
