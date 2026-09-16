# Servora — MoSCoW Priority Classification

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  
**Purpose:** Defines the scope boundaries and implementation sequence for the semester MVP using the MoSCoW prioritization framework.

---

## 1. Overview of the MoSCoW Framework in Servora

To guarantee a successful, timely, and rock-solid semester delivery, project requirements are categorized into four distinct prioritization tiers:
- **MUST HAVE (M):** Non-negotiable baseline. Without these, the project is considered non-functional and fails compliance.
- **SHOULD HAVE (S):** Critical value-add capabilities expected in a complete commercial-grade MVP, deferred only if severe timeline constraints arise.
- **COULD HAVE (C):** High-utility enhancements that improve usability and operational automation if core development completes ahead of schedule.
- **WON'T HAVE FOR MVP (W):** Explicitly out of scope for the current semester release to protect architectural focus and project completion.

---

## 2. MUST HAVE (Semester Baseline Scope)

These features represent the foundational core of Servora. A release without any of these capabilities cannot function as a trusted field-service platform:

| Requirement Area | Detailed Scope | Functional Req Mapping | Non-Functional Req Mapping |
| :--- | :--- | :--- | :--- |
| **Authentication** | Registration, login, logout, password hashing (`bcrypt`), JWT token issuance. | FR-001, FR-002, FR-004, FR-005 | NFR-005 |
| **Authorization** | Server-side Role-Based Access Control (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`). | FR-003, FR-006 | NFR-006 |
| **Customer & Provider Management** | Customer profiles, facility sites, provider profiles, trade credentials, service definitions. | FR-007, FR-008, FR-012, FR-013 | NFR-023 |
| **Service Requests** | Request submission, provider discovery, acceptance/rejection lifecycle, status tracking. | FR-017, FR-018, FR-020, FR-021 | NFR-014 |
| **Contracts Management** | Maintenance contracts (AMC/QMC), start/end dates, service frequencies, grace periods, status lifecycle. | FR-022, FR-023, FR-024, FR-025 | NFR-021 |
| **Automatic Scheduling** | Automated recurring visit slot generation, manager technician dispatch, overdue visit transition. | FR-027, FR-028, FR-030, FR-031 | NFR-014, NFR-025 |
| **Technician Workflow** | Technician daily visit list, structured inspection forms, check-in, visit completion. | FR-032, FR-034, FR-037 | NFR-013, NFR-019 |
| **Checklist Execution** | Fire extinguisher, hydrant, and alarm standardized safety checklists with validation. | FR-034 | NFR-013 |
| **Photo & Signature Evidence** | Field camera photo capture, on-screen customer signature capture, local blob persistence. | FR-035, FR-036 | NFR-001, NFR-016 |
| **Offline Operation** | PWA offline capability, service worker caching, IndexedDB local persistence of visits & checklists. | FR-038, FR-039 | NFR-001, NFR-002 |
| **Synchronization** | Background sync manager, online/offline detection, retry with exponential backoff. | FR-040, FR-042, FR-043 | NFR-004 |
| **Idempotency** | Client-generated UUID keys, server-side duplicate check, replay safety without duplicate visits. | FR-041 | NFR-003 |
| **Digital Proof (Cryptographic Hash)**| Canonical visit payload serialization and SHA-256 tamper-evident record hashing. | FR-044, FR-048 | NFR-010, NFR-011 |
| **Dashboard & Basic Compliance** | Role-tailored dashboards (Customer, Manager, Technician), active contract & visit metrics. | FR-050, FR-051, FR-052 | NFR-014 |

---

## 3. SHOULD HAVE (High-Priority MVP Enhancements)

Capabilities that elevate Servora into a high-trust, production-ready solution:

| Requirement Area | Detailed Scope | Functional Req Mapping | Non-Functional Req Mapping |
| :--- | :--- | :--- | :--- |
| **Geofenced Check-in** | Device GPS coordinate acquisition, site distance calculation, geofence radius validation (100m). | FR-033 | NFR-014 |
| **Digital Certificates** | Automated PDF compliance certificate generation with inspection findings and provider signature. | FR-045 | NFR-018 |
| **Public Certificate Verification** | Public read-only verification portal accessible via QR link (`/verify/:id`) with PII masking. | FR-047 | NFR-007, NFR-017 |
| **Service History** | Consolidated customer and provider chronological service history, filtering by site and equipment. | FR-010 | NFR-014, NFR-025 |
| **Ratings & Reviews** | Post-visit customer star ratings (1-5) and qualitative feedback updating provider reputation. | FR-011 | NFR-014 |
| **Accessibility Improvements** | High-contrast UI theme for outdoor sunlight readability, WCAG 2.1 AA compliance, 48px touch targets. | FR-052 | NFR-019, NFR-020 |

---

## 4. COULD HAVE (Desirable Extensions If Ahead of Schedule)

Useful features that provide additional convenience if time permits after Must and Should tiers are solidified:

| Requirement Area | Detailed Scope | Functional Req Mapping | Implementation Feasibility |
| :--- | :--- | :--- | :--- |
| **QR Equipment Tags** | Unique QR codes on fire extinguishers and hydrants scanned via camera to jump directly into inspection form. | FR-009, FR-046 | High feasibility; relies on HTML5 QR scanner library. |
| **WhatsApp / SMS Notifications** | Direct SMS/WhatsApp alerts for visit reminders and urgent overdue warnings (Twilio or similar mock provider). | FR-056, FR-058 | Medium feasibility; external gateway mock required. |
| **Technician Performance Score**| Algorithmic calculation of technician on-time rate, checklist accuracy, and customer satisfaction score. | FR-054 | High feasibility; pure backend calculation. |
| **Advanced Operational Analytics** | Trend charts for equipment failure rates, refill frequency patterns, and contract renewal forecast. | FR-051, FR-053 | Low priority; dashboard visual chart enhancement. |

---

## 5. WON'T HAVE FOR CURRENT MVP (Explicitly Out of Scope)

The following items are intentionally deferred to post-semester releases to avoid scope creep and ensure core system integrity:

1. **Automatic Renewal Recommendations & Predictive Machine Learning:**
   - *Rationale:* Requires extensive historical maintenance training data that does not exist in an initial MVP.
2. **Intelligent Route Optimization & Turn-by-Turn GPS Navigation:**
   - *Rationale:* External mapping routing engines (e.g., Google Maps Directions API) introduce third-party billing and complexity; basic deep linking to native maps suffices.
3. **Expansion to Unrelated Service Domains:**
   - *Rationale:* Generalizing into home cleaning, plumbing, or electrical dilutes the safety-compliance focus and checklist rigor required for fire-safety.
4. **Complex Marketplace Payment & Commission Settlement:**
   - *Rationale:* Payment gateway onboarding, escrow holding, and automated tax withholding create heavy regulatory overhead without adding to the core field-trust engineering evaluation. Simple record-keeping of billing terms is maintained instead.
5. **Municipal Emergency Services Dispatch Integration:**
   - *Rationale:* Direct API integration with municipal fire departments is legally restricted and outside the bounds of academic implementation.

---

## 6. Traceability Matrix Summary

```
========================================================================
TOTAL FUNCTIONAL MODULES: 11
========================================================================
- MUST HAVE FEATURES:       14 Key Subsystems  (~65% total effort)
- SHOULD HAVE FEATURES:      6 Key Capabilities (~20% total effort)
- COULD HAVE FEATURES:       4 Key Enhancements (~15% total effort)
- WON'T HAVE (OUT OF SCOPE): 5 Major Areas      (0% current effort)
========================================================================
```
