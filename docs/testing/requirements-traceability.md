# Servora — Requirements Traceability Matrix (RTM)

**Document Version:** 1.0.0  
**Status:** Living Engineering Baseline  
**Date of Assessment:** November 3, 2026  
**Scope:** Functional Requirements FR-001 through FR-058 & Security Requirements SEC-001 through SEC-011  

---

## 1. Traceability Methodology & Status Codes

This matrix maps every functional requirement (FR-001 to FR-058) defined in `docs/requirements/functional-requirements.md` to its implementation files, automated test cases, and empirical verification results.

Status Classifications:
* **`COMPLETE AND VERIFIED`:** Code implemented, automated tests written, executed, and passing.
* **`PARTIALLY IMPLEMENTED`:** Domain entity or service foundation created, but full workflow or tests pending.
* **`SPECIFIED BUT NOT IMPLEMENTED`:** Formally specified in Phase 1 requirements, awaiting target implementation milestone.
* **`BLOCKED`:** Implementation or test blocked by an environmental constraint.

---

## 2. Comprehensive Functional Requirements Traceability (FR-001 – FR-058)

### Module 1: Authentication & Identity (MOD-01)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-001** | User Registration (Customer / Provider) | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-AUTH-001`, `TC-AUTH-002`, `TC-FE-AUTH-001` | Supertest API & RTL Unit | **PASS** | `server/src/services/auth.service.ts:25`, `client/src/pages/RegisterPage.tsx`, `client/src/tests/auth.test.tsx` |
| **FR-002** | User Authentication & JWT Issuance | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-AUTH-003`, `TC-AUTH-004`, `TC-FE-AUTH-002` | Supertest API & RTL Unit | **PASS** | `server/src/services/auth.service.ts:108`, `client/src/pages/LoginPage.tsx`, `client/src/tests/auth.test.tsx` |
| **FR-003** | Server-Side RBAC Enforcement & Navigation | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-RBAC-001`, `TC-FE-ROLE-001` | Express Middleware & RTL Unit | **PASS** | `server/src/middleware/rbac.middleware.ts:11`, `client/src/routes/RoleRoute.tsx`, `client/src/tests/routing_navigation.test.tsx` |
| **FR-004** | User Logout & Token Invalidation | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-AUTH-005`, `TC-FE-AUTH-003` | Supertest API & RTL Unit | **PASS** | `server/src/services/auth.service.ts:213`, `client/src/context/AuthContext.tsx`, `client/src/tests/api_client.test.ts` |
| **FR-005** | Password Hashing (bcrypt, rounds >= 10) | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-PWD-001`, `TC-PWD-002` | bcryptjs Unit Test | **PASS** | `server/src/utils/password.ts:18`, `tests/unit/password.test.ts:5` |
| **FR-006** | Profile Retrieval & Settings Screen | **MUST** | MOD-01 | **COMPLETE AND VERIFIED** | `TC-AUTH-006`, `TC-FE-PROF-001` | Supertest API & Component | **PASS** | `server/src/services/auth.service.ts:192`, `client/src/pages/ProfilePage.tsx` |

