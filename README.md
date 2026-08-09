# 🏛️ LawEZY: Legal Consultation Platform Backend

LawEZY is a high-performance backend platform for legal consultations. It connects **Clients** seeking legal assistance with verified **Lawyers** for both **Online (Chat & Video)** and **Offline (In-Person Office Visit)** consultations.

---

## 📌 What Is LawEZY?

LawEZY provides an end-to-end legal consultation ecosystem featuring:

1. **Client & Lawyer Portals**: Seamless registration, login, and profile management for Clients, Lawyers, and Admins.
2. **Privacy-First Consultations**: Client contact details (Phone & Email) remain strictly **masked** from lawyers until a consultation is approved and paid for.
3. **Structured Meeting Codes**: Every consultation generates a unique meeting code formatted as `[CLIENT]-[LAWYER]-[DDMMYYYY]` (e.g., `SAM-SHASHI-01072006`).
4. **Multi-Modal Consultation Channels**:
   - 💬 **Online Real-Time Chat**: Live messaging with built-in anti-contact leakage security.
   - 🎥 **Online Video Conferencing**: Instant WebRTC video call links via Jitsi.
   - 🏢 **Offline Office Visits**: Verified office address & directions dispatched via email upon payment.
5. **Categorized Financial Engine**:
   - **Online Consultations**: 80% credited to Lawyer Wallet / 20% Platform Service Fee.
   - **Offline Office Visits**: 90% credited to Lawyer Wallet / 10% Dedicated Platform Fee.
6. **24-Hour No-Show Appeal & Admin Governance**:
   - Clients can raise an appeal if a lawyer fails to activate the consultation room within 24 hours of the scheduled slot.
   - Admins can issue **100% full refunds**, approve lawyer payout requests, and verify lawyer credentials.

---

## 🚀 How to Run the Project

### Option A: Run with Docker (Recommended)
Make sure Docker Desktop is running, then execute in your terminal:
```bash
docker-compose up --build
```

### Option B: Run with Maven
Ensure MySQL and MongoDB are running on your system, then execute:
```powershell
mvn spring-boot:run
```
*The server will boot on `http://localhost:8080`.*

---

## 🧪 How to Test This Project (Step-by-Step Testing Guide)

You can test all features interactively via **Swagger UI** by opening your browser to:
👉 **`http://localhost:8080/swagger-ui.html`**

Follow this exact step-by-step testing workflow:

### Step 1: Register Accounts
1. **Register Client**: `POST /api/auth/register`
   ```json
   {
     "email": "client@example.com",
     "password": "password123",
     "firstname": "Sam",
     "lastname": "Kumar",
     "role": "CLIENT"
   }
   ```
2. **Register Lawyer**: `POST /api/auth/register`
   ```json
   {
     "email": "lawyer@example.com",
     "password": "password123",
     "firstname": "Shashi",
     "lastname": "Sharma",
     "role": "LAWYER"
   }
   ```

### Step 2: Login & Get Bearer Token
* Hit `POST /api/auth/login` with your credentials to retrieve your JWT authentication token.

---

### Step 3: Client Submits Consultation Inquiry
* Hit `POST /api/consultations/request` as Client:
  ```json
  {
    "clientId": 1,
    "lawyerId": 2,
    "clientName": "Sam",
    "location": "Delhi",
    "query": "Property dispute legal advice",
    "requestedTimeSlot": "2026-07-01T10:30:00",
    "clientPhoneNumber": "+919876543210",
    "clientEmail": "client@example.com",
    "mode": "ONLINE_VIDEO"
  }
  ```
* **Expected Result**: Consultation created with meeting code `SAM-SHASHI-01072006`.
* **Privacy Check**: Phone and Email return as `XXXXX-XXXXX (Hidden until payment)`.

---

### Step 4: Lawyer Inbox Review & Fee Setting
1. **View Inbox**: `GET /api/consultations/lawyer-inbox/2`
   * Confirm lawyer can see `query`, `location`, and `timeSlot`, but contact details remain masked.
2. **Approve & Set Fee**: `POST /api/consultations/1/approve?customFee=500`
   * Status changes to `LAWYER_APPROVED`.

---

### Step 5: Process Payment Checkout
* Hit `POST /api/payments/checkout/1` as Client.
* **Expected Results**:
  1. Status updates to `PAID_CONFIRMED`.
  2. Phone and Email become unmasked for both parties.
  3. Video meeting URL generated: `https://meet.jit.si/SAM-SHASHI-01072006`.
  4. Confirmation pass emailed to `client@example.com`.
  5. ₹400 (80%) credited to Lawyer's digital wallet; ₹100 (20%) retained for platform service fee.

---

### Step 6: Test Online Room Controls
* Hit `POST /api/consultations/1/toggle-room?isRoomActive=true` as Lawyer.
* Status updates to `isRoomActive: true`.

---

### Step 7: Test 24-Hour Lawyer No-Show Appeal
* If the lawyer fails to activate the room within 24 hours of the time slot:
* Hit `POST /api/consultations/1/no-show-appeal` as Client.
* **Expected Result**: Creates an open Dispute Ticket for Admin review.

---

### Step 8: Admin Dispute Resolution & Payout Approval
1. **View Disputes**: `GET /api/admin/disputes`
2. **Resolve & Refund**: `POST /api/admin/disputes/1/resolve?approveRefund=true&adminNotes=Approved`
   * Status changes to `REFUNDED`. 100% full refund issued to client and lawyer wallet debited.
3. **Lawyer Request Payout**: `POST /api/payouts/request?lawyerId=2&amount=1000&bankDetails=HDFC1234`
4. **Admin Approve Payout**: `POST /api/admin/payouts/1/approve`
   * Payout processed and lawyer wallet balance updated.

---

### Step 9: View Aggregated Dashboards
* **Client Dashboard**: `GET /api/dashboard/client/1`
* **Lawyer Dashboard**: `GET /api/dashboard/lawyer/2` *(View Online vs. Offline earnings breakdown)*
* **Admin Dashboard**: `GET /api/dashboard/admin`
