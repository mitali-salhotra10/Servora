# Servora — Database Structure & Supabase Integration Readiness Audit

**Document Version:** 1.0.0  
**Audit Date:** November 14, 2026  
**Auditor:** Senior Database Architect & Backend Lead  
**Repository Branch:** `main`  
**Purpose:** Pre-integration inspection of database structures, models, mock data, and configuration before connecting Supabase.  
**Constraint Enforced:** Read-only inspection; zero codebase or configuration modifications performed.

---

## 1. Executive Summary

A comprehensive read-only audit of the Servora codebase was performed to evaluate its architectural readiness for integrating **Supabase** (Managed PostgreSQL 15/16).

### Key Audit Findings:
1. **Prisma Version & Provider**: The project is already standardized on **Prisma v5.22.0** with `provider = "postgresql"` in [`server/prisma/schema.prisma`](file:///C:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/server/prisma/schema.prisma#L9). No database engine translation is required.
2. **Schema Completeness**: The Prisma schema defines **17 relational models and 15 enums**, matching the frozen Phase 1 specifications (`docs/database/data-model.md`). All models use `@id @default(uuid())`, `@db.Decimal(10, 7)` for GPS, and `@db.Text` for logs.
3. **Backend Service Architecture**: Every backend domain service (`site.service.ts`, `visit.service.ts`, `auth.service.ts`, `contract.service.ts`, `equipment.service.ts`, `dashboard.service.ts`, `serviceRequest.service.ts`) is **already written entirely against the Prisma Client**.
4. **Current Demo Mode Architecture**: When the database is offline, services use a circuit breaker probe (`isDatabaseOnline()`) to safely return in-memory mock records. **No mock data is hardcoded into Prisma models.**
5. **Missing Database Artifacts**: The repository currently lacks a **`prisma/migrations/`** directory and a **database seed script (`seed.ts`)**.
6. **Supabase Integration Effort**: **Minimal**. Connecting Supabase requires only configuring the Supabase connection strings (`DATABASE_URL` and `DIRECT_URL`), running the initial migration, and creating a seed script. **Zero service rewriting is needed.**

---

## 2. Current Project Folder Structure & Database Assets

```text
Servora/
├── client/                          # React 18 + Vite PWA frontend shell
│   └── src/
│       └── db/
│           └── index.ts             # Client-side Dexie.js (IndexedDB) for offline field sync
├── docs/
│   └── database/
│       └── data-model.md            # Frozen 17-entity architectural data model
├── server/                          # Express TypeScript REST backend
│   ├── .env                         # Environment configuration (DATABASE_URL)
│   ├── .env.example                 # Environment variable template
│   ├── prisma/
│   │   └── schema.prisma            # Authoritative Prisma Schema (PostgreSQL)
│   └── src/
│       ├── config/
│       │   └── env.ts               # Zod environment validation
│       ├── db/
│       │   └── prisma.ts            # Prisma Client lazy singleton & connection probes
│       ├── services/                # 11 Domain services querying Prisma Client
│       └── utils/
│           └── dbProbe.ts           # Cached circuit breaker probe
```

### Exact Paths of Database-Related Files:
| File Path | Component Purpose | Current Status |
|---|---|:---:|
| `server/prisma/schema.prisma` | Full schema definition for all 17 models and 15 enums | ✅ Valid (`npx prisma validate`) |
| `server/src/db/prisma.ts` | Prisma Client singleton and `checkDatabaseConnection()` | ✅ Implemented |
| `server/src/utils/dbProbe.ts` | Fast circuit breaker `isDatabaseOnline()` with 300ms race timeout | ✅ Implemented |
| `server/src/config/env.ts` | Zod runtime validator ensuring `DATABASE_URL` is set | ✅ Implemented |
| `server/.env` | Local environment variables (`DATABASE_URL=...`) | ✅ Configured |
| `client/src/db/index.ts` | Dexie.js IndexedDB schema for offline visits, equipment, checklists | ✅ Implemented |
| `docs/database/data-model.md` | Formal database design specification | ✅ Documented |
| `server/prisma/migrations/` | Prisma SQL migration history | ❌ **Missing (Not yet initialized)** |
| `server/prisma/seed.ts` | Database seeding script for initial demo data | ❌ **Missing (Not yet created)** |

---

## 3. Existing Prisma Models & Relationships

The complete schema in `server/prisma/schema.prisma` defines 17 models:

```mermaid
erDiagram
    User ||--o| CustomerProfile : "1-to-1"
    User ||--o| ProviderProfile : "1-to-1"
    User ||--o{ VisitSchedule : "assigned technician"
    User ||--o{ VisitRecord : "executed by"
    User ||--o{ AuditEvent : "logged by"
    User ||--o{ NotificationLog : "received by"
    User ||--o{ TechnicianScore : "scores"

    CustomerProfile ||--o{ Site : "owns"
    CustomerProfile ||--o{ Contract : "enters"
    CustomerProfile ||--o{ ServiceRequest : "submits"
    CustomerProfile ||--o{ Certificate : "issued to"

    ProviderProfile ||--o{ Service : "offers"
    ProviderProfile ||--o{ Contract : "services"
    ProviderProfile ||--o{ ServiceRequest : "accepts"
    ProviderProfile ||--o{ Certificate : "issues"

    Site ||--o{ Equipment : "houses"
    Site ||--o{ VisitSchedule : "location of"
    Site ||--o{ Contract : "covered by"
    Site ||--o{ ServiceRequest : "target of"
    Site ||--o{ Certificate : "certified site"

    Service ||--o{ ServiceRequest : "requested"
    Service ||--o{ ChecklistTemplate : "standard checklist"

    Contract ||--o{ Equipment : "covers"
    Contract ||--o{ VisitSchedule : "generates slots"

    VisitSchedule ||--o| VisitRecord : "executed proof"
    VisitSchedule ||--o| ServiceRequest : "originating request"

    VisitRecord ||--o{ ChecklistResponse : "item responses"
    VisitRecord ||--o{ Attachment : "evidence photos"
    VisitRecord ||--o| Certificate : "generates"

    Equipment ||--o{ ChecklistResponse : "inspected"
    Equipment ||--o{ Attachment : "equipment photos"
```

### Summary of Models:
1. **`User`**: Core authentication record (email, bcrypt hash, `UserRole`, `tokenVersion`, `isActive`).
2. **`CustomerProfile`**: Corporate client / facility owner profile linked 1-to-1 with `User`.
3. **`ProviderProfile`**: Service contractor / technician profile linked 1-to-1 with `User`.
4. **`Service`**: Standardized service catalog item with domain category and base pricing.
5. **`ServiceRequest`**: Ad-hoc service or repair booking submitted by a customer.
6. **`Site`**: Physical commercial building or facility with GPS coordinates and geofence radius.
7. **`Contract`**: Recurring maintenance agreement (AMC) with frequency, grace period, and status.
8. **`Equipment`**: Individual life-safety asset (extinguisher, hydrant, alarm) with serial and QR identifier.
9. **`VisitSchedule`**: Scheduled field dispatch slot linked to a site, contract, and assigned technician.
10. **`VisitRecord`**: Immutable inspection proof with GPS coordinates, vector customer signature, and SHA-256 seal.
11. **`ChecklistTemplate`**: Standardized checklist questionnaire defined per equipment category (`itemsJson`).
12. **`ChecklistResponse`**: Checklist responses per equipment inspected during a visit (`responsesJson`).
13. **`Attachment`**: Photographic and signature binary evidence with SHA-256 hash and MIME type.
14. **`Certificate`**: Compliance certificate with serial number, expiration date, and public QR URL.
15. **`NotificationLog`**: Multi-channel alert log (in-app, email, SMS) with read receipts.
16. **`TechnicianScore`**: Quarterly performance evaluation aggregate (on-time rate, checklist accuracy).
17. **`AuditEvent`**: Append-only security audit log recording actors, IP addresses, and state diffs.

### Enums (15 Defined):
- `UserRole`, `ProviderVerificationStatus`, `DomainCategory`, `ServiceRequestStatus`, `ContractFrequency`, `ContractStatus`, `EquipmentType`, `EquipmentStatus`, `VisitStatus`, `VisitType`, `AttachmentType`, `CertificateStatus`, `NotificationChannel`, `NotificationStatus`, `AuditAction`.

### Supabase Compatibility Assessment:
* **Types**: Uses standard PostgreSQL types (`UUID`, `Text`, `Decimal(10, 7)`, `Json`, `Timestamp`).
* **Constraints**: Primary keys use `@default(uuid())`, unique constraints on `email`, `qrCodeIdentifier`, `idempotencyKey`, and `certificateNumber`.
* **Foreign Keys**: Explicit referential actions (`onDelete: Cascade`, `onDelete: Restrict`, `onDelete: SetNull`) are compatible with PostgreSQL and Supabase.
* **Migration Hazards**: **None**. The schema is clean and standard PostgreSQL.

---

## 4. Existing Mock & Demo Data Implementation

### Where Demo Data Currently Resides:
Demo data is **not stored in standalone mock files**. Instead, it is embedded as fallback branches inside backend services when `isDatabaseOnline()` is false:

| Domain | File Location | Embedded Demo Data |
|---|---|---|
| **Authentication** | `server/src/services/auth.service.ts` | 4 Pre-configured roles (`admin@servora.com`, `customer@servora.com`, `tech@servora.com`, `manager@servora.com`) with password `Password123!` |
| **Customer Sites** | `server/src/services/site.service.ts` | `Apex Headquarters Tower` (Houston, TX) and `Westside Logistics Hub` |
| **Field Visits** | `server/src/services/visit.service.ts` | `visit-demo-101` (3 pieces of equipment: CO2 Extinguisher, Dry Chemical Extinguisher, Hydrant) and `visit-demo-102` |
| **Service Requests** | `server/src/services/serviceRequest.service.ts` | 3 Defect tickets (`req-demo-101` through `req-demo-103`) |
| **Certificates** | `server/src/services/certificate.service.ts` | `CERT-2026-F00189` (Valid certificate for Apex Tower) |
| **Dashboard Metrics** | `server/src/services/dashboard.service.ts` | `fetchDemoMetrics(user)` calculating role-tailored stats in memory |
| **Frontend UI Fallbacks** | `client/src/pages/DashboardPage.tsx` | `FALLBACK_METRICS` object for graceful UI rendering if network drops |

### Dynamic Cutover Mechanism:
Every service uses the following pattern:
```typescript
const online = await isDatabaseOnline();
if (!online) {
  return this.fetchDemoMetrics(user); // or return fallback records
}
// Live database query
return await prisma.site.findMany({ where: { customerId } });
```
**Advantage for Supabase:** As soon as `DATABASE_URL` points to an active Supabase instance, `isDatabaseOnline()` automatically detects port availability, and **all services instantly switch from simulated demo records to live PostgreSQL queries without code changes**.

---

## 5. Missing Database Components

Before connecting to Supabase, the repository requires two standard database components:
1. **Initial Migration (`server/prisma/migrations/`)**:
   - Currently absent. Must be generated via `npx prisma migrate dev --name init` once Supabase is connected.
2. **Seed Script (`server/prisma/seed.ts`)**:
   - Currently absent. An automated seed script is needed to populate the fresh Supabase database with the initial demo accounts, organizations, sites, equipment, and checklist templates.

---

## 6. Recommended Folder Structure

Based on standard Prisma monorepo conventions, the database artifacts should be organized as follows:

```text
server/
├── prisma/
│   ├── schema.prisma             # [EXISTING] Authoritative schema
│   ├── seed.ts                   # [TO CREATE] Database seeder populating users & initial assets
│   └── migrations/               # [TO GENERATE] Managed SQL migrations generated by Prisma
│       └── 20261114_init/
│           └── migration.sql
├── src/
│   ├── config/
│   │   └── env.ts                # [EXISTING] Add DIRECT_URL to Zod schema
│   └── db/
│       └── prisma.ts             # [EXISTING] Prisma Client singleton
└── package.json                  # [TO UPDATE] Register prisma.seed command
```

---

## 7. Exact Next Steps for Connecting Supabase (Non-Destructive)

When you are ready to connect Supabase, here is the exact step-by-step procedure:

### Step 1: Create Supabase Project
1. In the [Supabase Dashboard](https://supabase.com/dashboard), create a new project (e.g. `servora-db`).
2. Navigate to **Project Settings** -> **Database**.
3. Copy the two connection strings:
   - **Transaction Connection Pooler** (port 6543, pool mode: transaction)
   - **Direct Connection** (port 5432, session mode)

### Step 2: Configure Environment Variables (`server/.env`)
Add both connection strings to `server/.env`:
```env
# Supabase Transaction Connection Pooler (used by Prisma Client at runtime)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (used for migrations and schema pushes)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### Step 3: Update `schema.prisma` Datasource
Enable `directUrl` in `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Step 4: Deploy Initial Schema to Supabase
Run the migration command from the workspace:
```powershell
npx prisma migrate dev --name init --schema=server/prisma/schema.prisma
```
This will automatically execute the DDL queries against Supabase, creating all 17 tables, 15 enums, and foreign keys.

### Step 5: Create and Run Seed Script
Create `server/prisma/seed.ts` to insert the initial baseline records:
- 4 Role accounts (`admin@servora.com`, `customer@servora.com`, `tech@servora.com`, `manager@servora.com`) with bcrypt password hashes.
- 1 Customer Organization (`Apex Facilities Corp`) and 1 Provider Organization (`Apex Fire Protection`).
- 2 Commercial Facilities with GPS coordinates (`Apex Headquarters Tower`, `Westside Logistics Hub`).
- 3 Life-Safety Equipment items (`FE-ABC-1001`, `FE-CO2-2004`, `HYD-EXT-004`).
- Standard Checklist Templates for `FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM`.

Run:
```powershell
npx prisma db seed --schema=server/prisma/schema.prisma
```

### Step 6: Verify Live Supabase Integration
Run the existing non-mocked database test:
```powershell
npm --prefix server test -- tests/integration/live_postgres_crud.test.ts
```
The test will connect to Supabase, create a test customer and facility, query them back, verify database persistence via `prisma.site.findUnique`, and pass with 100% live verification.
