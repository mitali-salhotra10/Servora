# Servora — Next Development Step: Phase 6 Service Requests & Provider Discovery

**Target Phase:** Phase 6 — Customer Service Requests, Provider Discovery & Job Dispatch  
**Document Status:** Ready for Execution  
**Effective Date:** November 4, 2026  
**Authoritative References:**
- Architecture & Tech Stack: [`docs/architecture/system-architecture.md`](../architecture/system-architecture.md), [`docs/architecture/technology-stack.md`](../architecture/technology-stack.md)
- REST API Specification: [`docs/architecture/api-specification.md`](../architecture/api-specification.md)
- Functional Requirements: [`docs/requirements/functional-requirements.md`](../requirements/functional-requirements.md) (FR-017, FR-018, FR-019, FR-020, FR-021)
- Traceability Matrix: [`docs/testing/requirements-traceability.md`](../testing/requirements-traceability.md)
- Project Audit: [`docs/PROJECT_AUDIT.md`](../PROJECT_AUDIT.md)

---

## 1. Project Context & Current Completion State

Servora is a cloud-based maintenance, inspection, and compliance management platform tailored for field service contractors, technicians, facility managers, and building owners operating across life-safety and fire protection domains.

### What is Completed (Phases 1 through 5 Baseline):
1. **Frozen Phase 1 Specifications:** Complete functional requirements (FR-001–FR-058), quality attributes (NFR-001–NFR-025), MoSCoW scoping, 17-entity relational data model, and security policies (SEC-001–SEC-011).
2. **Phase 2 Backend Foundation:**
   - Production Express REST API with strict TypeScript compilation (`server/dist/`).
   - 17-entity Prisma schema matching all domain entities.
   - Core security middlewares: JWT authentication with token revocation, RBAC, tenant isolation context, Helmet headers, and CORS.
   - Core domain modules: `/api/v1/auth`, `/api/v1/sites`, `/api/v1/equipment`, `/api/v1/contracts`, `/api/v1/visits`, and audit logging.
3. **Phase 3 Client PWA Shell:**
   - React 18 + Vite + Tailwind CSS application in `client/`.
   - Centralized Axios client with Bearer token injection and 401 unauthenticated event handler.
   - AuthContext with session restoration and role-aware navigation.
   - Facility and site management screens (`SitesPage`, `CreateSitePage`, `SiteDetailPage`, `DashboardPage`, `ProfilePage`).
4. **Phase 4 Field Operations & Offline Synchronization:**
   - Client-side IndexedDB database (`Dexie.js` in `client/src/db/index.ts`).
   - Idempotent `SyncManager` background queue with UUIDv4 generation and network recovery replay.
   - Offline status banner (`SyncStatusBanner`) with pending queue counter.
   - HTML5 QR camera scanner (`QrScannerModal`) with manual fallback and asset auto-matching.
   - Dynamic inspection checklists (`ChecklistForm`) with green-zone pressure gauges, pass/fail toggles, and photo evidence.
   - Master field execution view (`VisitExecutionPage`) with Haversine GPS geofence validation.
   - Daily technician manifest (`MyVisitsPage`) with offline caching.
5. **Phase 5 Digital Trust Chain, Signatures & PDF Certificates:**
   - Customer Digital Signature Modal (`SignaturePadModal.tsx`): High-DPI canvas capturing touch/stylus/pointer, typed signer name, acknowledgment statement checkbox, base64 PNG export.
   - Multipart binary evidence upload (`POST /api/v1/attachments`), 5MB limit, JPEG/PNG/WebP validation, server-controlled filenames in `server/uploads/`, SHA-256 digest computation (SEC-005), and streaming download (`GET /api/v1/attachments/:id/file`).
   - Canonical JSON record sealing incorporating visit record, GPS coordinates, checklist responses, customer signature hash, and attachment hashes (SEC-007).
   - Headless PDF compliance certificate generation via `PDFKit` with 2D verification QR code, stable numbering (`CERT-YYYY-XXXXX`), pass/fail badges, contractor details.
   - Public read-only verification portal (`GET /api/v1/certificates/verify/:certificateNumber` and `/verify/:certificateNumber`) enforcing SEC-006 PII privacy masking.
   - 106 automated tests passing across 23 test suites (68 backend + 38 frontend).

---

## 2. Phase 6 Objectives: Service Requests & Provider Discovery

### Key Features to Implement:
1. **Customer Service Request Workflow (FR-017, FR-019):**
   - Customer creates an ad-hoc service request specifying facility site, affected equipment category, urgency level (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), and preferred time window.
   - Support direct dispatch to an existing contractor or broadcast to certified local providers.
2. **Provider Discovery & Geosearch (FR-018):**
   - Geospatial search for certified contractors based on distance from site coordinates (Haversine formula).
   - Filter by equipment capabilities (Extinguishers, Hydrants, Detection Panels).
   - Display verified trade licenses, verified badges, and aggregate rating.
3. **Provider Acceptance / Rejection Engine (FR-020):**
   - Provider inbox / alert for pending incoming service requests.
   - Accept action creates an ad-hoc `VisitSchedule` and assigns a technician.
   - Reject action notifies customer and optionally re-broadcasts.
4. **Real-Time Request Lifecycle Tracking (FR-021):**
   - Live visual status pipeline: `SUBMITTED` → `ACCEPTED` → `TECHNICIAN_DISPATCHED` → `IN_PROGRESS` → `COMPLETED`.

---

## 3. Architecture & Traceability Targets

| Target Requirement | Feature Description | Primary Implementation Target |
| :--- | :--- | :--- |
| **FR-017** | Service Request Creation | `server/src/controllers/serviceRequest.controller.ts`, `client/src/pages/requests/CreateRequestPage.tsx` |
| **FR-018** | Provider Discovery & Geosearch | `server/src/services/provider.service.ts`, `client/src/pages/providers/ProviderDirectoryPage.tsx` |
| **FR-019** | Direct vs Broadcast Request | `ServiceRequest.isBroadcast` logic in backend service |
| **FR-020** | Request Acceptance / Rejection | `POST /api/v1/service-requests/:id/accept`, `POST /api/v1/service-requests/:id/reject` |
| **FR-021** | Real-Time Request Status Tracking | `client/src/pages/requests/RequestTrackingPage.tsx` |

---

## 4. Verification & Testing Strategy

- Unit tests for distance calculation and provider qualification filters.
- Integration tests for request creation, broadcast matching, and acceptance state transitions.
- Client component tests for request wizard and provider discovery grid.
- All existing 106 tests must remain green.