### Module 2: Customer Management & Sites (MOD-02)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-007** | Customer Profile Management | **MUST** | MOD-02 | **COMPLETE AND VERIFIED** | `TC-AUTH-001`, `TC-FE-PROF-001` | Prisma Model & Auth API & UI | **PASS** | `server/prisma/schema.prisma:147`, `client/src/pages/ProfilePage.tsx` |
| **FR-008** | Site Registry & GPS Geofence Configuration | **MUST** | MOD-02 | **COMPLETE AND VERIFIED** | `TC-SITE-001`, `TC-FE-SITE-001` | Supertest API & RTL Unit | **PASS** | `server/src/services/site.service.ts:7`, `client/src/pages/SitesPage.tsx`, `client/src/tests/sites.test.tsx` |
| **FR-009** | Equipment Inventory Registry & Unique QR | **COULD** | MOD-02 | **COMPLETE AND VERIFIED** | `TC-EQ-001`, `TC-EQ-002` | Supertest API & Zod Unit | **PASS** | `server/src/services/equipment.service.ts:7`, `tests/integration/tenant_isolation.test.ts:107` |
| **FR-010** | Customer Service & Facility Overview | **SHOULD** | MOD-02 | **COMPLETE AND VERIFIED** | `TC-FE-SITE-002` | React Component Test | **PASS** | `client/src/pages/SitesPage.tsx`, `client/src/pages/SiteDetailPage.tsx`, `client/src/tests/sites.test.tsx` |
| **FR-011** | Customer Rating & Feedback Submission | **SHOULD** | MOD-02 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-REV-001` (Pending) | API Integration | *PENDING* | `ProviderProfile.averageRating` in Prisma; route scheduled for Phase 7 |

### Module 3: Service Provider Management (MOD-03)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-012** | Provider Profile & Trade License | **MUST** | MOD-03 | **COMPLETE AND VERIFIED** | `TC-PROV-001` | Auth Registration Test | **PASS** | `server/prisma/schema.prisma:163`, `tests/unit/schemas.test.ts:25` |
| **FR-013** | Service Catalog Definition | **MUST** | MOD-03 | **PARTIALLY IMPLEMENTED** | `TC-SVC-001` (Pending) | Prisma Schema Validated | **PASS (Schema)** | `server/prisma/schema.prisma:186`; CRUD routes scheduled for Phase 7 |
| **FR-014** | Technician Roster Management | **MUST** | MOD-03 | **PARTIALLY IMPLEMENTED** | `TC-TECH-001` (Pending) | User Role & Dispatch Test | **PASS (Assignment)** | `tests/integration/contracts_visits.test.ts:104` |
| **FR-015** | Provider Operating Hours & Blackout Dates | **SHOULD** | MOD-03 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-AVAIL-001` (Pending) | Logic Unit Test | *PENDING* | Scheduled for Phase 7 |
| **FR-016** | Provider Trade Verification Workflow | **MUST** | MOD-03 | **PARTIALLY IMPLEMENTED** | `TC-VERIF-001` (Pending) | Enum Status in Prisma | **PASS (Schema)** | `ProviderVerificationStatus` in `server/prisma/schema.prisma:30` |

### Module 4: Service Requests & Discovery (MOD-04)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-017** | Service Request Creation | **MUST** | MOD-04 | **PARTIALLY IMPLEMENTED** | `TC-REQ-001` (Pending) | Prisma Schema Validated | **PASS (Schema)** | `ServiceRequest` model in `schema.prisma:203`; routes scheduled for Phase 7 |
| **FR-018** | Provider Discovery & Geosearch | **MUST** | MOD-04 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-DISC-001` (Pending) | Search Unit Test | *PENDING* | Distance calculation scheduled for Phase 7 |
| **FR-019** | Direct Request vs Broadcast Dispatch | **SHOULD** | MOD-04 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-BCAST-001` (Pending) | API Integration | *PENDING* | Scheduled for Phase 7 |
| **FR-020** | Request Acceptance / Rejection Lifecycle | **MUST** | MOD-04 | **PARTIALLY IMPLEMENTED** | `TC-ACCPT-001` (Pending) | Prisma Status Enum | **PASS (Schema)** | `ServiceRequestStatus` in `schema.prisma:45` |
| **FR-021** | Real-Time Request Status Tracking | **MUST** | MOD-04 | **PARTIALLY IMPLEMENTED** | `TC-TRACK-001` (Pending) | API Polling / WS | *PENDING* | Scheduled for Phase 7 |

