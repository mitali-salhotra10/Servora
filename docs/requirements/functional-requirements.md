# Servora — Functional Requirements Specification (FRS)

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  
**Requirement Prefix:** `FR-`  

---

## 1. Traceability & Organization Matrix

The functional requirements of Servora are structured into **11 Core Functional Modules**:

| Module ID | Module Name | Primary Actors | Requirement ID Range |
| :--- | :--- | :--- | :--- |
| **MOD-01** | Authentication & Identity | All Users | FR-001 – FR-006 |
| **MOD-02** | Customer Management & Sites | Customer, Manager, Admin | FR-007 – FR-011 |
| **MOD-03** | Service Provider Management | Provider, Manager, Admin | FR-012 – FR-016 |
| **MOD-04** | Service Requests & Discovery | Customer, Provider, Manager | FR-017 – FR-021 |
| **MOD-05** | Contracts & AMCs | Customer, Provider, Manager | FR-022 – FR-026 |
| **MOD-06** | Visit Scheduling & Automation | System, Manager, Provider | FR-027 – FR-031 |
| **MOD-07** | Technician Field Workflow | Provider (Technician) | FR-032 – FR-037 |
| **MOD-08** | Offline-First & Synchronization | Provider (Technician), System | FR-038 – FR-043 |
| **MOD-09** | Digital Trust & Verification | All Users, Public Auditors | FR-044 – FR-049 |
| **MOD-10** | Dashboard, Reports & Compliance | All Roles | FR-050 – FR-054 |
| **MOD-11** | Notifications & Alerts | All Roles, System | FR-055 – FR-058 |

---

## 2. Module 1: Authentication & Identity Management

### FR-001: User Registration
- **Module:** MOD-01
- **Actor:** Unauthenticated Visitor
- **Description:** The system shall allow visitors to register an account with a unique email address, full name, phone number, secure password, and specified initial role (`CUSTOMER` or `SERVICE_PROVIDER`).
- **Preconditions:** The visitor does not already have an active account with the provided email.
- **Postconditions:** A new `User` record is created with hashed password (`bcrypt`), associated profile stub is initialized, and an unverified or active state is assigned based on role.
- **Acceptance Criteria:**
  - Password must be at least 8 characters and contain at least one numeral and one special character.
  - Email uniqueness must be enforced at both API and database levels.

### FR-002: User Authentication & JWT Issuance
- **Module:** MOD-01
- **Actor:** Registered User
- **Description:** The system shall authenticate user credentials and return a signed JSON Web Token (JWT) access token containing user identity and assigned role claims.
- **Preconditions:** User exists and is not suspended.
- **Postconditions:** A valid, time-limited JWT access token (expiry e.g., 1 hour) is returned alongside user profile summary.
- **Acceptance Criteria:**
  - Failed logins must return generic error messages ("Invalid credentials") without revealing email presence.
  - Tokens must be cryptographically signed with a secure server-side secret (`JWT_SECRET`).

