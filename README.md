# Servora — Enterprise B2B Fire-Safety Maintenance & Compliance Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3%2B-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-v18.3-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.22-teal.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.11%20(Supabase)-336791.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

Servora is an enterprise-grade, multi-tenant digital operations and compliance management platform engineered for fire-safety service providers, commercial facility managers, and field technicians. It provides full lifecycle maintenance management—from scheduled SLA inspections and defect dispatching to offline-first field checklist execution, cryptographic SHA-256 proof sealing, and public regulatory verification.

---

## 1. System Architecture & Workspaces

The repository is organized as an enterprise monorepo powered by npm workspaces:

```
Servora/
├── backend/                  # Express.js + TypeScript RESTful API service
│   ├── prisma/               # Prisma ORM schema, migrations & seed scripts
│   ├── src/                  # Controllers, services, repositories, validators, middlewares
│   └── uploads/              # Isolated inspection evidence storage
├── frontend/                 # React 18 + Vite + Tailwind CSS Single-Page Application
│   ├── public/               # Web App Manifest & static icons
│   └── src/                  # Features, components, pages, Dexie IndexedDB client, sync engine
├── shared/                   # Shared TypeScript models, enums, constants & validation schemas
├── docs/                     # Comprehensive engineering, API, architecture, and pilot guides
│   ├── api/                  # RESTful API specifications
│   ├── architecture/         # System, DB, RBAC, offline sync, and integrity docs
│   ├── audit-reports/        # Implementation reports, test matrices, and remaining limitations
│   ├── backup-and-recovery/  # Supabase backup, PITR, and disaster recovery runbooks
│   ├── database/             # Data dictionary and relational ERD specifications
│   ├── pilot/                # Pilot readiness checklist and manual field testing guide
│   └── user-guides/          # Role-specific guides (Admin, Customer, Manager, Tech)
├── scripts/                  # Operational health and connectivity probes
│   └── verify-connection.js  # Zero-dependency Supabase & backend /ready probe
└── tests/                    # End-to-end integration test suites
    └── e2e/                  # Multi-role lifecycle, field ops, and security suites
```

---

## 2. Technology Stack

| Layer | Technologies |
|:---|:---|
| **Frontend Web App** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios |
| **Offline Persistence** | Dexie.js (IndexedDB wrapper), Service Worker / Web App Manifest |
| **Field Capture** | HTML5 Geolocation API, `@zxing/browser` camera QR reader, HTML5 Canvas signature pad |
| **Backend API** | Node.js, Express, TypeScript, Zod schema validation, Multer |
| **ORM & Database** | Prisma ORM 5.22.0, PostgreSQL 17.11 (Supabase AWS Seoul `ap-northeast-2`) |
| **Pooler Architecture** | Port 6543 (PgBouncer Transaction Pooler) & Port 5432 (Session Pooler) |
| **Security & Auth** | JSON Web Tokens (JWT), `bcryptjs` password hashing, multi-tenant middleware |
| **Integrity & Trust** | Node `crypto` SHA-256 canonical hashing, tamper-evident certificate issuance |

---

## 3. Core Role Matrix & Capabilities

The platform enforces strict role-based access control (RBAC) and multi-tenant isolation across four primary roles:

| Role | Target Persona | Core Capabilities |
|:---|:---|:---|
| **ADMIN** | Platform Operations | Global tenant oversight, organization onboarding, user administration, system logs |
| **CUSTOMER** | Facility / Building Manager | Facility & equipment registry, defect reporting, maintenance calendar, certificate audit |
| **SERVICE_MANAGER** | Service Provider Operations | Technician dispatching, SLA contract monitoring, visit allocation, team performance |
| **TECHNICIAN** | Field Service Engineer | Daily visit manifest, QR equipment resolution, offline checklist execution, photo evidence, signature capture |

---

## 4. Quickstart & Local Development

### 4.1 Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher
- Supabase PostgreSQL instance (or local PostgreSQL 16+)

### 4.2 Environment Configuration

Ensure `backend/.env` is configured with your database pooler credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-secure-refresh-token-secret"
CORS_ORIGIN="http://localhost:5173"
UPLOAD_DIR="./uploads"
```

Configure `frontend/.env`:
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

### 4.3 Installation & Start Commands

Run all commands from the monorepo root:

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Verify Supabase database connectivity
node scripts/verify-connection.js

# 3. Start Backend Express Server (port 5000)
npm run dev:backend

# 4. In a separate terminal, start Frontend Vite Server (port 5173)
npm run dev:frontend

# Alternatively, run both concurrently:
npm run dev
```

The frontend application will be accessible at: `http://localhost:5173`  
The backend API service will be accessible at: `http://localhost:5000`

---

## 5. Development Accounts (Seeded PostgreSQL Records)

