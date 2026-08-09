# JurisOne Backend - Developer Handover & API Guide (Frontend) 🏛️

Welcome to the JurisOne Backend API! This document provides frontend developers with quick-start instructions, endpoint standards, response structures, and integration rules.

---

## 1. 🚀 Quick Start & Environment

1. **Repo Configuration**: Ensure `src/main/resources/application.yml` has your database credentials:
   - `SPRING_DATASOURCE_URL`: MySQL / TiDB connection string.
   - `SPRING_DATA_MONGODB_URI`: MongoDB Atlas connection URI.
   - `JWT_SECRET_256BIT`: A 256-bit secure secret key.
2. **Launch Application**:
   ```bash
   mvn spring-boot:run
   ```
3. **Interactive Swagger Docs**:
   👉 **`http://localhost:8080/swagger-ui.html`**

---

## 2. 📑 Unified API Response Format

All REST API endpoints return a standardized `ApiResponse<T>` JSON envelope:

```json
{
  "success": true,
  "message": "Consultation inquiry submitted successfully. Contact details masked for privacy.",
  "data": {
    "id": 1,
    "meetingCode": "SAM-SHASHI-01072006",
    "clientName": "Sam",
    "location": "Delhi",
    "query": "Property dispute legal advisory",
    "clientPhoneNumber": "XXXXX-XXXXX (Hidden until payment)",
    "clientEmail": "xxxxxx@masked.com (Hidden until payment)",
    "isContactInfoDisclosed": false,
    "mode": "ONLINE_VIDEO",
    "customFee": 500.0,
    "status": "LAWYER_APPROVED"
  },
  "timestamp": "2026-08-09T18:50:00"
}
```

---

## 3. 🔑 Key Integration Workflows for Frontend

### A. Preliminary Consultation Inquiry & Privacy Protection
1. **Client Request (`POST /api/consultations/request`)**:
   - Client fills out `Name`, `Location`, `RequestedTimeSlot`, `Query`, `Phone`, `Email`.
   - Contact details are **masked** initially for privacy protection.
2. **Lawyer Review & Approval (`POST /api/consultations/{id}/approve?customFee=500`)**:
   - Lawyer inspects query details (Phone & Email hidden) and sets custom fee.
3. **Payment Checkout (`POST /api/payments/checkout/{consultationId}`)**:
   - Client completes payment checkout.
   - **Post-Payment Actions**:
     - Phone & Email unmasked.
     - **80% (Online)** or **90% (Offline)** split credited to Lawyer Wallet.
     - HTML Email Pass dispatched with meeting code (e.g. `SAM-SHASHI-01072006`), video URL, or verified Lawyer Office Address.

### B. Room Controls & 24-Hour No-Show Appeals
* **Room Activation**: Lawyer toggles online room `ACTIVE / INACTIVE` (`POST /api/consultations/{id}/toggle-room?isRoomActive=true`).
* **24-Hr No-Show Appeal**: If lawyer fails to activate the room 24 hours past the scheduled slot, client calls `POST /api/consultations/{id}/no-show-appeal` to trigger an Admin Dispute Ticket for a **100% full refund**.

### C. Real-Time WebSockets (`/ws`)
* Connect via SockJS/STOMP to `ws://localhost:8080/ws`.
* Subscribe to topic `/topic/chat/{meetingCode}` (e.g. `/topic/chat/SAM-SHASHI-01072006`).

---

## 4. 🐳 Docker Deployment
```bash
docker-compose up --build
```

Happy Coding! 🚀
