# Servora — Non-Functional Requirements Specification (NFRS)

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  
**Requirement Prefix:** `NFR-`  

---

## 1. Overview & Quality Attributes Priority

The architectural quality of Servora is governed by strict non-functional constraints. In accordance with the system's nature as a high-stakes safety inspection platform operating in variable network conditions, three core pillars take absolute architectural priority:
1. **Offline Resilience & Network Fault Tolerance** (Basements, warehouses, plant rooms).
2. **Security & Server-Side Authorization** (Protection of life-safety data and role boundaries).
3. **Data Integrity & Auditability** (Tamper-evident legal compliance and chain of custody).

---

## 2. Core Pillar 1: Offline Resilience & Network Fault Tolerance

### NFR-001: Zero Data Loss on Disconnection [CORE]
- **Category:** Offline Resilience
- **Specification:** The Progressive Web App (PWA) must capture, persist, and guarantee zero data loss for all field operations (technician check-in, checklist completion, numerical gauge readings, photo attachments, and customer vector signatures) when operating completely disconnected from cellular or Wi-Fi networks.
- **Verification Metric:** Disconnecting the device during active inspection form entry and performing a hard browser refresh must result in 100% preservation of all form fields and image blobs from IndexedDB.

### NFR-002: Offline Queue Persistence Across Restarts [CORE]
- **Category:** Offline Resilience
- **Specification:** The client-side `pendingSyncQueue` stored in IndexedDB must survive device power cycles, browser closures, low-memory background terminations, and OS-level application reboots without corruption or data truncation.
- **Verification Metric:** Queued offline visits must remain intact and queue processing must automatically resume upon browser reopening.

### NFR-003: Idempotent Synchronization Under Network Jitter [CORE]
- **Category:** Offline Resilience & Reliability
- **Specification:** The synchronization protocol must employ unique client-generated UUID idempotency keys (`idempotencyKey`) per transaction. In conditions of intermittent network flapping where HTTP responses are dropped after server write, retry attempts must never generate duplicate database entities, duplicate visits, or duplicate certificates.
- **Verification Metric:** Replaying the identical sync payload 10 consecutive times to the sync endpoint must result in exactly 1 database write and 10 HTTP 200/OK responses returning the original resource identifier.

### NFR-004: Graceful Degradation & Network Transition Handling [CORE]
- **Category:** Offline Resilience & Usability
- **Specification:** The PWA must dynamically detect transitions between online, offline, and unstable/slow network states via the Network Information API and window event listeners, transitioning UI indicators within 500ms without blocking user interaction or throwing unhandled network exceptions.

---

## 3. Core Pillar 2: Security & Authorization

### NFR-005: Cryptographic Credential Hashing [CORE]
- **Category:** Security
- **Specification:** All user passwords must be hashed using `bcrypt` with a minimum workload factor (salt rounds) of 10. Passwords must never be stored, logged, cached in memory after authentication, or transmitted across unencrypted channels.
- **Verification Metric:** Zero occurrences of plain-text passwords or reversible hashes in databases or application logs.

### NFR-006: Server-Side RBAC Enforcement [CORE]
- **Category:** Security
- **Specification:** Role-Based Access Control must be strictly enforced on the server. Client-side navigation guards and UI element masking are considered cosmetic only; every API route must independently authenticate the JWT and authorize the user's role against the requested resource ownership.
- **Verification Metric:** 100% of protected API endpoints return HTTP 401 Unauthorized or HTTP 403 Forbidden when invoked with missing, forged, expired, or cross-role JWT claims.

### NFR-007: Safe Public Certificate Verification Boundary [CORE]
- **Category:** Security & Privacy
- **Specification:** The unauthenticated public certificate verification endpoint (`/verify/:certificateId`) must expose only minimal compliance verification attributes (Certificate Number, Status, Equipment Types Inspected, Inspection Date, Expiration Date, Provider Trade Name). It must strictly sanitize and exclude all customer Personally Identifiable Information (PII) including full street addresses, customer phone numbers, internal pricing, and technician private contact info.

### NFR-008: Secure Secrets & Configuration Management [CORE]
- **Category:** Security
- **Specification:** Zero credentials, API keys, database connection strings, JWT signing secrets, or third-party service tokens shall be committed into version control. All secrets must be injected at runtime via environment variables (`.env` files ignored by `.gitignore`).
- **Verification Metric:** Automated git repository secret scanner (e.g., git-secrets or GitHub secret scanning) reports zero exposed credentials.

### NFR-009: Injection & Transport Security [CORE]
- **Category:** Security
- **Specification:** All REST API inputs must be validated and sanitized against strict schemas (e.g., Zod) to prevent SQL Injection, Cross-Site Scripting (XSS), and prototype pollution. Database interactions must strictly use parameterized queries through Prisma ORM. All communication in staging and production must mandate TLS 1.3 encryption over HTTPS.

---

## 4. Core Pillar 3: Data Integrity & Auditability

### NFR-010: Cryptographic Record Integrity (SHA-256) [CORE]
- **Category:** Data Integrity & Non-Repudiation
- **Specification:** Finalized inspection visit records must be cryptographically hashed using SHA-256 over a canonical representation of the visit metadata, checklist responses, photo hashes, and customer signature. Once computed and stored in `VisitRecord.recordHash`, the hash serves as an immutable tamper-evident seal.
- **Verification Metric:** Altering a single byte in the stored inspection checklist must cause cryptographic hash verification to fail.

