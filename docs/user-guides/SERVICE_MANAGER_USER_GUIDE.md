# Servora — Service Contractor Manager User Guide

**Target Audience:** Service Provider Operations Managers, Dispatchers, Compliance Supervisors  
**Authorized Role:** `SERVICE_MANAGER`  
**Portal Route:** `/dashboard`  

---

## 1. Overview & Operational Responsibilities

The `SERVICE_MANAGER` role provides operational control for certified fire-protection contracting companies (e.g. RedShield Fire & Safety Ltd). Managers oversee recurring maintenance agreements (AMCs), triage incoming customer defect tickets, dispatch certified technicians, monitor field completion progress, and review sealed regulatory inspection records.

---

## 2. Key Manager Capabilities

### 2.1 Contractor Operations Dashboard (`/dashboard`)
* **Contract Summary:** Active AMCs, total client facilities under contract, and renewal dates.
* **Technician Field Status:** Real-time visibility into assigned, in-progress, and completed visits for the current day.
* **SLA Performance:** Track compliance with contract turnaround times for critical repairs ($< 24\text{ hours}$).

### 2.2 Maintenance Contracts & AMCs (`/contracts`)
* View all recurring maintenance agreements executed with customer organizations.
* Inspect covered equipment assets and agreed inspection frequencies:
  * **Annual Inspection:** Full physical and hydrostatic assessment (NFPA 10).
  * **Semi-Annual:** Wet chemical kitchen hood suppression systems.
  * **Quarterly:** Fire hydrant pressure and flow tests.
  * **Monthly:** Quick-check pressure gauge and tamper seal verifications.

### 2.3 Reviewing Customer Defect Tickets (`/requests`)
1. Navigate to **Service Requests** (`/requests`).
2. Review incoming customer tickets with status `SUBMITTED`.
3. Assess urgency:
   * `CRITICAL`: Immediate technician dispatch required.
   * `HIGH`: Dispatch within 24 hours.
   * `MEDIUM` / `LOW`: Bundle into upcoming scheduled recurring visit.
4. Transition ticket state to `TRIAGED` or `DISPATCHED`.

### 2.4 Scheduling Visits & Dispatching Technicians (`/visits`)
1. Navigate to **Service Visits** (`/visits`).
2. Click **Schedule Visit**:
   * Select Target Facility Site.
   * Associate with active Contract or Service Request.
   * Select Visit Type: `RECURRING_MAINTENANCE`, `EMERGENCY_INSPECTION`, or `REPAIR_REFILL`.
   * Set Scheduled Target Date and SLA Due Date.
   * Assign a certified Field Technician from your roster.
3. Upon submission, the visit immediately populates the technician's mobile daily manifest.

### 2.5 Monitoring Field Progress & Immutability
* Track visit lifecycle: `ASSIGNED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.
* Once an inspection is submitted and cryptographically sealed with SHA-256, the visit is locked. Managers cannot revert status or alter inspection responses, ensuring tamper-proof compliance evidence.
