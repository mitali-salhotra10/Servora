# Servora — REST API Specification

**Document Version:** 1.0.0  
**Base Path:** `/api/v1`  
**Protocol:** HTTPS / TLS 1.3  
**Content-Type:** `application/json`  
**Authentication:** `Authorization: Bearer <JWT>`  

---

## 1. Global API Standards

### 1.1 Response Format Contract
Every API endpoint returns a standardized JSON envelope:

#### Successful Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description of error",
    "details": [
      {
        "field": "fieldName",
        "message": "Validation rule explanation"
      }
    ]
  }
}
```

### 1.2 Standard Error Codes
* `BAD_REQUEST` (HTTP 400): Malformed JSON syntax or bad query parameters.
* `UNAUTHORIZED` (HTTP 401): Missing, expired, invalid, or revoked JWT token.
* `FORBIDDEN` (HTTP 403): User lacks role authority or attempted unauthorized cross-tenant resource access.
* `NOT_FOUND` (HTTP 404): Requested entity does not exist or target route is unknown.
* `CONFLICT` (HTTP 409): Duplicate email, contract number, or unique resource conflict.
* `VALIDATION_ERROR` (HTTP 422): Request body failed Zod schema parsing.
* `INTERNAL_SERVER_ERROR` (HTTP 500): Unhandled server exception.

---

## 2. Implemented & Verified API Endpoints

### 2.1 System Health & Readiness Probes

#### `GET /health`
* **Purpose:** Basic liveness probe reporting service status, environment, and uptime.
* **Access Rule:** Public (unauthenticated).
* **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "uptimeSeconds": 1420,
      "timestamp": "2026-11-03T10:00:00.000Z",
      "environment": "development",
      "service": "servora-backend",
      "version": "0.1.0"
    }
  }
  ```
* **Associated Requirements:** SEC-009, NFR-014.
* **Associated Test:** `tests/integration/health.test.ts`.

#### `GET /ready`
* **Purpose:** Readiness probe checking database connectivity without leaking credentials.
* **Access Rule:** Public (unauthenticated).
* **Response:**
  * **HTTP 200 (Database Connected):**
    ```json
    {
      "success": true,
      "data": {
        "status": "ready",
        "database": { "connected": true, "latencyMs": 4 },
        "timestamp": "2026-11-03T10:00:00.000Z"
      }
    }
    ```
  * **HTTP 503 (Database Unreachable):**
    ```json
    {
      "success": false,
      "data": {
        "status": "not_ready",
        "database": {
          "connected": false,
          "message": "Database is not reachable. Check DATABASE_URL and database service status."
        },
        "timestamp": "2026-11-03T10:00:00.000Z"
      }
    }
    ```
* **Associated Test:** `tests/integration/health.test.ts`.

---

### 2.2 Authentication & Identity (`/api/v1/auth`)

#### `POST /api/v1/auth/register`
* **Purpose:** Create a new user account with initial role `CUSTOMER` or `SERVICE_PROVIDER`.
* **Access Rule:** Public. Self-registration as `ADMIN` or `SERVICE_MANAGER` is strictly disallowed.
* **Request Body:**
  ```json
  {
    "email": "facility.manager@example.com",
    "password": "SecurePassword123!",
    "role": "CUSTOMER",
    "phone": "+919876543210",
    "contactPersonName": "Rajesh Kumar",
    "companyName": "Apex Logistics Ltd",
    "billingAddress": "Sector 18, Gurugram"
  }
  ```
* **Validation Rules:**
  * Password must be >= 8 characters and contain >= 1 numeral and >= 1 special symbol.
  * Role must be `CUSTOMER` or `SERVICE_PROVIDER`.
  * `contactPersonName` required for Customer; `businessName` and `licenseNumber` required for Provider.
* **Response (HTTP 201):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "11111111-1111-4111-a111-111111111111",
        "email": "facility.manager@example.com",
        "role": "CUSTOMER",
        "phone": "+919876543210",
        "isActive": true,
        "customerProfile": {
          "id": "22222222-2222-4222-a222-222222222222",
          "companyName": "Apex Logistics Ltd",
          "contactPersonName": "Rajesh Kumar"
        },
        "providerProfile": null
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Errors:** 409 Conflict (email exists), 422 Validation Error (weak password or invalid role).
* **Associated Requirements:** FR-001, FR-005, SEC-001.
* **Associated Test:** `tests/integration/auth.test.ts`.

