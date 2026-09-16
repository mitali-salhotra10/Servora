# Servora — Security Architecture & Requirements Specification

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  
**Requirement Prefix:** `SEC-`  

---

## 1. Security Architecture Principles

Servora operates in the high-stakes life safety domain. False inspection certifications, manipulated equipment records, or unauthorized modification of inspection dates can lead to catastrophic physical outcomes, loss of life, or severe legal liabilities.

The security architecture is founded upon five non-negotiable principles:
1. **Zero Trust in Client State:** The Progressive Web App (PWA) operates on user devices in untrusted environments. Client-side route guards and UI state are convenience helpers only. **All authentication, authorization, and validation rules must be strictly enforced on the server.**
2. **Principle of Least Privilege (PoLP):** Each role (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`) is constrained to the exact subset of endpoints and database rows necessary to fulfill its function.
3. **Cryptographic Non-Repudiation:** Once a safety visit is finalized, its canonical payload is cryptographically sealed (SHA-256), preventing post-facto repudiation by technicians or building owners.
4. **Safe Public Transparency:** Public verification of compliance certificates must confirm authenticity without exposing confidential customer PII, internal pricing, or private contact details.
5. **Strict Secrets Hygiene:** Secrets, tokens, and credentials are never stored in source control.

---

## 2. Security Requirements Catalog

### SEC-001: Adaptive Password Hashing
- All user passwords must be hashed using `bcrypt` with a minimum cost factor (salt rounds) of 10.
- Passwords must undergo client-side and server-side complexity checks (minimum 8 characters, at least 1 numeral, 1 special symbol).
- Raw passwords must never appear in application memory longer than necessary for authentication, and must never be output to logs.

### SEC-002: Stateless JWT Token Architecture
- Authentication uses cryptographically signed JSON Web Tokens (HMAC-SHA256).
- Access tokens carry `userId`, `role`, and `tokenVersion`, with an expiration lifespan capped at 1 hour for high-security environments.
- Tokens must be sent in the standard HTTP `Authorization: Bearer <token>` header.

### SEC-003: Server-Side Authorization Matrix
- Access control must verify not only the user's role (`ROLE_BASED`), but also **resource ownership / multi-tenancy boundaries** (`OWNERSHIP_BASED`). A customer cannot read another customer's sites, and a technician cannot submit records for visits assigned to another provider.

### SEC-004: Strict Input Validation & Parameter Sanitization
- 100% of API endpoints receiving request bodies, path parameters, or query strings must validate inputs against strict schemas (e.g., Zod) before handing data to services.
- Prevent SQL Injection by relying strictly on Prisma ORM's parameterized query execution.
- Sanitize text inputs against Cross-Site Scripting (XSS) and script injection.

### SEC-005: Secure File & Attachment Handling
- File uploads (inspection photos, certificate PDFs) must be restricted to allowed MIME types (`image/jpeg`, `image/png`, `application/pdf`).
- Maximum upload size per photo is enforced at the reverse proxy/API layer (max 5MB per upload).
- Uploaded file contents must be hashed (SHA-256) upon ingestion.
- Files must be served with strict content headers: `Content-Type`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: inline` (or attachment) to prevent HTML/SVG execution.

### SEC-006: Public Certificate Verification Boundary
- The public verification route (`GET /api/certificates/verify/:certificateNumber`) must be accessible without authentication.
- **Privacy Sanitization:** This endpoint must expose strictly:
  - Certificate Number
  - Issuing Provider Business Name
  - Verification Status (`VALID`, `EXPIRED`, `REVOKED`)
  - Inspection Date & Expiration Date
  - Masked Site Identifier (e.g., "Commercial Facility - Sector 4, Unit ***")
  - Equipment Summary (e.g., "5 Fire Extinguishers Inspected & Certified")
  - Cryptographic Verification Seal (SHA-256 match confirmation)
- Under no circumstances shall customer billing details, primary contact phone numbers, exact flat/unit numbers, or technician personal data be returned.

### SEC-007: Cryptographic Visit Payload Sealing
- The `VisitRecord` creation pipeline must serialize canonical inspection attributes:
  `canonicalPayload = JSON.stringify({ visitScheduleId, technicianId, siteId, checkInTime, gpsLat, gpsLng, checklistDigest, photoDigests, customerSignatureDigest })`
- Compute `SHA-256(canonicalPayload) -> recordHash`.
- If an attacker modifies a checklist entry in the database directly, the stored `recordHash` will fail re-computation during audit verification.

### SEC-008: Rate Limiting & DoS Mitigation
- Rate limiting must be enforced using memory-backed or Redis-backed rate limiters:
  - Auth endpoints (`/api/auth/login`, `/api/auth/register`): max 5 attempts per minute per IP.
  - Public verification (`/api/certificates/verify/*`): max 60 requests per minute per IP.
  - Sync endpoints (`/api/sync/*`): max 30 sync pushes per minute per technician.

### SEC-009: HTTP Security Headers
- Helmet middleware must be mounted globally on the Express application:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS: `max-age=31536000; includeSubDomains`)
  - `X-Frame-Options: DENY` (prevents clickjacking on sensitive forms)
  - `X-Content-Type-Options: nosniff`

