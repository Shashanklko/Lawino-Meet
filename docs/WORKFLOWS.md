# 🔄 Lawino Meet - Core Workflows & Sequence Diagrams

This document contains end-to-end Mermaid sequence diagrams for all major business service workflows in the **Lawino Meet** platform.

---

## 1. 🔐 User Registration & Stateless JWT Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Client / Lawyer
    participant ClientApp as 💻 React Frontend
    participant AuthCtrl as ⚙️ AuthController
    participant UserSvc as ⚙️ CustomUserDetailsService
    participant JwtUtil as 🔑 JwtUtil
    participant DB as 💾 MySQL Database

    rect rgb(20, 30, 50)
    note right of User: 1. Registration Flow
    User->>ClientApp: Fill Registration Form (Name, Email, Password, Role)
    ClientApp->>AuthCtrl: POST /api/auth/register
    AuthCtrl->>DB: Check if Email Exists
    DB-->>AuthCtrl: Email Available
    AuthCtrl->>DB: Save User & Encrypt Password (BCrypt)
    DB-->>AuthCtrl: User Saved (Role: CLIENT / LAWYER)
    AuthCtrl-->>ClientApp: 201 Created ("User Registered Successfully")
    end

    rect rgb(30, 45, 70)
    note right of User: 2. Login & JWT Generation Flow
    User->>ClientApp: Submit Login Credentials
    ClientApp->>AuthCtrl: POST /api/auth/login
    AuthCtrl->>UserSvc: loadUserByUsername(email)
    UserSvc->>DB: Query User Record
    DB-->>UserSvc: Return User Entity
    AuthCtrl->>AuthCtrl: Verify Password Match
    AuthCtrl->>JwtUtil: generateToken(UserDetails)
    JwtUtil-->>AuthCtrl: Return Signed HS256 JWT Token
    AuthCtrl-->>ClientApp: 200 OK { jwt: "eyJhbG...", message: "Auth Success" }
    ClientApp->>ClientApp: Store Token in localStorage ("lawinomeet_jwt_token")
    end
```

---

## 2. 💬 Real-Time WebSocket Chat & Token Accounting Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Client as 👤 Client
    actor Lawyer as ⚖️ Lawyer
    participant React as 💻 React App
    participant WS as 📡 WebSocket / STOMP Broker
    participant ChatSvc as ⚙️ ChatService
    participant Mongo as 🍃 MongoDB Store
    participant DB as 💾 MySQL Database

    Client->>React: Initiate Chat Session
    React->>ChatSvc: POST /api/chat/start
    ChatSvc->>DB: Deduct Chat Unlock Fee / Tokens
    DB-->>ChatSvc: Tokens Deducted & Wallet Updated
    ChatSvc->>Mongo: Create ChatSession (STATUS: ACTIVE)
    Mongo-->>ChatSvc: Session Created (ID: sess_99)
    ChatSvc-->>React: ChatSession Object

    Client->>WS: CONNECT /ws (Header: Bearer JWT)
    WS-->>Client: CONNECTED Frame
    Client->>WS: SUBSCRIBE /topic/chat/sess_99
    Lawyer->>WS: SUBSCRIBE /topic/chat/sess_99

    Client->>React: Type & Send Message
    React->>WS: SEND /app/chat.sendMessage (Payload: sess_99, content)
    WS->>ChatSvc: processChatMessage(dto)
    ChatSvc->>Mongo: Save ChatMessage Entity
    Mongo-->>ChatSvc: Message Saved
    ChatSvc->>WS: Broadcast to /topic/chat/sess_99
    WS-->>Client: Receive Message Frame
    WS-->>Lawyer: Receive Message Frame
```

---