### NFR-011: Tamper-Evident Historical Immutability [CORE]
- **Category:** Data Integrity
- **Specification:** Completed visit records, signed checklist responses, and issued certificates must be immutable. Application-level update and delete operations on completed records must be rejected with HTTP 409 Conflict. Corrective actions require creating an explicit revision/supplementary inspection record.

### NFR-012: Comprehensive Audit Trail [CORE]
- **Category:** Auditability
- **Specification:** All compliance-critical and security-sensitive operations (authentication attempts, role modifications, contract status changes, visit check-ins, manual grace period overrides, certificate generations) must be recorded in an append-only `AuditEvent` log capturing timestamp, acting actor ID, IP address, user agent, target entity, and event payload.
- **Verification Metric:** Audit logs are append-only with no update or hard delete operations permitted via application services.

---

## 5. Performance & Responsiveness

### NFR-013: UI Responsiveness & Frame Rate
- **Category:** Performance & Usability
- **Specification:** The client PWA interface must maintain a smooth 60 frames per second (fps) interaction rate during local navigation, form field inputs, and checklist toggling. Checkbox clicks, dropdown selections, and input changes must reflect visually in less than 50 milliseconds.

### NFR-014: API Response Latency
- **Category:** Performance
- **Specification:** Under standard network conditions (4G/LTE or broadband), 95% of standard REST API requests (excluding large file uploads) must respond within 200 milliseconds (`p95 < 200ms`). Complex dashboard aggregations and contract compliance summaries must return within 500 milliseconds (`p95 < 500ms`).

### NFR-015: PWA Initial Load Time
- **Category:** Performance & Responsiveness
- **Specification:** The PWA must achieve a First Contentful Paint (FCP) of under 1.5 seconds and Time to Interactive (TTI) of under 2.5 seconds on mid-tier mobile hardware on a standard 3G/4G simulation. Subsequent visits must load within 500ms leveraging service worker caching.

### NFR-016: Local Media Processing & Compression
- **Category:** Performance & Storage
- **Specification:** Field photographs captured by technicians must be compressed client-side on device prior to storage in IndexedDB (target resolution max 1920x1080, JPEG quality 0.75, file size < 500KB per photo) to prevent client storage exhaustion and optimize upload bandwidth during sync.

---

## 6. Availability & Reliability

### NFR-017: System Availability
- **Category:** Availability
- **Specification:** The backend REST API and public certificate verification portal shall maintain an availability target of 99.5% during core operating hours (07:00 to 20:00 local time).
- **Verification Metric:** Uptime monitoring pinging health check endpoints (`/api/health`) every 60 seconds.

### NFR-018: Fault Isolation
- **Category:** Reliability
- **Specification:** Failure of optional or secondary services (such as in-app notification dispatch or PDF certificate rendering) must not block or crash the primary field technician sync pipeline or prevent visit completion records from being committed to the database.

---

## 7. Usability & Accessibility

### NFR-019: Mobile-First Touch Target Sizing
- **Category:** Usability
- **Specification:** All primary interactive elements in the technician field interface (buttons, checklist pass/fail toggles, QR scan triggers, camera triggers, signature box) must have a minimum interactive touch target size of 48px by 48px to accommodate one-handed operation and gloved hands in industrial environments.

### NFR-020: Accessibility & High Contrast
- **Category:** Accessibility
- **Specification:** The web application shall adhere to WCAG 2.1 Level AA compliance guidelines, including a minimum color contrast ratio of 4.5:1 for standard text and 3:1 for large graphical components. The interface must remain fully legible under bright outdoor sunlight conditions (typical for outdoor fire hydrant inspections).

### NFR-021: Form Error Recovery & Clear Feedback
- **Category:** Usability
- **Specification:** Form errors must be communicated inline adjacent to the offending input, using plain language rather than technical stack traces. All destructive actions (e.g., contract termination, appointment cancellation) must require explicit two-step confirmation.

---

## 8. Scalability & Maintainability

### NFR-022: Horizontal API Scalability
- **Category:** Scalability
- **Specification:** The Node.js Express backend must be stateless, storing zero user session state in server memory. All authentication state is carried in signed JWTs or retrieved from the database, allowing the server process to scale horizontally across multiple instances or containers behind a reverse proxy or load balancer.

### NFR-023: Clean Layered Architecture & Maintainability
- **Category:** Maintainability
- **Specification:** The codebase must enforce strict separation of concerns following a layered architecture pattern: Routes/Controllers → Services/Business Logic → Repositories/Prisma Data Access. Business rules must not be coupled directly to HTTP request/response objects.

### NFR-024: Cross-Browser & Cross-Device Compatibility
- **Category:** Usability & Compatibility
- **Specification:** The PWA must provide identical functional capabilities across modern evergreen mobile and desktop web browsers: Google Chrome (Android & Desktop), Apple Safari (iOS 15+ & macOS), Mozilla Firefox, and Microsoft Edge.

### NFR-025: Database Indexing & Query Optimization
- **Category:** Scalability & Performance
- **Specification:** All foreign keys, search predicates (e.g., `equipment.serialNumber`, `equipment.qrCode`, `visitSchedule.targetDate`, `contract.status`), and composite lookup keys must be explicitly indexed in PostgreSQL to maintain sub-10ms query execution as dataset grows beyond 50,000 records.
