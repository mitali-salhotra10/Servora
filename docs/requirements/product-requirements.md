# Servora — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  
**Domain Focus:** Fire-Safety Field-Service & Digital Verification Platform  

---

## 1. Executive Summary & Product Positioning

**Servora** is a trusted digital field-service platform engineered to bridge customers requiring specialized maintenance with certified local service providers, while enforcing an immutable, verifiable digital record of every completed service.

In traditional field-service marketplaces, platforms function purely as discovery and booking engines (matching customers to technicians). Servora fundamentally redefines this model: **discovery is merely the entry point; the primary value proposition is the verifiable, tamper-evident field workflow and digital compliance audit trail.**

For the semester implementation, Servora focuses on the critical **fire-safety servicing domain**, covering:
- **Fire Extinguishers:** Scheduled hydrostatic pressure testing, refilling, seal checks, pressure gauge inspection, physical damage audits, and compliance tag updates.
- **Fire Hydrants:** Static/flow pressure tests, valve lubrication, hose coupling inspection, flushing, and obstruction clearance checks.
- **Fire Alarm & Detection Systems:** Smoke/heat detector response tests, control panel battery backup checks, manual call point verification, and audible notification appliance audits.
- **Recurring Maintenance & Compliance Contracts:** Annual and quarterly maintenance contracts (AMC/QMC) with automated scheduling, grace periods, and regulatory compliance records.

Servora is purposefully built to support **independent service technicians, small service teams, and specialized maintenance businesses**, eliminating the unrealistic assumption that every qualified technician is part of an enterprise corporation.

```
CUSTOMER
   ↓
SERVORA PLATFORM
   ↓
LOCAL SERVICE PROVIDER / TECHNICIAN
   ↓
STANDARDIZED FIELD SERVICE
   ↓
SECURE DIGITAL PROOF & CERTIFICATION
```

---

## 2. Problem Statement & Industry Context

### 2.1 The Reality of Local Field Service
In current fire-safety and facilities maintenance practices, routine inspections and preventative maintenance are overwhelmingly executed via fragmented, ad-hoc mechanisms:
- Phone calls and unlogged WhatsApp communications.
- Paper checklists attached to equipment clipboards or physical tags easily damaged, lost, or forged.
- Disconnected spreadsheets managed independently by clients and vendors.
- Field photographs kept haphazardly in technicians' personal smartphone galleries without verifiable location or timestamp proof.
- Informal, calendar-free scheduling reliant on human memory or post-dated calendar reminders.

### 2.2 Core Operational Failures
1. **Missed Service Visits:** Regulatory standards mandate strict inspection intervals (e.g., quarterly, annual). Without automated contract-aware schedules, visits are chronically missed or executed late.
2. **"Drive-By" Servicing & Lack of Accountability:** Customers and facility managers struggle to verify whether a technician actually inspected the hardware, refilled the extinguisher, or simply signed a cardboard tag at the reception desk.
3. **Scattered and Disputed Evidence:** When audits or fire safety inspections occur, building owners are unable to produce consolidated, tamper-evident proof of prior inspections, leading to fines or insurance claim rejections.
4. **Offline Field Realities:** Basements, plant rooms, high-rise stairwells, remote industrial facilities, and underground car parks rarely have reliable cellular data. Standard cloud-only apps fail or lose entered checklist data in these environments.
5. **Vulnerability to Forgery:** Paper inspection tags and standard digital receipts can be easily fabricated, duplicated, or altered retroactively.

---

## 3. Product Vision: The Servora Trust Chain

Servora resolves these operational failures through an architectural concept called **The Servora Trust Chain**. Every unit of service executed on the platform passes through a cryptographically anchored pipeline:

```
[Service Request / Contract]
            ↓
   [Provider / Assigned Tech]
            ↓
    [Scheduled Visit Slot]
            ↓
  [Verified Geofenced Check-In]
            ↓
[Equipment QR Tag Scan & Identification]
            ↓
[Standardized Safety Checklist Execution]
            ↓
  [Tamper-Evident Photo & Meter Proof]
            ↓
   [Customer Digital Signature Sign-Off]
            ↓
  [Immutable Timestamp & SHA-256 Record Hash]
            ↓
   [Cryptographic Digital Certificate]
            ↓
[Public Read-Only QR Verification Portal]
```