## 3. 📹 Online Video Consultation & Privacy Contact Masking Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Client as 👤 Client
    actor Lawyer as ⚖️ Lawyer
    participant React as 💻 React App
    participant ConsultSvc as ⚙️ ConsultationService
    participant PaySvc as ⚙️ PaymentService
    participant DB as 💾 MySQL Database

    note right of Client: Step 1: Submit Consultation Request
    Client->>React: Fill Form (Query, Requested Time Slot, Mode: ONLINE_VIDEO)
    React->>ConsultSvc: POST /api/consultations (Contact: Phone, Email)
    ConsultSvc->>ConsultSvc: Generate Structured Meeting Code (e.g. SAM-SHASHI-01072006)
    ConsultSvc->>DB: Save Consultation (isContactInfoDisclosed = FALSE, status = SUBMITTED)
    ConsultSvc-->>React: Consultation Response (Phone: XXXXX-XXXXX [Masked], Email: xxx@masked.com)

    note right of Lawyer: Step 2: Custom Fee Set & Approval
    Lawyer->>ConsultSvc: PUT /api/consultations/{id}/fee?fee=150.00
    ConsultSvc->>DB: Update customFee = 150.00 & Status = ACCEPTED
    
    note right of Client: Step 3: Checkout & Escrow Payment
    Client->>PaySvc: POST /api/payments/checkout (consultationId: 101)
    PaySvc->>DB: Process Payment & Calculate Split (80% Lawyer Wallet, 20% Platform Fee)
    PaySvc->>DB: Update Consultation status = CONFIRMED, isContactInfoDisclosed = TRUE
    PaySvc->>ConsultSvc: Generate Jitsi Video URL (e.g. https://meet.jit.si/SAM-SHASHI-01072006)
    PaySvc-->>React: Payment Transaction Record & Unmasked Contact Info (Real Phone & Email)
```

---

## 4. 🏢 Offline Office Appointment & Address Dispatch Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Client as 👤 Client
    actor Lawyer as ⚖️ Lawyer
    participant React as 💻 React App
    participant ConsultSvc as ⚙️ ConsultationService
    participant PaySvc as ⚙️ PaymentService
    participant DB as 💾 MySQL Database

    Client->>React: Request In-Person Office Appointment (Mode: OFFLINE_OFFICE)
    React->>ConsultSvc: POST /api/consultations
    ConsultSvc->>DB: Save Consultation (Status: SUBMITTED, Mode: OFFLINE_OFFICE)
    
    Lawyer->>ConsultSvc: Accept & Provide Office Address ("123 Legal Chambers, Court Road")
    ConsultSvc->>DB: Update status = ACCEPTED, lawyerOfficeAddress = "123 Legal Chambers..."
    
    Client->>PaySvc: POST /api/payments/checkout
    PaySvc->>DB: Calculate Offline Split (90% Lawyer Share, 10% Platform Service Fee)
    PaySvc->>DB: Update Consultation status = CONFIRMED, Disclose Address & Unmasked Contact
    PaySvc-->>React: Appointment Confirmed + Full Office Address Dispatched
```

---

## 5. 💰 Dual-Wallet Escrow Accounting & Lawyer Payout Engine Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Lawyer as ⚖️ Lawyer
    actor Admin as 🛡️ Admin
    participant PaySvc as ⚙️ PaymentService & PayoutService
    participant DB as 💾 MySQL Database

    note over Lawyer, DB: 1. Automated Wallet Credit on Payment Success
    PaySvc->>DB: Online Consultation Paid ($100) ➔ Credit Lawyer Wallet $80 (80%), Platform Fee $20 (20%)
    PaySvc->>DB: Offline Consultation Paid ($200) ➔ Credit Lawyer Wallet $180 (90%), Platform Fee $20 (10%)
    
    note over Lawyer, DB: 2. Lawyer Payout Request
    Lawyer->>PaySvc: POST /api/payouts/request (Amount: $250, Bank: "HDFC Bank A/C 9876...")
    PaySvc->>DB: Check walletBalance >= $250
    PaySvc->>DB: Deduct walletBalance by $250, Create PayoutRequest (Status: PENDING)
    PaySvc-->>Lawyer: Payout Request Submitted

    note over Admin, DB: 3. Admin Approval & Settlement
    Admin->>PaySvc: PUT /api/payouts/{id}/approve
    PaySvc->>DB: Update PayoutRequest Status = APPROVED, Set processedAt = NOW()
    PaySvc->>DB: Update ProfessionalProfile totalWithdrawn += $250
    PaySvc-->>Admin: Payout Processed Successfully
```

---

## 6. ⚖️ Admin Governance, 4-Hour Dispute Resolution & Audit Ledger

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Client / Lawyer
    actor Admin as 🛡️ Admin
    participant AdminSvc as ⚙️ AdminService
    participant AuditSvc as ⚙️ AuditLogService
    participant DB as 💾 MySQL Database

    User->>AdminSvc: POST /api/admin/disputes (Meeting Code, Category: NO_SHOW_4HR)
    AdminSvc->>DB: Create DisputeTicket (Status: OPEN)
    AdminSvc->>AuditSvc: logEvent("DISPUTE_RAISED", "Dispute raised for meeting code...")
    AuditSvc->>DB: Save AuditLog Entity (Timestamp, IP, UserRole)

    Admin->>AdminSvc: PUT /api/admin/disputes/{id}/resolve (Resolution: REFUND_CLIENT)
    AdminSvc->>DB: Update DisputeTicket status = RESOLVED
    AdminSvc->>DB: Trigger Refund to Client Wallet / Reverse Escrow Hold
    AdminSvc->>AuditSvc: logEvent("DISPUTE_RESOLVED", "Dispute resolved with refund")
    AdminSvc-->>Admin: Dispute Resolved & Audit Logged
```
