# Servora — Architecture Decision Log (ADR)

**Document Version:** 1.0.0  
**Status:** Living Architecture Log  
**Last Updated:** November 3, 2026  

---

## 1. Overview of Architecture Decision Records

This document maintains the authoritative record of architectural and software engineering decisions made throughout the lifecycle of the **Servora** platform.

Decisions are classified as:
* **ESTABLISHED (FROZEN BASELINE):** Architecture choices formally approved in the Phase 1 specifications (`docs/architecture/`, `docs/database/`, `docs/security/`) and implemented in Phase 2.
* **PROPOSED (PENDING CONFIRMATION):** Technical recommendations formulated during implementation audits for upcoming milestones that require team alignment.

---

## 2. Established Architecture Decisions

### ADR-001: Monorepo Architecture with Native npm Workspaces
* **Status:** `ESTABLISHED`
* **Context:** Servora encompasses both an offline-first Progressive Web Application (`client`) and a high-integrity REST API backend (`server`).
* **Decision:** Utilize native npm workspaces within a single GitHub repository (`Servora/`) rather than multi-repo or complex third-party tools like Lerna or Nx.
* **Reason:** Minimizes dependency divergence, allows shared TypeScript definitions (interfaces, DTOs, checklist models) between client and server, and simplifies semester academic evaluation.
* **Consequences:** Single root `package-lock.json`; server and client can be built or tested independently or concurrently via workspace scripts.
* **Related Specification:** `docs/architecture/technology-stack.md` (Section 4).

---

### ADR-002: TypeScript with Strict Type Checking Across the Entire Stack
* **Status:** `ESTABLISHED`
* **Context:** Fire-safety equipment maintenance records require strict data shape adherence (pressure ranges, dates, GPS coordinates, verification seals). JavaScript type coercion errors can lead to invalid compliance certificates.
* **Decision:** Enforce TypeScript with `strict: true`, `noImplicitAny: true`, and strict null checks across both `server/tsconfig.json` and `client/tsconfig.json`.
* **Reason:** Catches contract drift and serialization bugs at compile time.
* **Consequences:** All request inputs, database entities, and API responses must have explicit TypeScript types or inferred Zod schemas.
* **Related Specification:** `docs/architecture/technology-stack.md` (Sections 2 & 3).

---

### ADR-003: Relational ACID Persistence via PostgreSQL and Prisma ORM
* **Status:** `ESTABLISHED`
* **Context:** Safety compliance records, recurring inspection schedules, and multi-tenant customer facilities require referential integrity, unique constraints, and foreign key cascades.
* **Decision:** Use PostgreSQL as the relational data store with Prisma ORM as the data access layer.
* **Reason:** PostgreSQL provides native ACID guarantees, support for Decimal types (for GPS coordinates and pressure gauges), and JSONB capabilities. Prisma provides automated migrations and type-safe query builders.
* **Consequences:** The entire schema is defined declaratively in `server/prisma/schema.prisma`. All 17 core entities and 15 enums are strictly mapped.
* **Related Specification:** `docs/database/data-model.md`, `docs/architecture/technology-stack.md` (Section 3).

---

### ADR-004: Stateless HMAC-SHA256 JWT Authentication with `tokenVersion` Revocation
* **Status:** `ESTABLISHED`
* **Context:** Technicians and customers connect across intermittent networks. Server-side session stores (like express-session with Redis or in-memory tables) introduce session stickiness and scaling overhead.
* **Decision:** Implement stateless JSON Web Tokens (HMAC-SHA256) carrying `userId`, `role`, and `tokenVersion` with a 1-hour expiration lifespan. Store an integer `tokenVersion` on the `User` database record.
* **Reason:** Meets SEC-002 requirements for stateless scalability. Incrementing `tokenVersion` upon logout or password change immediately invalidates all active access tokens upon their next database-backed check.
* **Consequences:** No database read is strictly required for pure stateless verification, but token revocation checks query the user's `tokenVersion` when active database connectivity exists.
* **Related Specification:** `docs/security/security-requirements.md` (SEC-002).

---

### ADR-005: Server-Side Resource Ownership Verification for Multi-Tenant Isolation
* **Status:** `ESTABLISHED`
* **Context:** Multiple customer organizations and independent service contractors utilize the same Servora platform. A customer must never see or alter another customer's sites or safety equipment.
* **Decision:** Implement dedicated ownership-boundary middleware (`requireSiteOwnership`) verifying that the authenticated user owns the target `customerId` or possesses the platform `ADMIN` role.
* **Reason:** Role checks (`CUSTOMER`) alone are insufficient; multi-tenant security requires resource-level tenancy validation (SEC-003).
* **Consequences:** Unauthenticated cross-tenant access attempts return HTTP `403 Forbidden` and are logged in `AuditEvent`.
* **Related Specification:** `docs/security/security-requirements.md` (SEC-003).

---

