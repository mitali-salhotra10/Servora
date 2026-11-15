# Servora — Supabase PostgreSQL Configuration & Connection Verification Report

**Document Version:** 2.0.0 *(Final Live Verified)*  
**Audit & Verification Date:** November 14, 2026  
**Auditor / Engineer:** Senior Database Architect & Systems Engineer  
**Repository Branch:** `main`  
**Target Database Provider:** Supabase Managed PostgreSQL (AWS / Supavisor)  
**Supabase Project Reference:** `ioqujtcjwpbbsdlrzltp`  
**Target Region:** `ap-northeast-2` (AWS Seoul)  
**Overall Connection Status:** **`CONNECTED`** ✅  

---

## 1. Executive Summary & Status Classification

A live, end-to-end database connectivity verification was conducted against the production Supabase PostgreSQL instance for Servora. All checklist requirements have been thoroughly validated and confirmed.

### Classification: **`CONNECTED`** 🚀

| Verification Pillar | Target / Specification | Actual Status | Live Verification Evidence |
|---|---|:---:|---|
| **1. Environment Files Audit** | Read `server/.env` and root `.env` without secret exposure | ✅ **PASS** | Validated format; all placeholders removed; zero plain-text secrets logged. |
| **2. Transaction Pooler URL** | `DATABASE_URL` (Port 6543, `pgbouncer=true`) | ✅ **PASS** | `aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30` |
| **3. Session Direct URL** | `DIRECT_URL` (Port 5432) | ✅ **PASS** | `aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?connect_timeout=30` |
| **4. Placeholder Inspection** | No placeholders (`[YOUR-PASSWORD]`, `YOUR_PASSWORD`, etc.) | ✅ **PASS** | Zero placeholder tokens; authentic credentials validated. |
| **5. Prisma Schema Validation** | `npx prisma validate` | ✅ **PASS** | Schema valid with `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`. |
| **6. Live Prisma Query Execution** | `checkDatabaseConnection()` (`SELECT 1`) | ✅ **PASS** | Executed `SELECT 1` with result `isConnected: true` (Cold-start latency: `2136 ms`). |
| **7. Direct Connection Engine** | PostgreSQL 17 Direct Engine probe on port 5432 | ✅ **PASS** | `PostgreSQL 17.11 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`. |
| **8. Backend Readiness Endpoint** | `GET http://localhost:5000/ready` | ✅ **READY** | HTTP 200 OK: `{ "status": "ready", "database": { "connected": true, "latencyMs": 871 } }`. |
| **9. Backend Health Endpoint** | `GET http://localhost:5000/health` | ✅ **HEALTHY** | HTTP 200 OK: `{ "status": "healthy", "service": "servora-backend", "version": "0.1.0" }`. |

---

## 2. Sanitized Environment Configuration

The credentials in `server/.env` and root `.env` were validated with all sensitive values strictly redacted:

```env
PORT=5000
NODE_ENV=development

# Supabase Transaction Pooler (Supavisor PgBouncer mode for application runtime queries)
DATABASE_URL="postgresql://postgres.ioqujtcjwpbbsdlrzltp:***@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30"

# Supabase Session Direct Connection (Used for Prisma migrations and schema synchronization)
DIRECT_URL="postgresql://postgres.ioqujtcjwpbbsdlrzltp:***@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?connect_timeout=30"

JWT_SECRET="<REDACTED_32+_CHARS>"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
UPLOAD_DIR="./uploads"
PUBLIC_VERIFICATION_BASE_URL="http://localhost:5173/verify"
```

### Sanitized Validation Details:
- **Project Reference:** `ioqujtcjwpbbsdlrzltp`
- **Host:** `aws-0-ap-northeast-2.pooler.supabase.com`
- **Database Name:** `postgres`
- **User Format:** `postgres.ioqujtcjwpbbsdlrzltp` (Supavisor pooler tenant format)
- **Special Character Handling:** Complex password special characters (e.g. `/`, `#`, `,`) are safely RFC-3986 URL-encoded to guarantee cross-client parser compatibility.
- **Connection Timeout Guard:** `connect_timeout=30` is appended to prevent socket drops across international WAN routes during multi-step TLS handshakes.

---

## 3. Live Verification Test Outputs

### 3.1 Prisma Schema Validation
* **Command:** `npx prisma validate --schema=server/prisma/schema.prisma`
* **Output:**
  ```text
  Environment variables loaded from .env
  Prisma schema loaded from server\prisma\schema.prisma
  The schema at server\prisma\schema.prisma is valid 🚀
  ```
* **Exit Code:** `0` (Success)

### 3.2 Prisma Client Singleton Probe (`checkDatabaseConnection()`)
* **Execution:** Read-only `client.$queryRawUnsafe('SELECT 1')` through `server/dist/db/prisma.ts`.
* **Output:**
  ```text
  prisma:query BEGIN
  prisma:query DEALLOCATE ALL
  prisma:query SELECT 1
  prisma:query COMMIT
  ```
* **Result Payload:**
  ```json
  {
    "isConnected": true,
    "latencyMs": 2136
  }
  ```

### 3.3 Direct PostgreSQL Engine Verification (Port 5432)
* **Execution:** Direct session engine handshake on port 5432.
* **Output:**
  ```json
  [
    {
      "direct_connected": 1,
      "version": "PostgreSQL 17.11 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit"
    }
  ]
  ```

### 3.4 Backend Readiness Probe (`GET /ready`)
* **Endpoint:** `http://localhost:5000/ready`
* **HTTP Status:** `200 OK`
* **Response Payload:**
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "database": {
        "connected": true,
        "latencyMs": 871
      },
      "timestamp": "2026-11-14T11:57:07.414Z"
    }
  }
  ```
* **Warm Query Latency:** **871 ms**

### 3.5 Backend Health Probe (`GET /health`)
* **Endpoint:** `http://localhost:5000/health`
* **HTTP Status:** `200 OK`
* **Response Payload:**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "uptimeSeconds": 28,
      "timestamp": "2026-11-14T11:57:16.021Z",
      "environment": "development",
      "service": "servora-backend",
      "version": "0.1.0"
    }
  }
  ```

---

## 4. Compliance with Restrictions Checklist

| Restriction Requirement | Verified Status |
|---|:---:|
| Do NOT run migrations | ✅ **COMPLIED** (Zero migrations executed) |
| Do NOT create or alter tables | ✅ **COMPLIED** (Database schema and DDL untouched) |
| Do NOT run `prisma db push` | ✅ **COMPLIED** (`db push` was not executed) |
| Do NOT seed data | ✅ **COMPLIED** (Zero seed scripts run) |
| Do NOT disable demo mode | ✅ **COMPLIED** (Demo mode and fallbacks untouched) |
| Redact all credentials and secrets | ✅ **COMPLIED** (Zero passwords or keys exposed) |

---

## 5. Architectural & Deployment Summary

1. **Dual-Pooler Architecture Verified**:
   - `DATABASE_URL` routes through Supabase Supavisor transaction pooler on port 6543 with `pgbouncer=true`, ensuring fast query execution and transaction isolation for Express web traffic.
   - `DIRECT_URL` routes through Supabase direct session pooler on port 5432, ready for future Prisma migration and DDL workflows.
2. **Production Database Engine**:
   - Supabase PostgreSQL 17.11 is fully operational and responsive.
3. **Live Process Health**:
   - Servora Backend server daemon is running on `http://localhost:5000` with live database connectivity.
   - Frontend Vite dev server is running on `http://localhost:5173`.
