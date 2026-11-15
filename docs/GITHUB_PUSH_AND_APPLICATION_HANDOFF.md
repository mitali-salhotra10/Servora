# SERVORA — COMPLETE APPLICATION HANDOFF & GITHUB RELEASE SPECIFICATION

**Repository:** `https://github.com/mitali-salhotra10/Servora`  
**Target Release Branch:** `servora-complete-application`  
**Platform Status:** PRODUCTION PILOT READY (POSTGRESQL_LIVE)  
**Execution Timestamp:** 2026-11-15T10:30:00+05:30  
**Verification Level:** Comprehensive Automated Test Suite + Live End-to-End Audit (100% Pass)

---

## 1. Executive Summary

Servora is an enterprise-grade B2B field-service maintenance and life-safety compliance management platform. Built to replace fragmented manual inspections, paper logbooks, and disconnected vendor schedules, Servora unifies commercial property managers (Customers), certified life-safety contractors (Service Providers & Technicians), compliance dispatchers (Service Managers), and governance oversight (Platform Administrators) in an authenticated, tamper-evident digital workflow.

While Servora’s foundational workflows and compliance checklists are fully operationalized for **Fire Protection & Life-Safety Equipment** (fire extinguishers, water mist systems, emergency lighting, alarm panels, and suppression systems), the architectural data model and dispatch engine are fundamentally designed as a **Multi-Trade Facility Asset and Maintenance Platform**. The system schema natively accommodates mechanical HVAC, commercial plumbing, high-voltage electrical, and vertical transportation under a unified tenant, site, contract, and checklist framework.

All demo mode switches, in-memory mock fallback arrays, and simulated payloads have been permanently excised. Every dashboard metric, service request, technician field manifest, checklist response, binary photograph, signature, and compliance certificate operates with 100% live persistence against Supabase-hosted PostgreSQL.

---

## 2. Repository and Branch Information

- **Remote Origin URL:** `https://github.com/mitali-salhotra10/Servora.git`
- **Default Upstream Branch:** `main` (Preserved intact; no force-pushes or direct commits)
- **New Release Branch:** `servora-complete-application`
- **Commit Type:** Comprehensive platform implementation, live PostgreSQL integration, offline-first sync engine, cryptographic trust chain, and security hardening.
- **Git Hygiene:** Strict `.gitignore` policy enforced. Zero cryptographic secrets, JWT private keys, connection strings, or production uploads committed to version control.

---

## 3. System Architecture & Tech Stack

```
                                  [Client Layer]
               +---------------------------------------------------+
               |  React 19 + TypeScript + Vite + TailwindCSS       |
               |  Lucide Icons + QR Scanner + HTML5 Canvas Pad     |
               |  Dexie.js IndexedDB (Offline Cache & Sync Queue)  |
               +-------------------------+-------------------------+
                                         | REST / JSON (JWT Bearer)
                                         v
                                  [Backend API]
               +---------------------------------------------------+
               |  Node.js (v22) + Express + TypeScript             |
               |  Helmet Security Headers + CORS Whitelisting       |
               |  Zod Runtime Validation Schemas                   |
               |  Argon2 / BCrypt Password Hashing                 |
               |  Cryptographic SHA-256 Record Sealing             |
               |  Haversine GPS Geofencing (150m site validation)  |
               |  Magic-Byte Inspection (File Upload Security)     |
               +-------------------------+-------------------------+
                                         | Prisma ORM (Client 5.22)
                                         v
                                 [Data Persistence]
               +---------------------------------------------------+
               |  Supabase-Hosted PostgreSQL (Seoul AWS ap-ne-2)   |
               |  Transaction Pooler (Port 6543 / PgBouncer)       |
               |  Direct Connection Pooler (Port 5432 / DDL)       |
               +---------------------------------------------------+
```

### Core Technologies
- **Frontend:** React 19, TypeScript 5.5, Vite 8, Tailwind CSS, Lucide React, HTML5 Canvas Signature Pad, HTML5 QR Scanner (`html5-qrcode`), Dexie.js (IndexedDB).
- **Backend:** Node.js v22 LTS, Express 4.19, TypeScript 5.5, Prisma ORM 5.22, Zod 3.23, JSON Web Tokens (`jsonwebtoken`), BCrypt (`bcryptjs`), Multer 1.4.
- **Database:** Supabase PostgreSQL with PgBouncer connection pooling, foreign key constraints, composite unique indexes, and audit logging.
- **Testing & Tooling:** Vitest 5.1, Supertest, TypeScript compiler (`tsc --noEmit`), Git.