### ADR-006: Deterministic Canonical JSON and SHA-256 Record Sealing
* **Status:** `ESTABLISHED`
* **Context:** Completed safety inspections must provide tamper-evident proof that equipment was checked and records were not altered post-visit.
* **Decision:** Implement canonical JSON stringification (`canonicalJsonStringify` sorting all object keys lexicographically) followed by standard Node.js `crypto` SHA-256 hex hashing (`computeSha256`).
* **Reason:** Standard `JSON.stringify` produces non-deterministic key ordering across different JavaScript runtimes. Canonical serialization guarantees identical cryptographic hashes regardless of insertion order.
* **Consequences:** Record integrity is mathematically verifiable. Note: Hashing guarantees database record integrity (tamper-evidence), not human truthfulness during physical inspection.
* **Related Specification:** `docs/security/security-requirements.md` (SEC-007), `docs/architecture/system-architecture.md` (Section 3).

---

### ADR-007: Automated Recurring Visit Generation at Contract Inception
* **Status:** `ESTABLISHED`
* **Context:** Fire-safety regulations mandate inspections at regular frequencies (Monthly, Quarterly, Bi-Annual, Annual). Relying on manual human scheduling causes missed inspections.
* **Decision:** When an Annual/Quarterly Maintenance Contract (AMC) is created, the backend `ContractService` automatically calculates all visit dates across the contract duration and generates planned `VisitSchedule` rows with grace-period-calculated due dates.
* **Reason:** Ensures 100% compliance visibility upfront. Service Managers simply dispatch technicians to pre-existing planned slots.
* **Consequences:** Visit schedules exist in advance; overdue state detection is a simple date comparison against `VisitSchedule.dueDate`.
* **Related Specification:** `docs/requirements/functional-requirements.md` (FR-022, FR-027).

---

### ADR-008: Testing Strategy Using Vitest and Supertest
* **Status:** `ESTABLISHED`
* **Context:** Fast, TypeScript-native testing without slow transpilation steps like Jest + ts-jest.
* **Decision:** Standardize on Vitest with Supertest for HTTP endpoint testing and `@vitest/coverage-v8` for native code coverage reporting.
* **Reason:** Vitest integrates seamlessly with Vite tooling, uses identical configuration syntax, and executes tests in under 2 seconds.
* **Consequences:** 12 test suites and 54 tests run rapidly across unit and integration concerns.
* **Related Specification:** `docs/architecture/technology-stack.md` (Section 4).

---

## 3. Proposed Architecture Decisions (Pending Confirmation)

### ADR-009 (PROPOSED): Client-Side Offline Persistence via Dexie.js (IndexedDB Wrapper)
* **Status:** `PROPOSED — PENDING CONFIRMATION FOR PHASE 4`
* **Context:** The Progressive Web App must store visit manifests, checklist forms, and binary image attachments offline. Direct W3C IndexedDB APIs are notoriously verbose, event-driven, and prone to transaction bugs.
* **Options Considered:**
  1. *Raw W3C IndexedDB:* Zero dependencies, but highly verbose and difficult to maintain.
  2. *idb (Jake Archibald):* Lightweight Promise wrapper, but lacks declarative schema indexing.
  3. *Dexie.js:* Mature, high-level TypeScript wrapper with declarative table indexing, live reactive queries, and robust multi-table transactions.
* **Recommendation:** Adopt `Dexie.js` for `client/src/offline/db.ts`.
* **Expected Consequences:** Clean Promise-based API for `pendingSyncQueue`, simplified schema migrations, and seamless integration with React hooks.

---

### ADR-010 (PROPOSED): Local Filesystem vs Cloud Object Storage for Field Photos
* **Status:** `PROPOSED — PENDING CONFIRMATION FOR PHASE 5`
* **Context:** Safety technicians capture photos of extinguisher pressure gauges and maintenance tags.
* **Options Considered:**
  1. *AWS S3 / Cloudflare R2:* Cloud-native, but introduces external cloud billing, API credentials, and network requirements for local academic evaluation.
  2. *Local Storage Driver (`server/uploads`):* Zero cost, runs entirely offline on localhost, files hashed with SHA-256 upon ingestion.
* **Recommendation:** Implement a pluggable storage interface (`StorageDriver`) with a `LocalStorageDriver` default for the semester implementation, accompanied by a documented `S3StorageDriver` configuration.
* **Expected Consequences:** Easy local demonstration without third-party cloud accounts; fully extensible to cloud storage in production.

---

### ADR-011 (PROPOSED): Headless Vector PDF Generation via PDFKit
* **Status:** `PROPOSED — PENDING CONFIRMATION FOR PHASE 6`
* **Context:** Generating official compliance certificates containing equipment inspection audit tables, customer signatures, and embedded verification QR codes.
* **Options Considered:**
  1. *Puppeteer / Headless Chrome:* Heavyweight (requires 200MB Chromium download), slow rendering, high RAM usage.
  2. *PDFKit:* Pure Node.js vector PDF generator, lightweight (< 5MB), fast rendering, precise millimeter/point positioning.
* **Recommendation:** Adopt `PDFKit` with `qrcode` package.
* **Expected Consequences:** Fast, deterministic PDF generation with embedded vector QR matrices and zero external browser dependencies.