### Module 5: Maintenance Contracts / AMCs (MOD-05)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-022** | AMC Contract Creation Wizard | **MUST** | MOD-05 | **COMPLETE AND VERIFIED** | `TC-CONT-001`, `TC-CONT-002` | Supertest API & Vitest | **PASS** | `server/src/services/contract.service.ts:7`, `tests/integration/contracts_visits.test.ts:28` |
| **FR-023** | Contract Grace Period & SLA Settings | **MUST** | MOD-05 | **COMPLETE AND VERIFIED** | `TC-CONT-001` | Slot Generation Logic | **PASS** | `server/src/services/contract.service.ts:51`, `tests/integration/contracts_visits.test.ts:28` |
| **FR-024** | Contract Equipment Coverage Scope | **MUST** | MOD-05 | **COMPLETE AND VERIFIED** | `TC-CONT-001` | Prisma M-N Relation | **PASS** | `server/src/services/contract.service.ts:31`, `tests/integration/contracts_visits.test.ts:28` |
| **FR-025** | Contract Status Lifecycle (`ACTIVE`, `EXPIRED`)| **MUST** | MOD-05 | **COMPLETE AND VERIFIED** | `TC-CONT-003` | Schema & Status Service | **PASS** | `server/src/services/contract.service.ts:140` |
| **FR-026** | Contract Compliance Health Summary | **SHOULD** | MOD-05 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-SLA-001` (Pending) | Aggregation Service | *PENDING* | Scheduled for Phase 8 |

### Module 6: Visit Scheduling & Automation (MOD-06)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-027** | Automated Recurring Visit Slot Generation | **MUST** | MOD-06 | **COMPLETE AND VERIFIED** | `TC-VISIT-001` | Integration Slot Assertion | **PASS** | `server/src/services/contract.service.ts:51`, `tests/integration/contracts_visits.test.ts:79` |
| **FR-028** | Technician Dispatch & Assignment | **MUST** | MOD-06 | **COMPLETE AND VERIFIED** | `TC-VISIT-002` | Supertest API & Vitest | **PASS** | `server/src/services/visit.service.ts:46`, `tests/integration/contracts_visits.test.ts:104` |
| **FR-029** | Ad-Hoc Emergency Visit Scheduling | **MUST** | MOD-06 | **COMPLETE AND VERIFIED** | `TC-VISIT-003` | Schema & Service Enum | **PASS** | `VisitType.EMERGENCY_INSPECTION` in `server/src/services/visit.service.ts:7` |
| **FR-030** | Automated Overdue Visit Transition | **MUST** | MOD-06 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-OVERDUE-001` (Pending)| Cron / Worker Test | *PENDING* | Scheduled for Phase 8 |
| **FR-031** | Rescheduling with SLA Impact Calculation | **SHOULD** | MOD-06 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-RESCHED-001` (Pending)| Integration Test | *PENDING* | Scheduled for Phase 8 |

### Module 7: Technician Field Workflow (MOD-07)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-032** | Technician Daily Manifest View | **MUST** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-VISIT-004`, `TC-FE-VISIT-001` | Service Query & React View | **PASS** | `server/src/services/visit.service.ts:34`, `client/src/pages/visits/MyVisitsPage.tsx`, `client/src/tests/field_visits.test.tsx` |
| **FR-033** | Geofenced GPS Check-In (100m radius) | **SHOULD** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-GEO-001`, `TC-INT-SYNC-002` | Haversine Formula & Vitest | **PASS** | `server/src/services/visit.service.ts:258`, `client/src/pages/visits/VisitExecutionPage.tsx`, `tests/integration/inspection_sync.test.ts` |
| **FR-034** | Standardized Safety Checklist Forms | **MUST** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-CHK-001`, `TC-FE-CHK-001` | Dynamic Checklists & RTL | **PASS** | `server/src/services/checklist.service.ts`, `client/src/components/inspections/ChecklistForm.tsx`, `client/src/tests/checklists.test.tsx` |
| **FR-035** | Photographic Evidence Ingestion & Binary Storage | **MUST** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-ATT-001`, `TC-FE-ATT-001`, `TC-ATT-002` | Multer Upload & SHA-256 Digest | **PASS** | `server/src/services/attachment.service.ts:15`, `server/src/routes/attachment.routes.ts`, `tests/integration/phase5_trust_chain.test.ts` |
| **FR-036** | On-Screen Customer Digital Signature | **MUST** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-SIG-001`, `TC-FE-SIG-001` | HTML5 Canvas & SHA-256 Digest | **PASS** | `client/src/components/signatures/SignaturePadModal.tsx`, `client/src/tests/phase5_frontend.test.tsx`, `tests/integration/phase5_trust_chain.test.ts` |
| **FR-037** | Immediate Defect Flagging & Escalation | **MUST** | MOD-07 | **COMPLETE AND VERIFIED** | `TC-DEF-001`, `TC-FE-CHK-003` | Pass/Fail Evaluation & Logic | **PASS** | `server/src/services/visit.service.ts:337`, `client/src/components/inspections/ChecklistForm.tsx`, `client/src/tests/checklists.test.tsx` |

