# Servora — Comprehensive Quality Assurance & Testing Strategy

**Document Version:** 1.0.0  
**Status:** Living Engineering Standard  
**Date:** November 3, 2026  
**Scope:** Full-Stack Quality Assurance, Security Verification & Offline Testing  

---

## 1. Testing Philosophy & Objectives

Servora operates in the high-consequence life safety domain. An application bug or data corruption issue can cause unverified fire-safety hardware to be certified, leading to legal liabilities or loss of life during emergencies.

The Servora Testing Strategy enforces four core tenets:
1. **Zero Fake Success:** Tests must never mock away critical security or business logic to artificially produce a passing result.
2. **Honest Environmental Reporting:** When a required service (such as a live PostgreSQL daemon) is unavailable, tests must report this explicitly rather than silently skipping or fabricating success.
3. **Multi-Tenancy by Default:** Every resource endpoint must be tested not only for valid access by its owner, but also for negative rejection (HTTP 403 Forbidden) against unauthorized cross-tenant requests.
4. **Deterministic Reproducibility:** Test suites must execute independently of run order and cleanse any generated fixtures.

---

## 2. Testing Tiers & Scope

```mermaid
graph TD
    subgraph Test Hierarchy
        E2E["End-to-End Tests (Cypress / Playwright)<br>Full browser flow: Login → Offline Check-in → Sync → PDF"]
        INT["API & Integration Tests (Vitest + Supertest)<br>Express middleware, RBAC, DB transactions, Tenant isolation"]
        UNIT["Unit Tests (Vitest)<br>Zod schemas, bcrypt hashing, JWT crypto, Canonical JSON SHA-256"]
    end
    E2E --> INT
    INT --> UNIT
```

### 2.1 Tier 1: Unit Testing (Fast, Isolated, Pure Logic)
* **Target:** Business calculations, cryptographic functions, data transformers, validation schemas.
* **Tooling:** Vitest v2.x with native TypeScript execution.
* **Key Suites:**
  * `tests/unit/env.test.ts`: Zod environment variable parsing, coercion, and missing variable rejection.
  * `tests/unit/password.test.ts`: bcrypt password hashing with minimum 10 salt rounds and complexity regex.
  * `tests/unit/jwt.test.ts`: HMAC-SHA256 signing, claims decoding, expiration detection, and signature tampering rejection.
  * `tests/unit/hash.test.ts`: Lexicographical key sorting in canonical JSON stringification and deterministic SHA-256 seal generation.
  * `tests/unit/rbac.test.ts`: Pure role-based authorization logic and `ADMIN` universal bypass.
  * `tests/unit/schemas.test.ts`: Zod boundary tests for registration, sites (GPS bounds), equipment, and contracts.
  * `tests/unit/errors.test.ts`: Custom `AppError` hierarchy and centralized error status mapping.
* **Execution Constraint:** 100% runnable in standard process sandbox with zero external dependencies.

### 2.2 Tier 2: API & Integration Testing (HTTP, Middleware, Routing)
* **Target:** Express application endpoints, middleware chains, authentication headers, error handlers, and business services.
* **Tooling:** Supertest v7.x mounted directly to `app.ts` (without binding an external listening port).
* **Key Suites:**
  * `tests/integration/health.test.ts`: Sanitized `/health` and `/ready` probes, plus Helmet security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
  * `tests/integration/auth.test.ts`: Registration, login, profile retrieval (`/me`), invalid credentials, and `tokenVersion` logout revocation.
  * `tests/integration/tenant_isolation.test.ts`: Verifies that Customer B is strictly forbidden (HTTP 403) from viewing, editing, or registering equipment on Customer A's site.
  * `tests/integration/contracts_visits.test.ts`: AMC creation and automated recurring visit slot generation according to frequency.
* **Execution Constraint:** On Windows environments, Supertest loopback port binding requires network access permission (`BypassSandbox: true` or unsandboxed runner).

### 2.3 Tier 3: Database Integration Testing (Real PostgreSQL Protocol)
* **Target:** Real TCP/IP PostgreSQL transactions, Prisma foreign key cascades, unique constraints, and schema migrations.
* **Key Suite:** `tests/integration/postgres_e2e.test.ts`.
* **Execution Policy:**
  * If a PostgreSQL instance is detected on `DATABASE_URL`, execute raw query verification and report latency.
  * If PostgreSQL is not reachable, output an honest diagnostic log and report that live database tests are blocked by the environment, rather than pretending the database was verified.

### 2.4 Tier 4: Security & Penetration Testing
* **Target:** Verification of SEC-001 through SEC-011.
* **Scenarios:**
  * Self-registration as `ADMIN` or `SERVICE_MANAGER` rejected with 422.
  * Passwords with < 8 characters or missing numeral/special character rejected.
  * Expired JWTs rejected with 401 Unauthorized.
  * Tampered token signatures rejected with 401 Unauthorized.
  * Accessing another customer's site or equipment rejected with 403 Forbidden.
  * Absence of plain-text passwords or connection strings in logs or API responses.

### 2.5 Tier 5: Offline Synchronization Testing (Phase 4 Target)
* **Target:** IndexedDB queue durability, idempotency under network flapping, and conflict resolution.
* **Scenarios:**
  * Inspecting equipment and completing checklist forms in browser offline mode.
  * Simulating 10 duplicate replay requests of the identical sync payload: exactly 1 database write and 10 successful idempotent responses.
  * Auto-drain of `pendingSyncQueue` upon `window.online` event.

---

## 3. Test Data Strategy & Fixtures

1. **UUID Standardization:** All entity fixtures must use valid RFC 4122 version 4 UUIDs (e.g. `11111111-1111-4111-a111-111111111111`) to prevent schema validator rejections.
2. **Password Fixtures:** Test passwords must satisfy the security complexity regex: minimum 8 characters, at least 1 numeral, at least 1 special character (e.g., `ValidPassword123!`).
3. **Database Cleansing:** Integration tests utilizing a live test database must run within an isolated test schema (`servora_test`) and truncate modified tables in a `beforeEach` or `afterEach` hook.

---

## 4. Definition of a Passing Test & Reporting Rules

* **Pass Criteria:**
  * The assertion succeeds without unhandled exceptions.
  * HTTP status code strictly matches the specification (e.g. 201 for creation, 401 for bad auth, 403 for cross-tenant access, 422 for malformed schema).
  * Error payloads follow the uniform `{ success: false, error: { code, message, details } }` contract.
* **Reporting Blocked Tests:**
  * Tests that cannot execute due to missing host dependencies (e.g., live PostgreSQL or browser canvas) must be clearly classified as `BLOCKED BY ENVIRONMENT` with diagnostic instructions on how to unblock them.

---

## 5. Reproducible PostgreSQL Test Environment Setup

To run live database integration tests and Prisma migrations:

```bash
# 1. Start PostgreSQL 16 using Docker:
docker run --name servora-postgres \
  -e POSTGRES_USER=servora_user \
  -e POSTGRES_PASSWORD=servora_password \
  -e POSTGRES_DB=servora_db \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. Configure server/.env:
DATABASE_URL="postgresql://servora_user:servora_password@localhost:5432/servora_db?schema=public"

# 3. Apply Prisma baseline migration:
npm run prisma:validate --workspace=server
npm run prisma:generate --workspace=server
npx prisma migrate dev --name init_baseline

# 4. Run test suite:
npm run test --workspace=server
```