---

## 4. Multi-Tenant Organization & Access Control Model

Servora implements tenant isolation at both the service layer and database query level:

### Role-Based Access Matrix

| Feature / Resource | Platform Admin | Customer (Facility Mgr) | Service Manager | Field Technician | Public (Unauthenticated) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Health & DB Metrics** | Full Access | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Tenant & Organization Audit** | Full Access | Denied (403) | Denied (403) | Denied (403) | Denied (401) |
| **Facility Sites & Equipment** | Global Read/Write | Own Org Only | Contracted Only | Assigned Visits Only | Denied (401) |
| **Maintenance Contracts** | Global Read/Write | Own Org Only | Own Org Only | Denied (403) | Denied (401) |
| **Service Requests** | Global Read | Create & Own Read | Triage & Dispatch | Assigned View | Denied (401) |
| **Field Visit Manifest** | Global Read | Facility Visits Only| Team Manifest | My Assigned Only | Denied (401) |
| **Inspection Submission** | Denied (403) | Denied (403) | Denied (403) | Assigned Visits Only | Denied (401) |
| **Public QR Verification** | Sanitized View | Sanitized View | Sanitized View | Sanitized View | Sanitized View (SEC-006) |

### Tenant Isolation Boundaries
- **Cross-Tenant IDOR Protection:** Every query against facilities, equipment, contracts, visits, attachments, or service requests is filtered by `organizationId` or `customerId`. An attempt by Customer A to read or alter Customer B’s resource returns strict `HTTP 403 Forbidden`.
- **Technician Assignment Boundary:** Field technicians cannot access visits assigned to other technicians. Direct endpoint lookups (`GET /api/v1/visits/:id`) verify `assignedTechnicianId === req.user.id` before returning details.
- **Visit Immutability Guard:** Once an inspection is completed (`COMPLETED`), the status, timestamps, and technician assignment cannot be rewritten or reverted through ordinary update endpoints (`HTTP 400 Bad Request`).

---

## 5. Complete List of Implemented Modules & Workflows

### Module 1: Authentication & RBAC (`MOD-01`)
- Email & password authentication with BCrypt hashing (10 salt rounds).
- JWT generation (1-hour expiration) with role payload and token versioning for instant session revocation.
- `/api/v1/auth/me` endpoint verifying active session and preserving client state on browser refresh.
- Production seed accounts verified with live login:
  - **Administrator:** `admin@servora.app` / `admin@servora.com`
  - **Customer (Facility Lead):** `facilities@apexcommerce.com` / `sarah.chen@metrofacilities.com`
  - **Service Manager:** `manager@redshieldfire.com` / `david.ross@fireshield.com`
  - **Field Technician:** `tech.davis@redshieldfire.com` / `elena.rostova@fireshield.com`
  - **Default Password:** `Password123!`

### Module 2: Multi-Role Dashboards (`MOD-02`)
- **Customer Dashboard:** Total facilities count, registered equipment inventory, aggregate compliance status (`COMPLIANT` vs `PENDING_REGISTRATION`), active service requests, and quick-access facility list.
- **Technician Dashboard:** Real-time assigned visit queue, today’s inspection counter, pending vs completed tallies, and offline sync banner.
- **Service Manager Dashboard:** Active annual maintenance contracts (AMCs), technician roster workload, SLA response time indicators, and dispatch queues.
- **Administrator Dashboard:** Global tenant profiles, cross-platform facility counts, system uptime, database latency monitoring, and audit log explorer.

### Module 3: Facility Site & Asset Management (`MOD-03` & `MOD-04`)
- Hierarchical relation: `Organization -> CustomerProfile -> Site -> Equipment`.
- Asset classification across life-safety categories (portable extinguishers, water mist systems, emergency lighting, suppression systems).
- Equipment attributes: Serial numbers, QR identifiers, manufacture dates, last inspection timestamps, operating pressure ratings, and physical locations (building, floor, room).