The database includes deterministic test accounts for evaluating all four roles against live PostgreSQL:

- **Platform Administrator:** `admin@servora.app`
- **Customer Account (Apex Commerce):** `facilities@apexcommerce.com`
- **Customer Account (MetroHealth):** `compliance@metrohealth.org`
- **Service Manager (RedShield Fire):** `manager@redshieldfire.com`
- **Field Technician (RedShield Fire):** `tech.davis@redshieldfire.com`
- **Field Technician (RedShield Fire):** `tech.patel@redshieldfire.com`

*All development accounts utilize the standardized staging password configured during database seeding (`Password123!`).*

---

## 6. Build, Test & Quality Assurance

Servora includes an exhaustive, multi-tier testing pipeline. All suites execute with 100% pass rates:

```bash
# Typecheck all TypeScript code
npm run typecheck

# Run all automated unit and integration tests (125 tests)
npm test

# Run frontend tests only (46 tests)
npm run test:frontend

# Run backend tests only (79 tests)
npm run test:backend

# Run End-to-End lifecycle workflow verification
node tests/e2e/phase3_workflow.e2e.js

# Run Field Operations verification (QR, upload limits, MIME spoofing, GPS, sync)
node tests/e2e/phase4_field_ops.e2e.js

# Run Security & Penetration audit (IDOR, Auth, Tamper checks, Immutability)
node tests/e2e/phase5_security.e2e.js

# Produce production builds
npm run build
```

---

## 7. Key Architecture & Feature Highlights

### 7.1 Offline-First Sync Engine
Technicians in basements or shielded facility areas can complete checklists and capture evidence without an active network connection. Responses are buffered locally in Dexie IndexedDB. When internet connectivity is restored, the client drains the queue with idempotent HTTP requests (`Idempotency-Key` headers) to prevent duplicate submissions.

### 7.2 Cryptographic Evidence Sealing
Completed inspections generate a canonical SHA-256 seal covering the inspection ID, equipment ID, timestamp, technician identifier, and response checklist. This cryptographic digest is embedded in the digital certificate to guarantee tamper resistance.

### 7.3 Privacy-Preserving Public Verification
Regulatory inspectors and insurance auditors can scan a certificate QR code or query `/api/v1/certificates/verify/:certNumber` without logging in. The endpoint returns certificate validity, equipment category, facility name, and the cryptographic seal while redacting customer contact information and technician email addresses.

---

## 8. Documentation Index

For exhaustive technical and operational documentation, refer to the `docs/` repository:

- **Architecture:**
  - [Project Structure](docs/architecture/PROJECT_STRUCTURE.md)
  - [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
  - [Database Architecture](docs/architecture/DATABASE_ARCHITECTURE.md)
  - [Authentication & RBAC](docs/architecture/AUTHENTICATION_AND_RBAC.md)
  - [Offline Sync Architecture](docs/architecture/OFFLINE_SYNC_ARCHITECTURE.md)
  - [Inspection Integrity & Cryptographic Sealing](docs/architecture/INSPECTION_INTEGRITY.md)
- **API & Data Model:**
  - [RESTful API Documentation](docs/api/API_DOCUMENTATION.md)
  - [Relational Data Model & ERD](docs/database/DATA_MODEL.md)
- **User Guides:**
  - [Administrator User Guide](docs/user-guides/ADMIN_USER_GUIDE.md)
  - [Customer / Facility Manager User Guide](docs/user-guides/CUSTOMER_USER_GUIDE.md)
  - [Service Manager User Guide](docs/user-guides/SERVICE_MANAGER_USER_GUIDE.md)
  - [Field Technician User Guide](docs/user-guides/TECHNICIAN_USER_GUIDE.md)
- **Quality Assurance & Operations:**
  - [Final Implementation Report](docs/audit-reports/FINAL_IMPLEMENTATION_REPORT.md)
  - [Final Test Report](docs/audit-reports/FINAL_TEST_REPORT.md)
  - [Remaining Limitations & Scaling Roadmap](docs/audit-reports/REMAINING_LIMITATIONS.md)
  - [Pilot Readiness Checklist](docs/pilot/PILOT_READINESS_CHECKLIST.md)
  - [Manual Field Testing Runbook](docs/pilot/MANUAL_TESTING_GUIDE.md)
  - [Backup, PITR & Disaster Recovery Runbook](docs/backup-and-recovery/BACKUP_AND_RECOVERY.md)

---

## 9. Pilot Readiness Status

**Current Status:** **READY FOR CONTROLLED PILOT DEPLOYMENT**  
The software core, database migrations, security controls, and offline synchronization mechanisms have been verified under live PostgreSQL conditions. Physical on-site trials can proceed according to the [Pilot Readiness Checklist](docs/pilot/PILOT_READINESS_CHECKLIST.md).
