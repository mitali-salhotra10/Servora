# Servora — Test Strategy & Plan (Phase 2)

**Phase:** Phase 2 (Backend API & Database Foundation)  
**Status:** Baseline Active  
**Author:** Servora Engineering Team  

---

## 1. Scope & Objectives

The testing suite for Phase 2 ensures the correctness, security, isolation, and robustness of the Servora backend API. The test plan operates across three distinct tiers:

1. **Unit Tests:** Fast, isolated testing of pure logic functions (Zod schemas, environment validation, password hashing, JWT generation and verification, canonical JSON serialization, and SHA-256 trust calculation).
2. **API & Integration Tests:** HTTP testing of Express endpoints using Supertest, verifying routing, middleware pipelines (Helmet, CORS, body parsing, Zod validation, JWT authentication, RBAC, tenant isolation, and centralized error handling).
3. **Database Integration Tests:** Clear distinction between mock-based operational testing and live PostgreSQL integration tests.

---

## 2. Test Execution Hierarchy & Distinction

### 2.1 Mock-Based Integration Tests
- **Purpose:** Verifies that API controllers, business services, and database interaction logic follow proper contract boundaries and handle responses, constraint violations, and status codes properly.
- **Execution:** Runs via standard `npm test` without requiring external services or containers.
- **Guarantee:** Verifies application and framework logic; does not serve as empirical proof of live database wire protocol.

### 2.2 Live PostgreSQL Integration Tests (`tests/integration/postgres_e2e.test.ts`)
- **Purpose:** Verifies real TCP/IP connectivity, raw SQL query execution, and database dialect compatibility against PostgreSQL.
- **Behavior:** When PostgreSQL is not active on the host, the test honestly reports that PostgreSQL is not running and documents what requires a live database, without falsely fabricating passing integration results.
- **Reproducible Setup:**
  ```bash
  # Using Docker:
  docker run --name servora-postgres -e POSTGRES_USER=servora_user -e POSTGRES_PASSWORD=servora_password -e POSTGRES_DB=servora_db -p 5432:5432 -d postgres:16-alpine

  # Apply schema migrations:
  npx prisma migrate dev --name init_phase2

  # Run tests:
  npm test
  ```

---

## 3. Security & Multi-Tenancy Boundary Testing

Every tenant-owned entity adheres to strict tenant isolation:
- A user authenticated with `Role.CUSTOMER` can only query and mutate sites where `Site.customerId == req.user.customerProfileId`.
- Equipment registration verifies that the target `siteId` is owned by the requesting customer.
- Cross-customer access attempts are tested and must return HTTP `403 Forbidden` (or `404 Not Found`).
- Administrative users (`Role.ADMIN`) have audited platform-wide operational inspection capabilities.

---

## 4. Test Suites Inventory

1. `tests/unit/env.test.ts`: Environment parsing, coercion, and missing variable rejection.
2. `tests/unit/password.test.ts`: bcrypt hashing with 10 salt rounds and complexity verification.
3. `tests/unit/jwt.test.ts`: HMAC-SHA256 signing, claims verification, expiration, and tampering rejection.
4. `tests/unit/hash.test.ts`: Deterministic canonical JSON key ordering, nested objects, and SHA-256 seal calculation.
5. `tests/unit/rbac.test.ts`: Role-based route authorization and ADMIN universal bypass.
6. `tests/unit/schemas.test.ts`: Zod schema validation across all request inputs.
7. `tests/unit/errors.test.ts`: AppError status codes and centralized error middleware mapping.
8. `tests/integration/health.test.ts`: `/health` and `/ready` probes and Helmet security headers.
9. `tests/integration/auth.test.ts`: Registration, login, profile retrieval, and logout token revocation.
10. `tests/integration/tenant_isolation.test.ts`: Multi-tenant customer boundary isolation and attack prevention.
11. `tests/integration/contracts_visits.test.ts`: AMC contracts, automated recurring visit slot calculation, and dispatch.
12. `tests/integration/postgres_e2e.test.ts`: Honest live database connectivity probe.