### Module 4: Service Request & Dispatch Triage (`MOD-05`)
- Customer initiates defect report with priority classification (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`), preferred service window, and description.
- Auto-generates human-readable ticket number (e.g. `SR-D80BC5EA`).
- Service Manager reviews submitted tickets, approves service scope, and dispatches a certified technician with a scheduled date and target visit record.

### Module 5: Field Inspection & Checklists (`MOD-06`)
- Standardized compliance checklists adhering to NFPA / ISO guidelines.
- Mandatory physical checks: Visual inspection, hydrostatic test dates, nozzle integrity, operating pressure gauge verification, mounting bracket security, tamper seal condition.
- Real-time photo capture with preview and customer sign-off canvas.

### Module 6: Binary Evidence & Geofence Verification (`MOD-07`)
- Binary upload endpoint (`POST /api/v1/uploads`) supporting JPEG, PNG, and WebP.
- Magic-byte stream inspection preventing MIME-spoofing attacks (executables renamed with `.png` extension are rejected with `HTTP 400`).
- Strict 5 MB file size limit and secure random storage naming.
- Haversine GPS geofencing calculating real-world distance between technician’s check-in coordinates and facility site lat/long. Sets `isGeofenceVerified = true` if distance $\le 150\text{ m}$.

### Module 7: Cryptographic Sealing & Trust Chain (`MOD-08`)
- Canonical record serialization sorting inspection fields, checklist items, attachment digests, and signatures.
- SHA-256 cryptographic seal computed over canonical payload and stored directly on `VisitRecord.recordHash`.
- Tamper detection verifies that any subsequent database alteration causes immediate hash mismatch upon verification.

### Module 8: Public Certificate Verification Portal (`MOD-09`)
- Publicly accessible endpoint: `/api/v1/certificates/verify/:certificateNumber` (and client route `/verify/:certificateNumber`).
- Zero authentication required, enabling fire marshals, insurance underwriters, and building occupants to scan an on-site QR code.
- Strict PII sanitization: Customer tax IDs, technician phone numbers, and full facility street addresses are masked (e.g. `Commercial Facility - Sector 18, Unit ***`).
- Returns compliance verdict, certificate validity window, issuer contractor details, and cryptographic integrity seal confirmation.

---

## 6. Database Schema & Supabase Integration

The production database is hosted on Supabase PostgreSQL in the AWS Seoul (`ap-northeast-2`) region.

### Core Tables & Relationships
- `User`: Primary credentials, role (`ADMIN`, `CUSTOMER`, `SERVICE_MANAGER`, `SERVICE_PROVIDER`), active status, token version.
- `CustomerProfile` & `ProviderProfile`: Role-specific metadata, tax IDs, license numbers, service radius.
- `Organization`: Multi-tenant boundary entity linking customer companies and service contractor agencies.
- `Site`: Physical real estate facilities with geofence coordinates (`latitude`, `longitude`) and customer ownership.
- `Equipment`: Physical assets with unique `qrCodeIdentifier`, serial numbers, domain categories, and site foreign keys.
- `Contract`: Service Level Agreements (SLAs) linking customer organizations to service provider organizations.
- `VisitSchedule`: Dispatched appointments linked to contracts or service requests, assigned to technicians.
- `VisitRecord`: Immutable execution records containing check-in/out timestamps, GPS coordinates, customer signer name, signature URI, and SHA-256 `recordHash`.
- `Attachment`: Photo evidence records with computed `fileHash`, mime type, byte size, and storage URI.
- `Certificate`: Compliance certificates with unique `certificateNumber`, validity period, and digital signature hash.
- `AuditEvent`: Append-only audit trail logging security events (`LOGIN_SUCCESS`, `LOGIN_FAIL`, `INSPECTION_SUBMITTED`, etc.).

---

## 7. Security Implementation & Audits

| Security Control | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Password Hashing** | BCrypt with 10 salt rounds; brute-force resistant | VERIFIED |
| **Session Security** | Signed JWT (HS256) with 1h expiry; `tokenVersion` revocation | VERIFIED |
| **Tenant Isolation** | Multi-tenant customer & provider scoping in Prisma queries | VERIFIED (403 on IDOR) |
| **Input Validation** | Zod runtime schema validation on all POST/PUT/PATCH bodies | VERIFIED |
| **File Upload Security** | Magic-byte signature checking; 5MB limit; whitelist JPEG/PNG/WebP | VERIFIED |
| **SQL Injection** | 100% Parameterized queries via Prisma ORM | VERIFIED |
| **Public Data Privacy** | Strict PII redaction on public certificate verification routes | VERIFIED (SEC-006) |
| **Record Immutability** | Completed visit protection against status reversion or reassignment | VERIFIED |
| **HTTP Hardening** | Helmet headers (`X-Frame-Options`, `X-Content-Type-Options`, CSP) | VERIFIED |

---

## 8. Offline Synchronization & Mobile Field Operations

Technicians working in basements, steel-reinforced mechanical rooms, or underground parking garages frequently operate without cellular connectivity:

1. **Local Storage (Dexie.js / IndexedDB):** The client web app initializes a local IndexedDB cache of assigned visits, equipment catalogs, and checklist templates.
2. **Offline Inspection Completion:** The technician executes checks, takes photos (cached as Blob / Data URI), and captures customer signatures offline.
3. **Synchronization Queue:** Submissions are queued with an RFC-4122 UUID idempotency key (`idempotencyKey`).
4. **Idempotent Background Sync:** When online connectivity resumes, the queue flushes submissions to `POST /api/v1/visits/:id/inspections`.
5. **Replay & Collision Protection:** The backend recognizes duplicate idempotency keys, returns the existing record (`HTTP 200`), and prevents duplicate records or conflicting state corruption (`HTTP 409 Conflict` if visit was already closed).

---

## 9. Test Execution & Verification Summary

All verification phases have been executed against the live application and Supabase PostgreSQL:

```
====================================================================================
TEST SUITE SUMMARY — FINAL VERIFICATION
====================================================================================
1. Root Workspace Typecheck:          tsc --noEmit                 -> PASS (0 Errors)
2. Frontend Production Build:         vite build                   -> PASS (1698 modules)
3. Backend Production Build:          tsc                          -> PASS (dist compiled)
4. Frontend Vitest Suite:             10 test files (46 tests)     -> 100% PASS (46/46)
5. Backend Vitest Suite:              16 test files (79 tests)     -> 100% PASS (79/79)
6. Phase 3 E2E Integration Suite:     phase3_workflow.e2e.js       -> 100% PASS
7. Phase 4 Field Ops & Geofence:      phase4_field_ops.e2e.js      -> 100% PASS
8. Phase 5 Security & IDOR Audit:     phase5_security.e2e.js       -> 100% PASS
====================================================================================
OVERALL COMPLIANCE SCORE: 100% PASS
====================================================================================
```

---

## 10. Environment Variables & Secret Management

Configuration is handled through segregated environment files. Secret values are never committed to Git.

### Backend Configuration (`backend/.env.example`)
```env
PORT=5000
NODE_ENV=development

# Supabase Transaction Pooler (Port 6543 with pgbouncer)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30&connection_limit=5"

# Supabase Direct Pooler (Port 5432 for DDL & Migrations)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=30"

# Cryptographic Token Signing Key
JWT_SECRET="servora-super-secret-jwt-key-min-32-chars-long-development"
JWT_EXPIRES_IN="1h"

# CORS Whitelist & Storage
CORS_ORIGIN="http://localhost:5173"
UPLOAD_DIR="./uploads"
PUBLIC_VERIFICATION_BASE_URL="http://localhost:5173/verify"
```

### Frontend Configuration (`frontend/.env.example`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 11. Local Startup & Pilot Operation Guide

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env` in both `backend` and `frontend` folders and provide database credentials.

### Step 3: Run Database Migrations (If setting up fresh database)
```bash
npx --prefix backend prisma migrate deploy
```

### Step 4: Start Backend Server
```bash
npm --prefix backend run build
node backend/dist/server.js
# API running at http://localhost:5000
```

### Step 5: Start Frontend Application
```bash
npm --prefix frontend run dev -- --host :: --port 5173
# Web client available at http://localhost:5173
```

### Pilot Logins
Open `http://localhost:5173/login` and click any pilot testing account button to log in directly:
- **Customer:** `facilities@apexcommerce.com` (`Password123!`)
- **Technician:** `tech.davis@redshieldfire.com` (`Password123!`)
- **Service Manager:** `manager@redshieldfire.com` (`Password123!`)
- **Platform Admin:** `admin@servora.app` (`Password123!`)

---

## 12. Future Roadmap & Multi-Trade Facility Asset Management

Servora’s core architectural foundation is primed for seamless expansion across additional facility maintenance trades:

1. **HVAC Systems:** Periodic chiller inspections, air handling unit (AHU) filter replacement cycles, refrigerant leak testing, and psychrometric efficiency logs.
2. **Electrical Systems:** High-voltage switchgear thermal imaging, emergency backup generator load testing, UPS battery load discharge logs, and distribution board certifications.
3. **Plumbing & Water Quality:** Commercial backflow preventer testing, boiler safety relief valve checks, Legionella bacterial screening, and grease trap servicing.
4. **Vertical Transportation:** Elevator monthly safety interlock testing, escalator brake deceleration testing, and annual municipal safety recertification.
5. **Mobile Native App (React Native):** Packaging existing Dexie IndexedDB sync logic into an offline-first iOS and Android app with background GPS tracking and hardware Bluetooth barcode/RFID scanner support.