### SEC-010: Environment Variables & Secret Separation
- Zero passwords, tokens, or encryption keys in Git.
- Local development utilizes `.env` (strictly excluded in `.gitignore`).
- Documented template `.env.example` contains only dummy keys and configuration placeholders.

### SEC-011: Immutable Audit Trail
- All security-critical events (login failures, role updates, certificate revocations, manual visit overrides) must write an immutable row to `AuditEvent` capturing actor ID, timestamp, IP address, and payload snapshot.

---

## 3. Explicit Inventory of Server-Side Authorized Operations

The following table explicitly enumerates all critical application actions and specifies the mandatory server-side authorization enforcement:

| Operation / Action | Route / Endpoint | Authorized Roles | Ownership & Boundary Enforcement |
| :--- | :--- | :--- | :--- |
| **Register Account** | `POST /api/auth/register` | Public | Role capped at `CUSTOMER` or `SERVICE_PROVIDER`. Cannot self-register as `ADMIN` or `SERVICE_MANAGER`. |
| **Login** | `POST /api/auth/login` | Public | Rate-limited. Account must be active (`isActive == true`). |
| **Create Site** | `POST /api/sites` | `CUSTOMER` | User must own the target `CustomerProfile`. |
| **View Customer Sites** | `GET /api/sites` | `CUSTOMER`, `ADMIN` | Customer can only view sites associated with their own `customerId`. |
| **Register Equipment** | `POST /api/equipment` | `CUSTOMER`, `SERVICE_MANAGER`, `ADMIN` | Equipment must belong to a site owned/managed by the requester. |
| **Submit Service Request** | `POST /api/service-requests` | `CUSTOMER` | Target site must belong to the requesting customer. |
| **Accept Service Request** | `PUT /api/service-requests/:id/accept` | `SERVICE_PROVIDER`, `SERVICE_MANAGER` | Provider must be verified (`status == VERIFIED`). Request must be unassigned or addressed to provider. |
| **Create Maintenance Contract** | `POST /api/contracts` | `SERVICE_MANAGER`, `ADMIN` | Contract must bind provider organization to a consenting customer profile. |
| **Dispatch Technician** | `PUT /api/visits/:id/assign` | `SERVICE_MANAGER`, `SERVICE_PROVIDER` | Provider can only dispatch technicians employed in their own organization. |
| **Submit Offline Visit / Sync** | `POST /api/sync/visits` | `SERVICE_PROVIDER` (Technician) | Requesting technician must be the assigned technician for the `visitScheduleId`. Idempotency key checked. |
| **Issue Safety Certificate** | Internal Service / `POST /api/certificates` | Internal / `SERVICE_MANAGER` | Generated automatically by system upon verified visit completion. Manual issuance restricted to Admin. |
| **Revoke Certificate** | `POST /api/certificates/:id/revoke` | `ADMIN` | Strictly restricted to platform administrators with mandatory audit reason logging. |
| **View Audit Logs** | `GET /api/audit-events` | `ADMIN` | Restricted strictly to system administrators. Read-only. |
| **Verify Certificate (Public)**| `GET /api/certificates/verify/:certNum` | Public (Unauthenticated) | Safe sanitized view only. Zero sensitive PII exposed. |

---

## 4. Threat Modeling (STRIDE Summary)

| Threat Category | Potential Attack Vector | Servora Mitigation Mechanism |
| :--- | :--- | :--- |
| **Spoofing** | Forged technician identity during offline sync. | Synchronized payloads require a valid JWT issued to the assigned technician; verified against `VisitSchedule.assignedTechnicianId`. |
| **Tampering** | Altering inspection checklist results post-visit. | Canonical JSON payload is hashed with SHA-256 into `VisitRecord.recordHash`; any database manipulation breaks hash verification. |
| **Repudiation** | Customer claims service was never executed. | Multi-factor evidence: Geofenced GPS check-in timestamp, equipment photos with timestamps, and on-screen customer vector signature. |
| **Information Disclosure** | Scraping customer addresses via public certificate verification. | Data sanitization layer strips customer personal details, phone numbers, and full street addresses from public verification responses. |
| **Denial of Service** | Flooding sync endpoint with duplicate offline records. | Rate limiting per IP/technician, combined with fast-path idempotency key lookup bypassing heavy write pipelines. |
| **Elevation of Privilege**| User registers as Customer, then modifies role claim to Admin. | Role elevation endpoints are protected; JWT claims are signed with server secret; role changes require existing Admin authentication. |
