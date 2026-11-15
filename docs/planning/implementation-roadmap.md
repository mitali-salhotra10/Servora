# Servora — Multi-Phase Implementation Roadmap

**Document Version:** 1.0.0  
**Status:** Living Engineering Roadmap  
**Effective Date:** November 3, 2026  
**Project:** Servora — Trusted Digital Field-Service Platform  

---

## 1. Overview & Phasing Strategy

This roadmap details the sequential engineering phases required to advance **Servora** from its current backend-verified baseline to a production-ready, verified field-service platform for safety-critical maintenance.

Milestones are strictly ordered by **architectural dependency** and **technical risk**:
1. Foundation & Specifications (Phases 1 & 2) must precede UI creation.
2. The Client UI and Session state (Phase 3) must be established before offline queueing can be wired to components.
3. Field inspection workflows and local IndexedDB caching (Phase 4) must function reliably before cryptographic trust hashing and multi-part photo uploads (Phase 5) are finalized.
4. Formal PDF compliance certificate generation and public verification (Phase 6) depend on completed visit records and signatures.
5. End-to-end integration and release deployment (Phases 9 & 10) tie all subsystems together.

> [!NOTE]
> All effort indicators listed below are **engineering estimates** based on full-time developer velocity and standard software engineering practices. They do not represent fixed calendar deadlines.

---

## 2. Milestone 1 — Phase 1: Requirements & System Design (BASELINE COMPLETED)

* **Objective:** Establish, review, and freeze the formal engineering specifications for the fire-safety field service domain.
* **Status:** `COMPLETE AND VERIFIED` (Git Commit `6032072`).
* **Delivered Artifacts:**
  * Product Requirements Document (`docs/requirements/product-requirements.md`)
  * Functional Requirements Specification FR-001–FR-058 (`docs/requirements/functional-requirements.md`)
  * Non-Functional Requirements Specification NFR-001–NFR-025 (`docs/requirements/non-functional-requirements.md`)
  * MoSCoW Scope Prioritization (`docs/requirements/moscow.md`)
  * System Architecture Document (`docs/architecture/system-architecture.md`)
  * Technology Stack Specification (`docs/architecture/technology-stack.md`)
  * Conceptual Data Model covering 17 entities (`docs/database/data-model.md`)
  * Security Architecture Specification SEC-001–SEC-011 (`docs/security/security-requirements.md`)
* **Definition of Done:** All documents peer-reviewed, frozen, and committed to version control.

---

## 3. Milestone 2 — Phase 2: Backend API & Database Foundation (CURRENT BASELINE)