#### `POST /api/v1/auth/login`
* **Purpose:** Authenticate credentials, record login audit event, and issue signed JWT access token.
* **Access Rule:** Public. Rate-limited.
* **Request Body:**
  ```json
  {
    "email": "facility.manager@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response (HTTP 200):** Same user summary and JWT token structure as registration.
* **Errors:** 401 Unauthorized ("Invalid email or password").
* **Associated Requirements:** FR-002, SEC-002, SEC-011.
* **Associated Test:** `tests/integration/auth.test.ts`.

#### `GET /api/v1/auth/me`
* **Purpose:** Retrieve the authenticated user's profile and organizational claims.
* **Access Rule:** Authenticated (Bearer JWT).
* **Response (HTTP 200):** Full user profile summary. Never returns `passwordHash`.
* **Errors:** 401 Unauthorized.
* **Associated Requirements:** FR-006.
* **Associated Test:** `tests/integration/auth.test.ts`.

#### `POST /api/v1/auth/logout`
* **Purpose:** Invalidate active access tokens by incrementing `tokenVersion` on the database record.
* **Access Rule:** Authenticated (Bearer JWT).
* **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "message": "Successfully logged out and revoked active tokens"
  }
  ```
* **Associated Requirements:** FR-004, SEC-002.
* **Associated Test:** `tests/integration/auth.test.ts`.

---

### 2.3 Customer Sites & Facilities (`/api/v1/sites`)

#### `POST /api/v1/sites`
* **Purpose:** Register a new physical facility with GPS coordinates and geofence radius.
* **Access Rule:** `CUSTOMER`, `ADMIN`.
* **Request Body:**
  ```json
  {
    "siteName": "Main Warehouse South Gate",
    "address": "Plot 42, Industrial Area Phase 2",
    "city": "Chandigarh",
    "postalCode": "160002",
    "latitude": 30.7046,
    "longitude": 76.7179,
    "geofenceRadiusMeters": 100,
    "onSiteContactName": "Vikram Singh",
    "onSiteContactPhone": "+919811122233"
  }
  ```
* **Validation Rules:** Latitude must be between -90 and 90; longitude between -180 and 180; geofence radius >= 10m.
* **Response (HTTP 201):** Created `Site` entity.
* **Associated Requirements:** FR-008.

#### `GET /api/v1/sites`
* **Purpose:** List all sites owned by the authenticated customer.
* **Access Rule:** `CUSTOMER`, `ADMIN`.
* **Response (HTTP 200):** Array of `Site` objects with count of equipment and visit schedules.
* **Associated Requirements:** FR-008, SEC-003.

#### `GET /api/v1/sites/:id`
* **Purpose:** Retrieve site details by ID.
* **Access Rule:** Target Site Owner (`CUSTOMER`) or `ADMIN`.
* **Errors:** 403 Forbidden if accessed by another customer; 404 Not Found if site doesn't exist.
* **Associated Requirements:** SEC-003.
* **Associated Test:** `tests/integration/tenant_isolation.test.ts`.

#### `PUT /api/v1/sites/:id`
* **Purpose:** Update site address, geofence, or contact details.
* **Access Rule:** Target Site Owner (`CUSTOMER`) or `ADMIN`.
* **Errors:** 403 Forbidden if attempted across tenants.
* **Associated Requirements:** SEC-003.
* **Associated Test:** `tests/integration/tenant_isolation.test.ts`.

---

### 2.4 Equipment & Safety Assets (`/api/v1/equipment`)

#### `POST /api/v1/equipment`
* **Purpose:** Register a fire safety asset (extinguisher, hydrant, alarm panel) to a customer site.
* **Access Rule:** Target Site Owner (`CUSTOMER`), `SERVICE_MANAGER`, `ADMIN`.
* **Request Body:**
  ```json
  {
    "siteId": "33333333-3333-4333-a333-333333333333",
    "serialNumber": "EXT-CO2-9901",
    "qrCodeIdentifier": "QR-EXT-9901",
    "equipmentType": "FIRE_EXTINGUISHER",
    "specification": "4.5kg CO2 Portable Extinguisher",
    "locationInSite": "Server Room - Rack Row B",
    "manufacturingDate": "2024-03-15T00:00:00.000Z"
  }
  ```
