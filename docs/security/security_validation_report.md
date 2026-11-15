# Servora — Security & Cryptographic Validation Report

**Document Version:** 1.0.0  
**Audit Date:** November 10, 2026  
**Auditor:** Senior Application Security & Cryptographic Systems Auditor  
**Repository Branch:** `main`  
**Classification:** Confidential Engineering Security Review  

---

## 1. Executive Summary

This security audit inspects the authentication, multi-tenant isolation, authorization, data privacy, and cryptographic record sealing mechanisms of the **Servora** platform.

### Overall Security Status: **STRONG APPLICATION BASELINE WITH IDENTIFIED DEPLOYMENT CONSTRAINTS**

| Security Control | Specification Reference | Audit Status | Key Verification Finding |
|---|---|:---:|---|
| **Multi-Tenant Boundary** | SEC-003 | ✅ **VERIFIED** | Customer B cannot read, modify, or attach assets to Customer A's facilities. Cross-tenant queries return `403 Forbidden`. |
| **Role-Based Access Control** | SEC-003 | ✅ **VERIFIED** | Strict role enforcement across `CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, and `ADMIN`. Unauthorized actions return `403 Forbidden`. |
| **JWT Token Management** | SEC-002 | ✅ **VERIFIED** | HMAC-SHA256 signing with 8-hour expiry. Invalid signatures, altered payloads, and expired tokens are rejected with `401 Unauthorized`. |
| **Password Hashing** | SEC-001 | ✅ **VERIFIED** | bcryptjs with $\ge 10$ salt rounds. Plaintext passwords never logged or returned in API responses. |
| **File Upload Restrictions** | SEC-005 | ✅ **VERIFIED** | Binary uploads restricted to `image/jpeg`, `image/png`, and `image/webp` with 5MB max size limit. Executables and scripts rejected with `400 Bad Request`. |
| **Public Certificate Privacy** | SEC-006 | ✅ **VERIFIED** | Public verification portal (`/verify/:certificateNumber`) masks customer names and strips phone numbers and billing emails. |
| **Audit Log Integrity** | SEC-008 | ✅ **VERIFIED** | Append-only `AuditEvent` log records actors, actions, timestamps, and target entities. |
| **Cryptographic Sealing** | SEC-007 | ✅ **VERIFIED** | Deterministic canonical JSON serialization (`canonicalJsonStringify`) hashed via SHA-256 hex digest. Tampering changes the digest and fails validation. |
| **Standards Attribution (RFC 6962)** | RFC 6962 / SEC-007 | ⚠️ **CORRECTED** | Prior UI badges claiming "RFC 6962 Verified" were corrected to "SHA-256 Canonical Seal". RFC 6962 requires Merkle Trees with audit proofs, which is not implemented. |
| **Demo Mode Isolation** | DEV-001 | ✅ **VERIFIED** | Demo data is explicitly isolated to simulated in-memory responses and visually disclosed via top-level amber banners. |

---

## 2. In-Depth Security Domain Analysis

### 2.1 Multi-Tenant Isolation (SEC-003)
* **Mechanisms Tested:**
  - Route: `/api/v1/sites/:id`
  - Controller: `site.controller.ts`
  - Service: `site.service.ts`
* **Test Verification (`tests/integration/tenant_isolation.test.ts`):**
  - Customer A (`cust-uuid-1`) registers Facility X.
  - Customer B (`cust-uuid-2`) attempts `GET /api/v1/sites/<Facility-X-ID>` with Customer B's valid JWT:
    - Server verifies `req.user.customerProfileId !== site.customerId`.
    - Server rejects request with `403 Forbidden` (`Access denied: Site does not belong to active tenant`).
  - Customer B attempts `PUT /api/v1/sites/<Facility-X-ID>`:
    - Server rejects modification with `403 Forbidden`.
  - Customer B attempts to register equipment on Customer A's site:
    - Server rejects equipment registration with `403 Forbidden`.

---

### 2.2 Role-Based Access Control (RBAC) Matrix
The authorization middleware (`server/src/middleware/rbac.middleware.ts`) enforces the following server-side matrix:

```text
+------------------------------+----------+------------------+-----------------+-------+
| Resource / Operation         | CUSTOMER | SERVICE_PROVIDER | SERVICE_MANAGER | ADMIN |
+------------------------------+----------+------------------+-----------------+-------+
| Register Site                |   ALLOW  |      DENY        |      DENY       | ALLOW |
| List Own Sites               |   ALLOW  |      ALLOW*      |      ALLOW*     | ALLOW |
| Create AMC Contract          |   DENY   |      DENY        |      ALLOW      | ALLOW |
| Assign Technician to Visit   |   DENY   |      DENY        |      ALLOW      | ALLOW |
| Submit Checklist Inspection  |   DENY   |      ALLOW       |      DENY       | ALLOW |
| Upload Binary Evidence       |   DENY   |      ALLOW       |      ALLOW      | ALLOW |
| View System Diagnostics      |   DENY   |      DENY        |      DENY       | ALLOW |
| View Global Audit Logs       |   DENY   |      DENY        |      DENY       | ALLOW |
+------------------------------+----------+------------------+-----------------+-------+
* Scope-filtered to assigned sites only
```

---

### 2.3 Investigation: RFC 6962 Claims vs. SHA-256 Canonical Sealing

#### Background:
The project documentation and UI formerly referenced "RFC 6962" compliance.

#### Technical Analysis:
1. **What RFC 6962 Actually Specifies:**
   - RFC 6962 (*Certificate Transparency*) defines a cryptographic protocol for public append-only verifiable logs.
   - It requires a **Merkle Tree Hash (MTH)** where:
     $$\text{MTH}(D[0]) = \text{SHA-256}(0x00 \,||\, d_0)$$
     $$\text{MTH}(D[n]) = \text{SHA-256}(0x01 \,||\, \text{MTH}(D[0:k]) \,||\, \text{MTH}(D[k:n]))$$
   - RFC 6962 mandates logarithmic **Consistency Proofs** and **Inclusion/Audit Proofs** proving that a log has not been modified or split.
2. **What Servora Actually Implements:**
   - Servora implements a deterministic JSON key-sorting serializer:
     [`canonicalJsonStringify(obj)`](file:///C:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/server/src/utils/hash.ts#L13).
   - Servora hashes this single string with standard SHA-256:
     [`computeSha256(data)`](file:///C:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/server/src/utils/hash.ts#L56).
   - Each inspection record receives an independent SHA-256 hash stored in `visit_records.record_hash`.
3. **Audit Finding:**
   - Servora's SHA-256 canonical record hash is **cryptographically sound for tamper detection** on a per-record basis.
   - However, it **does not constitute an RFC 6962 Merkle Tree log**.
4. **Action Taken:**
   - Removed references to "RFC 6962" in `AdminDashboardView.tsx` and `AuditLogsPage.tsx`.
   - Updated labels to accurately read **"SHA-256 Canonical Seal"** and **"SHA-256 Verified"**.

---

### 2.4 Binary Evidence Upload Security (SEC-005)
* **Storage Location:** `server/uploads/` with randomly generated server-side prefixes (`att-<uuid>.<ext>`). Original user-supplied filenames are stripped to prevent path traversal (`../../`).
* **MIME Validation:** Tested in `tests/integration/phase5_trust_chain.test.ts`:
  - `application/javascript`, `application/octet-stream`, `text/html` uploads are rejected with `400 Bad Request`.
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
* **Size Enforcement:** Multer configured with `limits: { fileSize: 5 * 1024 * 1024 }` (5MB). Larger payloads are rejected before processing.
* **Integrity Hashing:** Every uploaded file has its SHA-256 digest computed via stream and stored in `attachments.file_hash`.

---

### 2.5 Public Verification Portal Privacy (SEC-006)
* **Route:** `GET /api/v1/certificates/verify/:certificateNumber`
* **PII Protection Audit:**
  - Evaluated in `phase5_trust_chain.test.ts` lines 89–135.
  - Sanitization confirmed:
    - Customer billing email: **STRIPPED** (Not in JSON)
    - Customer phone number: **STRIPPED** (Not in JSON)
    - Building facility address: **STRIPPED**
    - Facility name: **MASKED** (e.g., `Industrial Facility - Sector 18` $\to$ `Ind*** ***`)
    - Contractor business name & license: **RETAINED** (Public credential verification)
    - Seal verification status: **RETAINED** (`isSealValid: true`)

---

## 3. Deployment Security Checklist for Production

Before moving to `PRODUCTION READY`:
- [ ] **HTTPS / TLS 1.3**: Terminate SSL at load balancer or reverse proxy (Nginx / Cloudflare).
- [ ] **Database Connection Security**: Enable `sslmode=require` in Prisma `DATABASE_URL`.
- [ ] **Rate Limiting**: Apply IP-based rate limiting on `/api/v1/auth/login` and `/api/v1/auth/register` using Redis or memory store.
- [ ] **Cloud Storage S3 IAM**: Switch binary evidence uploads from local disk to AWS S3 with private bucket policies and signed expiring download URLs.
- [ ] **CORS Origin Whitelisting**: Replace wildcard dev CORS with strict production domain whitelist.