* **Objective:** Implement the server workspace, relational PostgreSQL Prisma schema, authentication, RBAC, multi-tenant boundaries, and initial domain modules.
* **Status:** `COMPLETE AND VERIFIED` (Uncommitted working directory files, 54 passing tests).
* **Dependencies:** Phase 1 specifications.
* **Implemented Capabilities:**
  * Root npm monorepo workspaces (`client`, `server`).
  * Full 17-entity Prisma schema validated with `prisma validate` and client generated.
  * Express REST API with Helmet security headers, CORS, Zod validation, and centralized error handling.
  * bcrypt password hashing (salt rounds: 10) and complexity validation (SEC-001).
  * Stateless HMAC-SHA256 JWT issuance with `tokenVersion` revocation (SEC-002).
  * Role-based access control (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
  * Multi-tenant resource ownership isolation (`requireSiteOwnership`) with cross-customer 403 Forbidden enforcement (SEC-003).
  * Core domain modules: Sites (with GPS coordinates and geofence radius), Equipment registry (with QR code lookup), Maintenance Contracts (AMCs), and automated recurring Visit slot generation (FR-027).
  * Deterministic canonical JSON and SHA-256 seal generator (`hash.ts`).
  * 54 unit and integration tests passing in Vitest.
* **Definition of Done:** 100% TypeScript type-checking, ESLint passing with zero errors, and all 54 unit and integration tests passing.

---

## 4. Milestone 3 — Phase 3: Client PWA Application Shell & Core User Journeys

* **Objective:** Scaffold the React 18 + Vite + Tailwind CSS Progressive Web Application and connect client user journeys to the verified Phase 2 backend REST API.
* **Dependencies:** Phase 2 backend API and authentication endpoints.
* **Status:** `COMPLETE AND VERIFIED`
* **Delivered Artifacts:**
  1. Bootstrapped `client/src/main.tsx`, `App.tsx`, `index.html` with React 18, React Router v6, and strict TypeScript.
  2. Configured Tailwind CSS with Servora enterprise theme, WCAG 2.1 AA contrast, and >=44px touch targets.
  3. Built centralized Axios API client (`client/src/api/client.ts`) with Bearer token injection, session token management, and 401 unauthenticated event handling.
  4. Implemented `AuthContext` with automatic session restoration, login, role-based registration, and logout flows.
  5. Implemented role-aware layout components (`AppLayout`, `Navbar`, `Sidebar`, `MobileNav`) with role badges and responsive viewports.
  6. Implemented core domain screens: `LoginPage`, `RegisterPage`, `DashboardPage` (with real database metrics), `SitesPage`, `CreateSitePage` (with browser GPS detection), `SiteDetailPage`, and `ProfilePage`.
  7. Automated testing: 4 test suites, 15 tests passed using Vitest and React Testing Library (`api_client.test.ts`, `routing_navigation.test.tsx`, `auth.test.tsx`, `sites.test.tsx`).
  8. Production build verified: `client/dist/` generated with 0 errors.
  * Mock service worker (MSW) or API integration tests for login and site listing.
* **Definition of Done:** Client builds cleanly via `npm run build --workspace=client`, passes `tsc --noEmit`, and connects to the backend API.

---

## 5. Milestone 4 — Phase 4: Technician Field Workflow & Offline Synchronization

* **Objective:** Implement the offline-first field execution engine allowing safety technicians to inspect equipment, fill checklists, and queue updates in basements with zero connectivity.
* **Dependencies:** Phase 2 visit APIs and Phase 3 client scaffolding.
* **Status:** `COMPLETE AND VERIFIED`
* **Delivered Capabilities:**
  1. Configured Dexie.js IndexedDB schema (`ServoraOfflineDB`) in `client/src/db/index.ts` with tables `cachedVisits`, `cachedSites`, `cachedEquipment`, `checklistDrafts`, and `syncQueue`.
  2. Implemented `SyncManager` background queue manager (`client/src/sync/syncManager.ts`) with UUIDv4 idempotency key generation, automatic replay upon `window.online` restoration, draft cleanup, and atomic state transitions (`PENDING` -> `SYNCING` -> `SYNCED` / `FAILED`).
  3. Built `useSyncStatus` hook and `SyncStatusBanner` component with pending queue count badge, online/offline detection, and manual "Sync Now" trigger.
  4. Implemented `QrScannerModal` with HTML5-QRCode camera scanner viewport, camera permission error handling, manual serial code input fallback, equipment-to-site verification, and resolved asset auto-selection.
  5. Built `EvidenceCapture` component with camera capture, file upload, 5MB size limit validation, photo preview, and base64 encoding.
  6. Implemented dynamic `ChecklistForm` supporting pass/fail toggles, numerical observations (e.g. pressure gauge PSI with green-zone visual indicator), and real-time draft persistence into IndexedDB.
  7. Built `MyVisitsPage` daily manifest with status filters and offline fallback, and `VisitExecutionPage` with GPS geofence tracking, asset progress bar, and inspection submission.
  8. Implemented backend inspection submission endpoint (`POST /api/v1/visits/:id/inspections`) with `Idempotency-Key` / `x-idempotency-key` extraction, duplicate request caching (`X-Cache-Lookup: HIT`), Haversine 100m geofence evaluation, deterministic SHA-256 canonical hashing (SEC-007), transactional status update, and audit logging.
  9. Automated test verification: 8 backend integration tests in `inspection_sync.test.ts` + 4 frontend test files (14 tests) covering `offline_sync.test.ts`, `qr_scanner.test.tsx`, `checklists.test.tsx`, and `field_visits.test.tsx`. All 91 monorepo tests passing.
* **Definition of Done:** Zero data loss during simulated offline field inspections; verified idempotent synchronization with SHA-256 sealed records.

---

## 6. Milestone 5 — Phase 5: Digital Trust Chain, Customer Signatures, Binary Evidence & PDF Certificates

* **Objective:** Implement field evidence capture (customer vector signatures, binary file storage), complete the customer sign-off workflow, seal the trust chain with canonical SHA-256 digests, and generate formal PDF compliance certificates with public QR verification.
* **Dependencies:** Phase 4 field workflow and SHA-256 sealed visit records.
* **Status:** `COMPLETE AND VERIFIED`
* **Delivered Capabilities:**
  1. **Customer Digital Signature Modal (`SignaturePadModal.tsx`):**
     * High-DPI scaled HTML5 Canvas capturing touch, stylus, and pointer interactions.
     * Captured signer representative name, title, and mandatory legal sign-off declaration acknowledgment.
     * Vector signature rendered and exported as Base64 PNG.
     * Integrated into `VisitExecutionPage` before final inspection sealing.
  2. **Binary Evidence Upload Pipeline (`POST /api/v1/attachments` & `GET /api/v1/attachments/:id/file`):**
     * Multer-powered multipart upload engine enforcing 5MB file limit and MIME validation (`image/jpeg`, `image/png`, `image/webp`).
     * Server-controlled UUID filenames stored securely in `server/uploads/`.
     * Cryptographic SHA-256 binary content hashing computed and persisted to `Attachment` record (SEC-005).
     * Protected file streaming endpoint with MIME-typed headers.
  3. **Cryptographic Trust Chain Record Sealing (SEC-007):**
     * Extended canonical JSON stringify to incorporate checklist responses, GPS coordinates, customer signature SHA-256 digest, and evidence attachment digests.
     * Deterministic SHA-256 `recordHash` sealing prevents any post-completion tampering.
  4. **Headless PDF Compliance Certificate Generation (`PDFKit`):**
     * Multi-page/single-page layout with official life-safety header, stable certificate number sequence (`CERT-YYYY-XXXXX`), validity period, and contractor trade license.
     * High-contrast 2D QR code matrix directing to public verification portal.
     * Masked facility identifier, inspected assets audit table, customer signature graphic, and verification seal badge.
  5. **Public Verification API & Web Portal (SEC-006 / FR-047):**
     * Unauthenticated public endpoint (`GET /api/v1/certificates/verify/:certificateNumber`).
     * Privacy Sanitization Layer: Returns authenticity status, masked facility name, certified contractor name, issue/expiration dates, and seal without leaking customer phone numbers, personal emails, or private signatures.
     * Responsive public verification portal (`/verify/:certificateNumber` and `/verify`) with certificate lookup search bar, status badges, and direct PDF download button.
  6. **Automated Verification:** 6 backend integration tests in `phase5_trust_chain.test.ts` + 9 frontend tests in `phase5_frontend.test.tsx`. 106 tests passing across 23 test suites in the monorepo.
* **Definition of Done:** 100% test pass rate across backend trust chain and frontend signature/verification components, clean TypeScript compilation, and zero customer PII leakage.

---

## 7. Milestone 6 — Phase 6: Service Requests & Provider Discovery (NEXT MILESTONE)

* **Objective:** Implement ad-hoc service booking, customer provider discovery, request broadcasting, and acceptance workflows.
* **Dependencies:** Phase 3 UI shell, Phase 2 backend services, and Phase 5 trust chain.
* **Status:** `READY FOR IMPLEMENTATION`
* **Estimated Effort:** 2 Weeks.
* **Required Tasks:**
  1. Build Provider Discovery API and UI:
     * Search providers by equipment category (Extinguishers, Hydrants, Alarms) and proximity radius.
     * Display provider verification badge, license number, and customer star rating.
  2. Implement Service Request lifecycle (`SUBMITTED` → `ACCEPTED` / `REJECTED` → `SCHEDULED`):
     * Customer submits ad-hoc repair or refill request specifying equipment and preferred time slot.
     * Provider receives real-time/dashboard alert to accept or reject.
     * Accepting request automatically creates an ad-hoc `VisitSchedule`.
* **Acceptance Criteria:**
  * Customer can discover verified local providers within their operational radius.
  * Accepted requests transition smoothly into the technician dispatch board.
* **Required Tests:**
  * Integration tests for service request state transitions and rejection flows.
* **Definition of Done:** End-to-end customer booking flow operational.

---

## 8. Milestone 7 — Phase 7: SLA Monitoring, Overdue Automation & Notifications

* **Objective:** Implement ad-hoc service booking, customer provider discovery, request broadcasting, and acceptance workflows.
* **Dependencies:** Phase 3 UI shell and Phase 2 backend services.
* **Estimated Effort:** 2 Weeks.
* **Required Tasks:**
  1. Build Provider Discovery API and UI:
     * Search providers by equipment category (Extinguishers, Hydrants, Alarms) and proximity radius.
     * Display provider verification badge, license number, and customer star rating.
  2. Implement Service Request lifecycle (`SUBMITTED` → `ACCEPTED` / `REJECTED` → `SCHEDULED`):
     * Customer submits ad-hoc repair or refill request specifying equipment and preferred time slot.
     * Provider receives real-time/dashboard alert to accept or reject.
     * Accepting request automatically creates an ad-hoc `VisitSchedule`.
* **Acceptance Criteria:**
  * Customer can discover verified local providers within their operational radius.
  * Accepted requests transition smoothly into the technician dispatch board.
* **Required Tests:**
  * Integration tests for service request state transitions and rejection flows.
* **Definition of Done:** End-to-end customer booking flow operational.

---

## 9. Milestone 8 — Phase 8: Operational Dashboards, Compliance Health & Alerts

* **Objective:** Build role-specific executive dashboards, compliance metrics, and automated overdue inspection alerts.
* **Dependencies:** Phases 3 through 7.
* **Estimated Effort:** 1.5 Weeks.
* **Required Tasks:**
  1. Build Role Dashboards:
     * Customer Dashboard: Compliance health gauge (% on-time inspections), active contracts, upcoming visits.
     * Manager Dashboard: Technician dispatch grid, overdue visits, active AMCs, team completion rate.
     * Technician Dashboard: Today's agenda, geofence check-in shortcuts, offline sync status badge.
     * Admin Dashboard: Provider verification queue, system audit event log stream.
  2. Build Automated SLA & Overdue Monitor:
     * Background routine identifying visits past their `dueDate` (target date + grace period).
     * Automatically transitions visit status to `OVERDUE`.
     * Logs urgent alert in `NotificationLog` (FR-056).
* **Acceptance Criteria:**
  * Compliance score updates in real-time as visits are completed.
  * Overdue visits are highlighted with high-contrast red alerts.
* **Required Tests:**
  * Unit tests for SLA compliance calculation algorithm.
  * Notification logging tests.
* **Definition of Done:** Dashboards fully operational with verified compliance calculation.

---

## 10. Milestone 9 — Phase 9: PostgreSQL Docker Containerization & Database Migrations

* **Objective:** Stand up reproducible PostgreSQL containerization, apply declarative Prisma migrations, and execute live end-to-end database integration tests.
* **Dependencies:** Phase 2 Prisma schema.
* **Estimated Effort:** 1 Week.
* **Required Tasks:**
  1. Create `docker-compose.yml` in repository root for PostgreSQL 16 Alpine and pgAdmin:
     ```yaml
     version: '3.8'
     services:
       postgres:
         image: postgres:16-alpine
         container_name: servora-postgres
         environment:
           POSTGRES_USER: servora_user
           POSTGRES_PASSWORD: servora_password
           POSTGRES_DB: servora_db
         ports:
           - "5432:5432"
         volumes:
           - pgdata:/var/lib/postgresql/data
     volumes:
       pgdata:
     ```
  2. Execute baseline migration: `npx prisma migrate dev --name init_servora_baseline`.
  3. Run live database integration suite (`tests/integration/postgres_e2e.test.ts`) against live PostgreSQL.
* **Acceptance Criteria:**
  * Database starts with single command (`docker compose up -d`).
  * Prisma migrations generate clean relational tables with foreign keys and cascade rules.
  * All database-dependent integration tests pass without mock overrides.
* **Definition of Done:** Fully reproducible local and test database environment.

---

## 11. Milestone 10 — Phase 10: CI/CD, Deployment & Final Academic Viva Defense Package

* **Objective:** Configure automated continuous integration, deploy production staging environments, and compile final engineering reports for academic evaluation.
* **Dependencies:** Milestones 1 through 9.
* **Estimated Effort:** 1.5 Weeks.
* **Required Tasks:**
  1. Configure GitHub Actions CI workflow (`.github/workflows/ci.yml`):
     * Linting (`npm run lint`).
     * Type-checking (`npm run typecheck`).
     * Unit & integration tests (`npm test`).
     * Production build (`npm run build`).
  2. Deployment:
     * Backend API deployed to container hosting (e.g. Render, Railway, or AWS ECS).
     * Frontend PWA deployed to static edge CDN (e.g. Vercel, Netlify, or Cloudflare Pages).
  3. Comprehensive Viva Defense Documentation:
     * Architecture presentation slides.
     * Live demo script covering offline inspection, sync, and QR verification.
     * System metrics report.
* **Acceptance Criteria:**
  * CI pipeline passes on every pull request.
  * Production app accessible via public HTTPS URL with valid PWA manifest and offline caching.
* **Definition of Done:** Fully deployed and demonstrable trusted field-service platform.