* **Validation Rules:** `equipmentType` must match enum (`FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM_PANEL`, `DETECTOR_SENSOR`). `qrCodeIdentifier` must be globally unique.
* **Errors:** 403 Forbidden if customer does not own target `siteId`; 409 Conflict if QR code already registered.
* **Associated Requirements:** FR-009, SEC-003.
* **Associated Test:** `tests/integration/tenant_isolation.test.ts`.

#### `GET /api/v1/equipment/site/:siteId`
* **Purpose:** List all safety equipment installed at a specific site.
* **Access Rule:** Target Site Owner (`CUSTOMER`) or `ADMIN`.
* **Errors:** 403 Forbidden if requested by a different customer.
* **Associated Requirements:** FR-009, SEC-003.
* **Associated Test:** `tests/integration/tenant_isolation.test.ts`.

#### `GET /api/v1/equipment/qr/:qrCode`
* **Purpose:** Fast lookup of equipment and site details by scanning equipment physical QR tag.
* **Access Rule:** Authenticated (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
* **Response (HTTP 200):** Equipment details, site name, GPS coordinates, and inspection history.
* **Associated Requirements:** FR-009, FR-046.

---

### 2.5 Maintenance Contracts (`/api/v1/contracts`)

#### `POST /api/v1/contracts`
* **Purpose:** Create an Annual/Quarterly Maintenance Contract (AMC/QMC) and **automatically generate recurring visit slots**.
* **Access Rule:** `SERVICE_MANAGER`, `ADMIN`. Customers cannot self-create contracts.
* **Request Body:**
  ```json
  {
    "contractNumber": "AMC-2026-0042",
    "customerId": "11111111-1111-4111-a111-111111111111",
    "providerId": "22222222-2222-4222-a222-222222222222",
    "siteId": "33333333-3333-4333-a333-333333333333",
    "frequency": "QUARTERLY",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-12-31T00:00:00.000Z",
    "gracePeriodDays": 7,
    "termsSummary": "Quarterly inspection and pressure testing of all hydrants and extinguishers",
    "equipmentIds": ["55555555-5555-4555-a555-555555555555"]
  }
  ```
* **Validation Rules:** `endDate` must be after `startDate`. `frequency` must be `MONTHLY`, `QUARTERLY`, `BI_ANNUAL`, or `ANNUAL`.
* **Automatic Workflow:** Generates planned `VisitSchedule` slots offset by the frequency interval across the contract duration (FR-027).
* **Response (HTTP 201):** Created Contract entity including generated `visitSchedules` array.
* **Associated Requirements:** FR-022, FR-023, FR-024, FR-027.
* **Associated Test:** `tests/integration/contracts_visits.test.ts`.

#### `GET /api/v1/contracts`
* **Purpose:** List contracts for the authenticated customer or provider organization.
* **Access Rule:** Authenticated.
* **Associated Requirements:** FR-022.

---

### 2.6 Visit Scheduling & Dispatch (`/api/v1/visits`)

#### `PUT /api/v1/visits/:id/assign`
* **Purpose:** Dispatch / assign a specific technician to a planned visit slot.
* **Access Rule:** `SERVICE_MANAGER`, `ADMIN`.
* **Request Body:**
  ```json
  {
    "technicianId": "44444444-4444-4444-a444-444444444444"
  }
  ```
* **Response (HTTP 200):** Updated `VisitSchedule` with `status: "ASSIGNED"` and assigned technician contact details.
* **Associated Requirements:** FR-028.
* **Associated Test:** `tests/integration/contracts_visits.test.ts`.

#### `GET /api/v1/visits/my-assigned`
* **Purpose:** Retrieve daily visit manifest assigned to the requesting field technician.
* **Access Rule:** `SERVICE_PROVIDER` (Technician), `SERVICE_MANAGER`.
* **Response (HTTP 200):** Array of assigned visits ordered by target date.
* **Associated Requirements:** FR-032.

### 2.6 Field Visit Execution & Inspection Endpoints

#### `GET /api/v1/visits/checklists/templates`
* **Purpose:** Retrieve standard inspection checklist templates by equipment category (`FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM_PANEL`, `DETECTOR_SENSOR`).
* **Access Rule:** Authenticated (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
* **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "tmpl-uuid",
        "equipmentCategory": "FIRE_EXTINGUISHER",
        "title": "Standard Portable Fire Extinguisher Inspection",
        "version": 1,
        "schemaJson": {
          "fields": [
            { "id": "pressureGaugeBar", "label": "Pressure Gauge Reading (Bar)", "type": "number", "unit": "bar", "greenMin": 10, "greenMax": 16, "required": true }
          ]
        }
      }
    ]
  }
  ```

#### `GET /api/v1/visits/:id`
* **Purpose:** Retrieve detailed visit manifest, site GPS boundary, contract info, and list of site equipment.
* **Access Rule:** Site Owner (`CUSTOMER`), Assigned Technician (`SERVICE_PROVIDER`), Manager, or Admin.
* **Response (HTTP 200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "visit-uuid",
      "status": "SCHEDULED",
      "scheduledDate": "2026-11-03T09:00:00.000Z",
      "site": {
        "id": "site-uuid",
        "name": "Corporate Tower A",
        "latitude": 29.7604,
        "longitude": -95.3698,
        "geofenceRadiusMeters": 100,
        "equipment": [...]
      }
    }
  }
  ```