### FR-003: Role-Based Authorization Enforcement
- **Module:** MOD-01
- **Actor:** System / All Authenticated Users
- **Description:** The backend shall enforce role-based access control (RBAC) on all protected REST endpoints, verifying that the authenticated user possesses the specific role required for the requested action (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`).
- **Preconditions:** Request contains a valid JWT in the `Authorization: Bearer <token>` header.
- **Postconditions:** Request proceeds if authorized; HTTP 403 Forbidden is returned if unauthorized.
- **Acceptance Criteria:**
  - Tampered or expired tokens must yield HTTP 401 Unauthorized.
  - Cross-role route access attempts must be blocked and logged in `AuditEvent`.

### FR-004: User Logout & Token Invalidation
- **Module:** MOD-01
- **Actor:** Authenticated User
- **Description:** The system shall support secure logout by clearing client-side stored session tokens and purging sensitive cached user data from browser memory.
- **Acceptance Criteria:**
  - Client storage (`localStorage` / session cache) is purged immediately upon logout.
  - Redirects user to the login screen.

### FR-005: Password Hashing & Salt Enforcement
- **Module:** MOD-01
- **Actor:** System / Security Layer
- **Description:** All user passwords must be hashed using `bcrypt` with a minimum cost factor of 10 prior to database insertion. Raw passwords must never be stored, logged, or transmitted in response payloads.
- **Acceptance Criteria:**
  - Zero plain-text passwords appear in database dumps or log traces.

### FR-006: User Profile Retrieval & Self-Update
- **Module:** MOD-01
- **Actor:** Authenticated User
- **Description:** The system shall allow users to view and update their contact phone number, avatar URL, and notification preferences. Role elevation or email modifications require administrative or verified flow.
- **Acceptance Criteria:**
  - Users can only access and modify their own profile data unless holding the `ADMIN` role.

---

## 3. Module 2: Customer Management & Sites

### FR-007: Customer Profile Management
- **Module:** MOD-02
- **Actor:** Customer
- **Description:** The system shall allow customers to maintain organizational metadata, billing details, primary contact info, and tax/business registration identifiers.
- **Acceptance Criteria:**
  - Customer data is linked one-to-one with the parent `User` record.

### FR-008: Site / Facility Registry
- **Module:** MOD-02
- **Actor:** Customer, Service Manager
- **Description:** The system shall allow customers to register multiple physical sites/properties (e.g., "Main Corporate Office", "Warehouse B - Dock 4") specifying site name, address, GPS coordinates (latitude, longitude), geofence radius (in meters), and designated on-site contact person.
- **Acceptance Criteria:**
  - Multiple sites can be associated with a single customer profile.
  - GPS coordinates must be validated for valid geographical bounds.

### FR-009: Equipment Inventory Registration per Site
- **Module:** MOD-02
- **Actor:** Customer, Service Manager, Technician
- **Description:** The system shall maintain an equipment registry for each site. Each piece of fire-safety equipment shall record: serial number, equipment type (`FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM`), capacity/spec (e.g., "6kg ABC Dry Powder", "45m Hose Reel"), physical location inside the site (e.g., "Floor 2 Server Room"), last inspection date, next due date, and unique QR code identifier.
- **Acceptance Criteria:**
  - Equipment is queryable by site, serial number, and QR code identifier.
  - Historical maintenance logs are linked directly to each equipment asset.

### FR-010: Customer Service History View
- **Module:** MOD-02
- **Actor:** Customer
- **Description:** The system shall present customers with a consolidated, chronological log of all historical service requests, completed visits, inspection findings, and issued compliance certificates.
- **Acceptance Criteria:**
  - Records must be searchable by date range, site, and equipment type.

### FR-011: Customer Rating & Feedback Submission
- **Module:** MOD-02
- **Actor:** Customer
- **Description:** Upon completion of a service visit, the customer shall have the ability to submit a numerical rating (1 to 5 stars) and qualitative feedback on the service provider.
- **Acceptance Criteria:**
  - Feedback is only submittable once per completed visit.
  - Feedback updates provider aggregate score.

---

## 4. Module 3: Service Provider Management

### FR-012: Provider Profile & Credentials
- **Module:** MOD-03
- **Actor:** Service Provider, Admin
- **Description:** The system shall allow providers to define their business name, operational radius (in km), base service address, primary skills/certifications (e.g., "Certified Fire Inspector Level 1"), and tax/license details.
- **Acceptance Criteria:**
  - Profile tracks verification status (`PENDING_VERIFICATION`, `VERIFIED`, `SUSPENDED`).

### FR-013: Service Catalog Definition
- **Module:** MOD-03
- **Actor:** Service Provider, Service Manager
- **Description:** Providers shall be able to configure their service offerings from standardized platform categories (e.g., "Fire Extinguisher Refilling", "Quarterly Hydrant Testing", "Alarm Panel Sensor Calibration") with standard base rates and estimated completion durations.
- **Acceptance Criteria:**
  - Services are linked to standardized safety checklist templates.

### FR-014: Technician Roster Management (Service Manager Role)
- **Module:** MOD-03
- **Actor:** Service Manager
- **Description:** For providers operating as multi-technician teams, the Service Manager shall have the ability to invite, assign, and manage individual technicians within their provider organization.
- **Acceptance Criteria:**
  - Individual technicians inherit the provider's organizational context while maintaining distinct login credentials.

### FR-015: Provider Availability & Schedule Windows
- **Module:** MOD-03
- **Actor:** Service Provider
- **Description:** Providers shall define active operating days, shift hours, and holiday blackout periods to prevent booking collisions.
- **Acceptance Criteria:**
  - Slot availability checks prevent scheduling overlapping visits.

### FR-016: Provider Verification Workflow
- **Module:** MOD-03
- **Actor:** Admin
- **Description:** Administrators shall review uploaded trade certificates and government licenses to transition a provider's status from `PENDING_VERIFICATION` to `VERIFIED`.
- **Acceptance Criteria:**
  - Only verified providers appear in public customer search results.

---

## 5. Module 4: Service Requests & Discovery

### FR-017: Service Request Creation
- **Module:** MOD-04
- **Actor:** Customer
- **Description:** Customers shall be able to create a service request by selecting a target site, specifying equipment needing service or selecting a standard maintenance package, preferred date/time slot, and any special access notes.
- **Acceptance Criteria:**
  - Request state transitions to `SUBMITTED`.

### FR-018: Provider Discovery & Filtering
- **Module:** MOD-04
- **Actor:** Customer
- **Description:** The system shall allow customers to discover available providers filtered by service type, proximity to the customer site, verification status, and customer rating.
- **Acceptance Criteria:**
  - Search results display provider distance, average rating, and service pricing.

### FR-019: Direct Request vs. Open Broadcast
- **Module:** MOD-04
- **Actor:** Customer
- **Description:** Customers can dispatch a service request directly to a chosen provider or broadcast to eligible verified providers within the site's geographical radius.
- **Acceptance Criteria:**
  - Broadcast requests are lockable by the first provider to accept (`CLAIMED`).

### FR-020: Request Acceptance / Rejection
- **Module:** MOD-04
- **Actor:** Service Provider, Service Manager
- **Description:** Providers shall review incoming service requests and either accept or decline within a configured response window (e.g., 24 hours). If declined, the customer is notified and allowed to re-dispatch.
- **Acceptance Criteria:**
  - Acceptance transitions request to `ACCEPTED` and initiates visit slot creation.

### FR-021: Service Request Status Tracking
- **Module:** MOD-04
- **Actor:** Customer, Service Provider
- **Description:** Both customer and provider shall have real-time visibility into the lifecycle state of a service request: `SUBMITTED` → `ACCEPTED` → `SCHEDULED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`.
- **Acceptance Criteria:**
  - Status updates update the UI in near real-time.

---

## 6. Module 5: Contracts & Maintenance Agreements (AMCs)

### FR-022: Maintenance Contract Creation
- **Module:** MOD-05
- **Actor:** Customer, Service Manager
- **Description:** The system shall support creating formal maintenance agreements (e.g., Annual Maintenance Contract - AMC) specifying: customer, provider, covered site(s), covered equipment assets, contract start date, contract end date, service frequency (`MONTHLY`, `QUARTERLY`, `BI_ANNUAL`, `ANNUAL`), and billing terms.
- **Acceptance Criteria:**
  - Contracts are established with unique contract reference numbers (e.g., `AMC-2026-0042`).

### FR-023: Contract Grace Period & SLA Settings
- **Module:** MOD-05
- **Actor:** Service Manager, Admin
- **Description:** Each contract shall configure an allowable grace period (e.g., 7 days past scheduled date) before a pending visit is flagged as legally `OVERDUE`.
- **Acceptance Criteria:**
  - The system computes SLA thresholds based on contract start and frequency.

### FR-024: Contract Equipment Coverage Scope
- **Module:** MOD-05
- **Actor:** Service Manager
- **Description:** The system shall allow linking specific equipment serial numbers to a contract, enabling automated generation of asset-level inspection checklists during each scheduled cycle.
- **Acceptance Criteria:**
  - Equipment added to a site can be incrementally bound to active contracts.

### FR-025: Contract Status Lifecycle
- **Module:** MOD-05
- **Actor:** System, Service Manager
- **Description:** The system shall manage contract statuses: `DRAFT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `TERMINATED`.
- **Acceptance Criteria:**
  - System automatically marks contracts as `EXPIRED` once end date is exceeded.

### FR-026: Contract Compliance Summary
- **Module:** MOD-05
- **Actor:** Customer, Service Manager
- **Description:** For every active contract, the system shall compute and display compliance health: total required visits vs. completed visits, on-time percentage, and upcoming maintenance deadlines.
- **Acceptance Criteria:**
  - Displays a compliance score (%) accessible to the building owner.

---

## 7. Module 6: Visit Scheduling & Automation

### FR-027: Automatic Recurring Visit Generation
- **Module:** MOD-06
- **Actor:** System (Automated Scheduler)
- **Description:** Upon activation of a contract, the system shall automatically generate all planned visit slots (`VisitSchedule` records) across the entire contract tenure based on the selected frequency (e.g., 4 quarterly visits for an annual contract).
- **Acceptance Criteria:**
  - Visit slots are created in status `PLANNED` with target dates calculated according to interval offsets.

### FR-028: Technician Dispatch & Assignment
- **Module:** MOD-06
- **Actor:** Service Manager, Service Provider
- **Description:** The manager/provider shall assign a specific technician to an upcoming visit slot, with the system validating that the technician is not double-booked for that time window.
- **Acceptance Criteria:**
  - Transitions visit status to `ASSIGNED` and sends assignment notification to technician.

### FR-029: Visit Rescheduling & Grace Window Handling
- **Module:** MOD-06
- **Actor:** Customer, Service Manager
- **Description:** The system shall permit rescheduling a planned visit within the allowable contract grace window, recording the reason for postponement in the audit log.
- **Acceptance Criteria:**
  - Rescheduling outside the grace window triggers an SLA violation warning.

### FR-030: Overdue Visit Detection & Escalation
- **Module:** MOD-06
- **Actor:** System
- **Description:** A daily automated job shall scan all active visit schedules; any visit where `targetDate + gracePeriodDays < currentDate` and status is not `COMPLETED` shall be automatically transitioned to status `OVERDUE`.
- **Acceptance Criteria:**
  - Overdue visits are highlighted with visual alerts on manager and customer dashboards.

### FR-031: Single-Visit Ad-Hoc Scheduling
- **Module:** MOD-06
- **Actor:** Customer, Provider
- **Description:** The system shall allow creating one-off, non-contract visits for emergency inspections, refilling, or defect repairs resulting from an ad-hoc service request.
- **Acceptance Criteria:**
  - Follows the standard inspection and certification pipeline.

---

## 8. Module 7: Technician Field Workflow

### FR-032: Technician Visit Manifest & Briefing
- **Module:** MOD-07
- **Actor:** Provider (Technician)
- **Description:** Technicians shall view their daily assigned visit manifest on the mobile PWA, displaying site address, site contact, site emergency hazards, and target equipment count.
- **Acceptance Criteria:**
  - Manifest is pre-cached locally on the device for offline access.

### FR-033: Geofenced & GPS Check-In
- **Module:** MOD-07
- **Actor:** Provider (Technician)
- **Description:** Upon arriving at the customer site, the technician initiates "Check-In". The system captures device GPS coordinates, compares them against site coordinates, and validates whether the technician is within the designated geofence radius (e.g., 100m).
- **Acceptance Criteria:**
  - GPS coordinates, accuracy radius, and check-in timestamp are recorded.
  - If technician is outside geofence, system requires an explicit override note with reason.

### FR-034: Standardized Safety Checklist Execution
- **Module:** MOD-07
- **Actor:** Provider (Technician)
- **Description:** The technician must complete a structured, domain-specific checklist for each piece of equipment (e.g., Extinguisher: pressure gauge green-zone check, safety pin intact, nozzle clear, physical shell corrosion check, hydrostatic test date validity).
- **Acceptance Criteria:**
  - Required checklist fields cannot be bypassed.
  - Responses support boolean pass/fail, numeric values (e.g., bar pressure), and text notes.

### FR-035: Photographic Evidence Capture
- **Module:** MOD-07
- **Actor:** Provider (Technician)
- **Description:** The technician shall capture real-time photographic evidence of equipment condition, pressure gauge readings, and completed inspection tags directly through the PWA camera interface.
- **Acceptance Criteria:**
  - Photos are tagged with local timestamp and equipment identifier.
  - Offline images are compressed and stored locally in IndexedDB as blobs until network sync.

### FR-036: Customer On-Screen Signature Capture
- **Module:** MOD-07
- **Actor:** Provider (Technician), Customer
- **Description:** At the conclusion of the inspection, the PWA shall present an on-screen signature canvas where the on-site customer representative signs to acknowledge service completion.
- **Acceptance Criteria:**
  - Captures vector/base64 signature data with signer name and timestamp.
  - Signature is mandatory to transition visit to finalized completion.

### FR-037: Visit Completion & Summary Generation
- **Module:** MOD-07
- **Actor:** Provider (Technician)
- **Description:** The technician marks the visit as `COMPLETED`. The system bundles check-in metadata, checklist responses, photos, and signatures into an immutable `VisitRecord` payload.
- **Acceptance Criteria:**
  - Triggers cryptographic hash computation and transitions visit status to `COMPLETED`.

---

## 9. Module 8: Offline-First Operation & Synchronization

### FR-038: Local Visit Data Pre-Caching
- **Module:** MOD-08
- **Actor:** Provider (Technician), System
- **Description:** When the technician opens the PWA while connected to the internet, all assigned visits for the day—including customer site details, equipment registries, and checklist templates—are automatically synced and stored in local IndexedDB.
- **Acceptance Criteria:**
  - Technician can inspect and complete all assigned visits without any cellular or Wi-Fi connectivity.

### FR-039: Offline Action Queueing
- **Module:** MOD-08
- **Actor:** Provider (Technician), PWA
- **Description:** While offline, all technician actions (check-in, checklist entry, photo capture, signature) are stored locally in an IndexedDB `pendingSyncQueue` table, tagged with a client-generated UUID (Idempotency Key).
- **Acceptance Criteria:**
  - Actions remain safely stored across browser refreshes and device restarts.

### FR-040: Automatic Background Synchronization
- **Module:** MOD-08
- **Actor:** PWA (Sync Manager)
- **Description:** The PWA shall monitor network connection status via `navigator.onLine` and `window.addEventListener('online')`. Upon network restoration, the sync manager shall sequentially dispatch queued operations to the backend sync API.
- **Acceptance Criteria:**
  - Synchronization occurs without requiring user manual intervention.
  - UI displays an informative status banner: "Offline Mode (3 pending records)" → "Syncing..." → "All records synchronized".

### FR-041: Server-Side Idempotency & Duplicate Prevention
- **Module:** MOD-08
- **Actor:** Server (API Layer)
- **Description:** The server must validate the client-provided `idempotencyKey` on all sync submissions. If a submission with the same idempotency key was already committed, the server must acknowledge success (`HTTP 200 OK`) and return the existing record ID without duplicating database rows.
- **Acceptance Criteria:**
  - Repeated synchronization of the same offline visit record produces exactly one `VisitRecord` in PostgreSQL.

### FR-042: Sync Retry with Exponential Backoff
- **Module:** MOD-08
- **Actor:** PWA (Sync Manager)
- **Description:** In the event of transient network drops or HTTP 5xx server errors during sync, the client sync manager shall retry requests using exponential backoff with jitter (initial interval 2s, maximum 60s).
- **Acceptance Criteria:**
  - Prevents request storms while ensuring eventual consistency.

### FR-043: Manual Force-Sync Trigger
- **Module:** MOD-08
- **Actor:** Provider (Technician)
- **Description:** The PWA settings screen shall provide a manual "Synchronize Now" button allowing technicians to immediately trigger queue processing and view detailed sync log diagnostics.
- **Acceptance Criteria:**
  - Displays timestamp of last successful sync and count of pending queue items.

---

## 10. Module 9: Digital Trust & Verification

### FR-044: Cryptographic Record Hashing (SHA-256)
- **Module:** MOD-09
- **Actor:** Server (Trust Engine)
- **Description:** Upon visit completion, the server shall generate a canonical JSON string containing: visit ID, technician ID, site ID, check-in timestamp, GPS coordinates, serialized checklist responses, photo hashes, and customer signature hash. The server computes a SHA-256 cryptographic hash of this payload and stores it in `VisitRecord.recordHash`.
- **Acceptance Criteria:**
  - Any subsequent alteration of visit parameters will invalidate the cryptographic hash.

### FR-045: Digital Service Certificate Generation
- **Module:** MOD-09
- **Actor:** Server (Certificate Engine)
- **Description:** Following successful verification of a completed safety visit, the system shall automatically generate an official PDF `Certificate` bearing: unique certificate number (e.g., `CERT-2026-F0089`), customer name, site address, equipment inspected, inspection date, validity expiration date (next inspection due), issuing provider details, digital signature render, and an embedded verification QR code.
- **Acceptance Criteria:**
  - Generated PDF is securely stored in object storage and made downloadable for customer and provider.

### FR-046: Equipment QR Code Generation & Scanning
- **Module:** MOD-09
- **Actor:** Customer, Service Manager, Technician
- **Description:** The system shall generate printable QR codes for each registered piece of equipment. Technicians scanning an equipment QR code in the field shall be directly navigated to that asset's inspection form.
- **Acceptance Criteria:**
  - QR codes encode a secure asset URI: `servora://equipment/{equipmentId}` or web equivalent.

### FR-047: Public Read-Only Certificate Verification Portal
- **Module:** MOD-09
- **Actor:** Public Auditor, Fire Marshall, Building Inspector (Unauthenticated)
- **Description:** Scanning the QR code on a physical or digital Servora certificate shall navigate to a public, unauthenticated verification webpage (`/verify/{certificateId}`). The page verifies the cryptographic hash against the database and displays certificate validity status (`VALID`, `EXPIRED`, `REVOKED`).
- **Acceptance Criteria:**
  - Verification page loads without login or authentication.
  - Displays verification green badge, equipment summary, inspection date, and issuing provider.
  - Personal identifiable information (phone numbers, full billing details) is masked.

### FR-048: Tamper-Evident Historical Immutability
- **Module:** MOD-09
- **Actor:** System
- **Description:** Once a `VisitRecord` has reached `COMPLETED` state and a certificate has been issued, the record cannot be updated or deleted via any standard API endpoint (including admin endpoints).
- **Acceptance Criteria:**
  - API returns HTTP 409 Conflict if an update is attempted on a completed visit record.

### FR-049: Audit Event Logging
- **Module:** MOD-09
- **Actor:** System
- **Description:** The system shall log security-sensitive and compliance-critical events into an append-only `AuditEvent` table, capturing: timestamp, user ID, IP address, action type (e.g., `CHECK_IN`, `VISIT_COMPLETE`, `CERT_GENERATE`, `ROLE_CHANGE`), resource ID, and status.
- **Acceptance Criteria:**
  - Audit records cannot be modified or purged through application APIs.

---

## 11. Module 10: Dashboard, Reports & Compliance

### FR-050: Customer Compliance & Assets Dashboard
- **Module:** MOD-010
- **Actor:** Customer
- **Description:** The customer dashboard shall provide high-level visual summaries of: active contracts, upcoming scheduled visits, overdue equipment inspections, downloadable active certificates, and quick service request actions.
- **Acceptance Criteria:**
  - Highlights urgent equipment expiring within 30 days.

### FR-051: Service Manager Operational Dashboard
- **Module:** MOD-010
- **Actor:** Service Manager
- **Description:** The manager dashboard shall display real-time operational metrics: active contracts, today's visit dispatch queue, technician availability/location status, overdue visits requiring immediate intervention, and monthly completion rates.
- **Acceptance Criteria:**
  - Supports filtering by technician, site, and contract status.

### FR-052: Technician Daily Job Dashboard
- **Module:** MOD-010
- **Actor:** Provider (Technician)
- **Description:** Mobile-first dashboard for technicians displaying: today's assigned jobs, pending offline sync count, quick check-in button, and map directions to next site.
- **Acceptance Criteria:**
  - Fully readable and functional on small smartphone viewports.

### FR-053: Administrator Platform Dashboard
- **Module:** MOD-010
- **Actor:** Admin
- **Description:** Global view of platform user growth, provider verification backlog, total certificates issued, system sync health, and audit event feed.
- **Acceptance Criteria:**
  - Allows bulk approval/rejection of pending provider verifications.

### FR-054: Technician Performance & SLA Reporting
- **Module:** MOD-010
- **Actor:** Service Manager
- **Description:** The system shall aggregate technician metrics: total visits completed, on-time check-in percentage, average customer rating, and checklist completeness rate.
- **Acceptance Criteria:**
  - Computes `TechnicianScore` periodically for supervisor review.

---

## 12. Module 11: Notifications & Alerts

### FR-055: Visit Lifecycle Notifications
- **Module:** MOD-011
- **Actor:** Customer, Service Provider, Technician
- **Description:** The system shall record and deliver notification alerts on key lifecycle transitions: request accepted, visit assigned, technician checked in, visit completed, and certificate issued.
- **Acceptance Criteria:**
  - Notifications appear in user's in-app notification center.

### FR-056: Overdue Inspection Alerts
- **Module:** MOD-011
- **Actor:** Customer, Service Manager
- **Description:** The system shall generate automated alerts 14 days, 7 days, and 1 day prior to upcoming scheduled visits, as well as immediate critical alerts when a visit enters `OVERDUE` state.
- **Acceptance Criteria:**
  - Alerts are logged in `NotificationLog`.

### FR-057: In-App Notification Center
- **Module:** MOD-011
- **Actor:** All Users
- **Description:** Users shall have access to an in-app bell notification dropdown showing unread count, notification timestamps, direct links to related resources, and a "Mark as Read" action.
- **Acceptance Criteria:**
  - Real-time or polled badge count increments when new notifications arrive.

### FR-058: Notification Delivery Logging
- **Module:** MOD-011
- **Actor:** System
- **Description:** All dispatched notifications must be logged in `NotificationLog` with timestamp, channel (`IN_APP`, optional future `SMS`/`WHATSAPP`), recipient ID, message body, and delivery status (`SENT`, `FAILED`, `READ`).
- **Acceptance Criteria:**
  - Provides complete delivery audit trail.