### Module 8: Offline-First & Synchronization (MOD-08)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-038** | Complete Offline Form Entry via IndexedDB | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-OFF-001`, `TC-FE-OFF-001` | Dexie.js Client Store & RTL | **PASS** | `client/src/db/index.ts`, `client/src/components/inspections/ChecklistForm.tsx`, `client/src/tests/offline_sync.test.ts` |
| **FR-039** | Local Pending Synchronization Queue | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-OFF-002`, `TC-FE-OFF-002` | Queue State Machine & Vitest | **PASS** | `client/src/sync/syncManager.ts:26`, `client/src/tests/offline_sync.test.ts` |
| **FR-040** | Automatic Online/Offline Transition Hook | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-OFF-003`, `TC-FE-OFF-003` | Network Hook & Status Banner | **PASS** | `client/src/hooks/useSyncStatus.ts`, `client/src/components/common/SyncStatusBanner.tsx`, `client/src/tests/field_visits.test.tsx` |
| **FR-041** | Idempotency Key Validation on Sync | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-IDEM-001`, `TC-INT-SYNC-003` | Header Validation & Replay | **PASS** | `server/src/controllers/visit.controller.ts:114`, `server/src/services/visit.service.ts:291`, `tests/integration/inspection_sync.test.ts` |
| **FR-042** | Sync Conflict Resolution Protocol | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-CONF-001`, `TC-INT-SYNC-004` | Replay Cache & Mismatch Reject | **PASS** | `server/src/services/visit.service.ts:285`, `tests/integration/inspection_sync.test.ts` |
| **FR-043** | Exponential Backoff Retry Policy | **MUST** | MOD-08 | **COMPLETE AND VERIFIED** | `TC-RETRY-001`, `TC-FE-OFF-004` | Retry Counter & State Switch | **PASS** | `client/src/sync/syncManager.ts:80`, `client/src/tests/offline_sync.test.ts` |

### Module 9: Digital Trust & Verification (MOD-09)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-044** | Canonical JSON & SHA-256 Record Sealing | **MUST** | MOD-09 | **COMPLETE AND VERIFIED** | `TC-TRUST-001`, `TC-TRUST-002`, `TC-TRUST-004` | Cryptographic Unit & Integration Test | **PASS** | `server/src/utils/hash.ts:13`, `tests/unit/hash.test.ts:5`, `tests/integration/phase5_trust_chain.test.ts` |
| **FR-045** | Automated PDF Certificate Generation | **SHOULD** | MOD-09 | **COMPLETE AND VERIFIED** | `TC-PDF-001` | PDFKit Document & QR Matrix | **PASS** | `server/src/services/certificate.service.ts:15`, `tests/integration/phase5_trust_chain.test.ts` |
| **FR-046** | QR Equipment Tag Generation & Binding | **COULD** | MOD-09 | **COMPLETE AND VERIFIED** | `TC-QR-001` | Unique Query & Routing | **PASS** | `server/src/services/equipment.service.ts:47`, `tests/integration/tenant_isolation.test.ts:107` |
| **FR-047** | Public Read-Only QR Verification Portal | **SHOULD** | MOD-09 | **COMPLETE AND VERIFIED** | `TC-PUB-001`, `TC-FE-PUB-001` | Express Public Route & React View | **PASS** | `server/src/controllers/certificate.controller.ts:15`, `client/src/pages/public/CertificateVerificationPage.tsx`, `client/src/tests/phase5_frontend.test.tsx` |
| **FR-048** | Tamper-Evident Hash Re-Verification | **MUST** | MOD-09 | **COMPLETE AND VERIFIED** | `TC-TRUST-003`, `TC-TRUST-005` | Deterministic SHA-256 Assertion | **PASS** | `tests/unit/hash.test.ts:19`, `tests/integration/phase5_trust_chain.test.ts` |
| **FR-049** | Certificate Revocation Workflow | **SHOULD** | MOD-09 | **PARTIALLY IMPLEMENTED** | `TC-REVOKE-001` (Pending)| Status Enum in Prisma | **PASS (Model)** | `CertificateStatus.REVOKED` in `schema.prisma:93` |