#### `POST /api/v1/visits/:id/inspections`
* **Purpose:** Submit completed field inspection with checklist responses, photos, and client idempotency key. Executes Haversine GPS geofence check, seals the record with a deterministic SHA-256 canonical hash (SEC-007), transitions visit status to `COMPLETED`, and logs an immutable audit event.
* **Access Rule:** Assigned Technician (`SERVICE_PROVIDER`), Manager, or Admin.
* **Headers:** `Idempotency-Key: <client-generated-uuid>` (or `x-idempotency-key`).
* **Behavior on Idempotent Duplicate:**
  * Detects existing `VisitRecord` by `idempotencyKey`.
  * Returns cached record with header `X-Cache-Lookup: HIT` and status HTTP 200 OK without creating duplicate rows.
* **Response (HTTP 201 Created or HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Inspection submitted and sealed successfully",
    "data": {
      "id": "rec-uuid",
      "visitScheduleId": "visit-uuid",
      "technicianId": "user-uuid",
      "idempotencyKey": "client-uuid",
      "isGeofenceVerified": true,
      "recordHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "checklistResponses": [...]
    }
  }
  ```
* **Associated Requirements:** FR-033, FR-034, FR-035, FR-037, FR-041, FR-042, FR-044, SEC-007.

---

### 2.7 Binary Evidence Storage (`/api/v1/attachments`)

#### `POST /api/v1/attachments`
* **Purpose:** Upload binary photographic evidence or customer signature image (multipart/form-data), compute SHA-256 binary hash, and record attachment metadata.
* **Access Rule:** Authenticated (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
* **Request:** Multipart form data containing:
  - `file`: Binary file (JPEG, PNG, WebP; max 5MB)
  - `attachmentType`: `PHOTO_BEFORE`, `PHOTO_AFTER`, `PRESSURE_GAUGE`, `SIGNATURE_IMAGE`, or `DEFECT_PROOF`
  - `visitRecordId` (optional): UUID of visit record
  - `equipmentId` (optional): UUID of specific equipment
* **Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "Attachment uploaded successfully",
    "data": {
      "id": "att-uuid",
      "attachmentType": "PHOTO_AFTER",
      "fileName": "photo.jpg",
      "mimeType": "image/jpeg",
      "fileSizeBytes": 128450,
      "sha256Hash": "a1b2c3d4...",
      "downloadUrl": "/api/v1/attachments/att-uuid/file",
      "createdAt": "2026-11-04T10:00:00.000Z"
    }
  }
  ```
* **Associated Requirements:** FR-035, SEC-005.

#### `GET /api/v1/attachments/:id/file`
* **Purpose:** Stream the raw binary file contents with proper `Content-Type` and `Content-Disposition`.
* **Access Rule:** Authenticated.
* **Response (HTTP 200 OK):** Binary image stream.

---

### 2.8 Compliance Certificates & Public Verification (`/api/v1/certificates`)

