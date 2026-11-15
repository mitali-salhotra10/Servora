# Servora — REST API Reference Documentation

**Base URL:** `http://localhost:5000/api/v1`  
**Authentication Scheme:** Bearer JWT (`Authorization: Bearer <accessToken>`)  
**Data Exchange Format:** `application/json` (Multipart for `/attachments`)  

---

## 1. Global Request & Response Specifications

### 1.1 Standard Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### 1.2 Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation of error",
    "details": [
      { "field": "siteId", "message": "Invalid siteId UUID" }
    ]
  }
}
```

### 1.3 Rate Limiting Headers
Every response includes sliding-window rate limit telemetry:
* `X-RateLimit-Limit`: Maximum requests permitted in window.
* `X-RateLimit-Remaining`: Remaining request quota.
* `X-RateLimit-Reset`: Unix timestamp when quota resets.
* `Retry-After`: Seconds to wait if `HTTP 429 Too Many Requests` is returned.

---

## 2. API Endpoints Reference

### 2.1 Authentication (`/auth`)
* `POST /auth/login`: Authenticate with `email` and `password`. Returns `{ accessToken, refreshToken, user }`. (Rate limit: 15 req / 15 min in prod).
* `POST /auth/register`: Register new `CUSTOMER` or `SERVICE_PROVIDER` account.
* `GET /auth/me`: Retrieve profile of currently authenticated user.
* `POST /auth/refresh`: Exchange refresh token for new access token.
* `POST /auth/logout`: Invalidate session.

### 2.2 Role Dashboards (`/dashboard`)
* `GET /dashboard/metrics`: Returns real, database-calculated metrics tailored to the requesting user's role (`ADMIN`, `CUSTOMER`, `SERVICE_MANAGER`, `TECHNICIAN`).

### 2.3 Facilities & Sites (`/sites`)
* `GET /sites`: List facility sites owned by customer or serviced by provider.
* `POST /sites`: Create a new facility with physical address, GPS coordinates, and geofence radius.
* `GET /sites/:id`: Retrieve detailed site information and registered equipment assets.

### 2.4 Equipment & QR Identification (`/equipment`)
* `GET /equipment/qr/:qrCode`: Resolve equipment by QR barcode identifier. Returns equipment specs, type, serial, and associated site.
* `GET /equipment/site/:siteId`: List all fire-safety assets registered at a facility.
* `POST /equipment`: Register a new fire extinguisher, hydrant, or alarm panel.
* `PATCH /equipment/:id`: Update equipment operational status or maintenance dates.

### 2.5 Maintenance Contracts (`/contracts`)
* `GET /contracts`: List active AMCs for requesting customer or provider.
* `GET /contracts/:id`: Retrieve contract terms, covered sites, and equipment list (IDOR protected).
* `POST /contracts`: Draft new maintenance agreement.

### 2.6 Service Requests (`/service-requests`)
* `GET /service-requests`: List open or historical defect reports.
* `POST /service-requests`: Customer submits defect report with urgency (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), preferred date, and description.
* `PATCH /service-requests/:id/status`: Transition ticket status (`SUBMITTED` $\rightarrow$ `TRIAGED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RESOLVED`).

### 2.7 Service Visits & Field Manifests (`/visits`)
* `GET /visits`: List visits filtered by tenant scope.
* `GET /visits/my-visits`: Technician daily assigned manifest.
* `POST /visits`: Manager schedules maintenance visit and assigns technician.
* `GET /visits/:id`: Detailed visit view with site coordinates, contact, and checklist.
* `PATCH /visits/:id/status`: Manager updates status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`).
* `POST /visits/:id/inspections`: Technician submits sealed inspection payload with `Idempotency-Key`. Enforces geofencing, calculates SHA-256 seal, and write-locks completed visit.

### 2.8 Evidence & Attachments (`/attachments`)
* `POST /attachments`: Multipart file upload for inspection photos (max 5 MB; JPEG, PNG, WebP). Validates magic bytes.
* `GET /attachments/:id`: Retrieve attachment metadata (IDOR protected).
* `GET /attachments/:id/file`: Stream binary file from storage with original MIME header.

### 2.9 Certificates & Verification (`/certificates`)
* `GET /certificates`: List issued certificates for customer or provider.
* `POST /certificates`: Generate compliance certificate and vector PDF for completed visit record.
* `GET /certificates/verify/:certificateNumber`: Public verification portal endpoint. Scrubs PII, masks site name, returns validity status and cryptographic seal.

### 2.10 System Health & Readiness
* `GET /health`: Liveness probe (HTTP 200).
* `GET /ready`: Readiness probe verifying Supabase PostgreSQL connection and reporting latency in milliseconds without exposing credentials.