### Key Differentiators vs. Generic Gig Marketplaces
| Dimension | Generic Marketplace (e.g., Urban Company) | Servora Digital Field-Service Platform |
| :--- | :--- | :--- |
| **Primary Goal** | One-off lead generation & booking | Continuous lifecycle compliance & proof of service |
| **Target Service** | Consumer cleaning, grooming, simple repair | High-stakes safety equipment inspection & maintenance |
| **Field Verification** | Basic OTP at start | GPS check-in, QR equipment tagging, structured checklist |
| **Proof of Work** | Subjective customer rating | Photo evidence, pressure readings, customer signature |
| **Output** | Payment invoice | Formal compliance certificate with cryptographic verification |
| **Network Resilience** | Requires active internet connection | **Offline-First PWA:** Full offline checklist & idempotent sync |
| **Contract Support** | Rarely supports AMCs | Native recurring contracts with automated visit generation |

---

## 4. Target User Personas & Roles

### 4.1 Customer (Facility Owner, Business Manager, Homeowner)
- **Profile:** Manages a commercial building, retail store, warehouse, or residential property requiring compliant fire-safety assets.
- **Pain Point:** Worried about missing compliance deadlines, failing audits, or paying for inspections that were never properly conducted.
- **Key Needs:** Seamless service booking, recurring contract overview, real-time visit tracking, instant download of compliance certificates, public certificate verification link for safety inspectors.

### 4.2 Service Provider (Independent Technician / Small Shop)
- **Profile:** Certified independent fire extinguisher technician, small refilling workshop, or local safety installer.
- **Pain Point:** Drowning in WhatsApp messages, paper job cards, delayed customer payments, and customer disputes regarding past service visits.
- **Key Needs:** Clean schedule view, mobile-optimized offline checklist, digital signature capture on phone screen, automated generation of professional service certificates.

### 4.3 Service Manager (Supervisor / Operations Lead)
- **Profile:** Manages a team of 3 to 15 field technicians across a metropolitan area.
- **Pain Point:** Lack of visibility into technician field whereabouts, SLA compliance, overdue visits across dozens of commercial contracts.
- **Key Needs:** Multi-technician dispatch, contract renewal tracking, overdue visit alerts, team performance metrics, centralized equipment inventory audits.

### 4.4 Administrator (Platform Administrator)
- **Profile:** System operator overseeing the platform's health, user authorization, and domain parameters.
- **Key Needs:** System auditing, provider verification vetting, category/checklist template governance, global security monitoring.

---

## 5. Scope of the Semester Implementation

### 5.1 In-Scope (Phase 1 Baseline)
1. **Fire-Safety Domain Specifics:**
   - Pre-configured inspection checklists for Class A/B/C/D fire extinguishers, dry powder, CO2, clean agent, hydrants, hoses, alarm control panels, and detectors.
   - Equipment registry per site (serial number, type, capacity, last test date, location within facility).
2. **Role-Based Workflows:** Customer, Independent Service Provider, Service Manager, and Admin dashboards and capabilities.
3. **Contract-Aware Visit Scheduling:** Creation of 6-month or 1-year maintenance contracts that automatically generate quarterly/annual visit schedules.
4. **Offline-First Technician PWA:** Complete field execution (GPS check-in, checklist, photo capture, signature capture) functional without active internet, caching locally in IndexedDB with idempotent synchronization upon reconnect.
5. **Digital Trust & Certificate Generation:** Creation of tamper-evident visit summaries, SHA-256 payload hashing, PDF compliance certificate generation, and public read-only verification route accessible via QR code.

### 5.2 Out-of-Scope for Current MVP (Deferred to Future Releases)
- Complex payment gateway integration and automated commission settlement (invoices generated for record purposes; monetary transfer out of scope).
- Live turn-by-turn technician route optimization algorithms.
- Multilingual audio-guided checklist interfaces.
- Broad expansion into non-safety domains (HVAC, plumbing, electrical).
- Integration with municipal emergency dispatch systems.

---

## 6. High-Level System Quality Objectives

1. **Zero Data Loss in Field Operations:** Any checklist response, photo, or signature captured while disconnected from the network must persist safely in local storage and synchronize idempotently without duplicate record creation.
2. **Tamper-Evident Records:** Once a visit is finalized and cryptographically hashed, no field user (customer or technician) can modify historical inspection data retroactively.
3. **Public Audit Transparency:** Any building inspector or third-party insurer scanning the QR code on a Servora certificate must be able to verify the certificate's validity instantly without needing an account, while ensuring customer personal data is masked.
4. **Sub-Second Offline Response:** Form transitions, checklist item toggles, and local photo persistence in the PWA must execute with zero network-induced UI lag.