#### `GET /api/v1/certificates/verify/:certificateNumber`
* **Purpose:** Public verification portal for fire marshals, facility managers, and auditors scanning the 2D QR matrix on compliance certificates.
* **Access Rule:** Public (unauthenticated, zero customer PII leaked per SEC-006).
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "certificateNumber": "CERT-2026-00001",
      "status": "VALID",
      "issuedDate": "2026-11-04",
      "expirationDate": "2027-11-04",
      "maskedSiteName": "Al*** Lo*** Wa***",
      "providerBusinessName": "Apex Fire Protection Ltd",
      "equipmentCount": 12,
      "complianceVerdict": "COMPLIANT",
      "verificationHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "isSealValid": true
    }
  }
  ```
* **Associated Requirements:** FR-047, SEC-006.

#### `GET /api/v1/certificates/:idOrNumber/pdf`
* **Purpose:** Download formal PDF compliance certificate generated with PDFKit and embedded 2D QR matrix.
* **Access Rule:** Authenticated (or matching valid certificate number).
* **Response (HTTP 200 OK):** `application/pdf` binary stream.

#### `POST /api/v1/certificates/generate`
* **Purpose:** Trigger compliance certificate generation for a completed `VisitRecord`.
* **Access Rule:** Service Provider or Manager.
* **Response (HTTP 201 Created):** Certificate metadata object.
* **Associated Requirements:** FR-045, FR-048.

---

### 2.9 Role-Specific Operational Dashboards (`/api/v1/dashboard`)

#### `GET /api/v1/dashboard/metrics`
* **Purpose:** Returns role-tailored dashboard metrics and statistics driven entirely by real tenant records (or explicit demo fallback).
* **Access Rule:** Authenticated (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "role": "CUSTOMER",
      "isDemoMode": false,
      "dataSource": "POSTGRESQL_LIVE",
      "metrics": {
        "totalFacilities": 2,
        "totalEquipment": 42,
        "complianceStatus": "COMPLIANT",
        "upcomingInspections": 2,
        "openServiceRequests": 1,
        "recentInspectionHistory": [...],
        "facilities": [...]
      }
    }
  }
  ```
* **Associated Requirements:** FR-005, FR-008, FR-015, FR-016.
* **Associated Test:** `tests/integration/role_dashboard.test.ts`.

---

### 2.10 Customer Service Requests & Issue Reports (`/api/v1/service-requests`)

#### `POST /api/v1/service-requests`
* **Purpose:** Customer logs a maintenance defect, equipment complaint, or service request for immediate dispatch.
* **Access Rule:** `CUSTOMER`, `SERVICE_MANAGER`, `ADMIN`. Enforces tenant site ownership boundary.
* **Request Body:**
  ```json
  {
    "siteId": "site-demo-1",
    "category": "Fire Extinguisher Pressure Defect",
    "urgency": "HIGH",
    "preferredDate": "2026-11-12",
    "preferredTimeSlot": "MORNING_09_12",
    "customerNotes": "Pressure needle on unit in Server Room dropped into red zone."
  }
  ```
* **Response (HTTP 201 Created):** Created request record with ticket number.
* **Associated Requirements:** FR-017, FR-019.

#### `GET /api/v1/service-requests`
* **Purpose:** List service requests filtered by authenticated role and tenant ownership.
* **Access Rule:** Authenticated (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
* **Response (HTTP 200 OK):** Array of service requests.

#### `PATCH /api/v1/service-requests/:id/status`
* **Purpose:** Update status of a service request (e.g. `ACCEPTED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
* **Access Rule:** `CUSTOMER` (cancellation only), `SERVICE_MANAGER`, `ADMIN`.
* **Response (HTTP 200 OK):** Updated request record.
* **Associated Requirements:** FR-020, FR-021.

---

## 3. PROPOSED API CONTRACT — SCHEDULED FOR PHASE 6

> [!NOTE]
> The endpoints below are planned for Phase 6 (Provider Marketplace & Geo-Discovery).

#### `GET /api/v1/providers/discover`
* **Proposed Purpose:** Search certified providers within geographical radius of a facility site.
* **Proposed Access Rule:** `CUSTOMER`.
* **Associated Requirements:** FR-018.