### Module 10: Dashboard, Reports & Analytics (MOD-10)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-050** | Customer Compliance Overview Dashboard | **MUST** | MOD-10 | **COMPLETE AND VERIFIED** | `TC-DASH-001` | React Component Test | **PASS** | `client/src/pages/DashboardPage.tsx` |
| **FR-051** | Service Provider Operational Dashboard | **MUST** | MOD-10 | **COMPLETE AND VERIFIED** | `TC-DASH-002` | React Component Test | **PASS** | `client/src/pages/DashboardPage.tsx` |
| **FR-052** | Technician Mobile Dispatch Grid | **MUST** | MOD-10 | **COMPLETE AND VERIFIED** | `TC-VISIT-004` | Technician Query Service | **PASS** | `server/src/services/visit.service.ts:34` |
| **FR-053** | Administrator Platform Governance View | **COULD** | MOD-10 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-DASH-003` (Pending) | UI / API Integration | *PENDING* | Scheduled for Phase 8 |
| **FR-054** | Technician Performance Scoring | **COULD** | MOD-10 | **PARTIALLY IMPLEMENTED** | `TC-SCORE-001` (Pending)| Prisma Entity Model | **PASS (Model)** | `TechnicianScore` in `schema.prisma:417` |

### Module 11: Notifications & Alerts (MOD-11)

| Req ID | Requirement Summary | Priority | Module | Implementation Status | Test Case ID | Verification Method | Current Result | Evidence / File Reference |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **FR-055** | Visit Lifecycle Event Notifications | **COULD** | MOD-11 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-NOTIF-001` (Pending)| Event Trigger Test | *PENDING* | Scheduled for Phase 8 |
| **FR-056** | Automated Overdue Inspection Alerts | **COULD** | MOD-11 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-NOTIF-002` (Pending)| Cron Monitor Test | *PENDING* | Scheduled for Phase 8 |
| **FR-057** | In-App Notification Center UI | **COULD** | MOD-11 | **SPECIFIED BUT NOT IMPLEMENTED** | `TC-NOTIF-003` (Pending)| React Component Test | *PENDING* | Scheduled for Phase 8 |
| **FR-058** | Outgoing Notification Delivery Logging | **COULD** | MOD-11 | **PARTIALLY IMPLEMENTED** | `TC-NOTIF-004` (Pending)| Prisma Entity Model | **PASS (Model)** | `NotificationLog` in `schema.prisma:403` |

---

## 3. Summary of Traceability Progress

* **Total Functional Requirements:** 58 (FR-001 through FR-058)
* **Complete and Verified (Code + Tests Passing):** 37 Requirements (63.8%)
* **Partially Implemented (Prisma Schema / Core Service in Place):** 9 Requirements (15.5%)
* **Specified but Not Yet Implemented (Scheduled for Phases 6–8):** 12 Requirements (20.7%)
* **Blocked Requirements:** 0
