# Servora — Administrator User Guide

**Target Audience:** Platform System Administrators, Security Compliance Officers  
**Authorized Role:** `ADMIN`  
**Portal Route:** `/dashboard`  

---

## 1. Overview & Administrative Authority

The `ADMIN` role possesses global cross-tenant visibility and administrative governance across the entire Servora ecosystem. Administrators monitor overall platform health, oversee customer and contractor organizations, inspect regulatory compliance certificates, and audit immutable system security events.

---

## 2. Navigating the Admin Console

### 2.1 Platform Operational Dashboard
* **Metrics Overview:**
  * **Total Organizations:** Aggregated count of registered customer corporate accounts and service provider contractor companies.
  * **Total Facilities:** Global count of registered buildings, hospitals, and campuses.
  * **Inspections Performed:** Total volume of completed, cryptographically sealed inspection records.
  * **Active AMCs:** Total active maintenance agreements currently in force.
* **System Health Monitor:**
  * Real-time PostgreSQL database connectivity state and round-trip query latency.
  * Node.js server uptime, process memory, and runtime version (`v22.20.0`).

### 2.2 Organization & Tenant Governance (`/tenants`)
* View all customer accounts and service provider profiles.
* Inspect contractor licensing numbers and compliance status.
* Audit user accounts and assigned roles across organizations.

### 2.3 Facilities & Asset Directory (`/sites`)
* Global directory of all facilities registered across all customer tenants.
* Filter by city, status, and equipment volume.
* Inspect individual building floor plans and equipment registries.

### 2.4 Security & Audit Trail (`/admin/audit-logs`)
* Immutable review of all security events:
  * Successful user logins and logouts.
  * Cross-tenant unauthorized access attempts (IDOR defense triggers).
  * Inspection submissions and tamper detection alerts.
  * Certificate issuance events.

---

## 3. Step-by-Step Administrative Workflows

### 3.1 Verifying Platform Health
1. Log in to the Servora console using authorized Admin credentials.
2. Navigate to **System Health** in the sidebar.
3. Verify that the database status displays **CONNECTED** and latency is $< 2500\text{ms}$.
4. Review the database probe endpoint at `http://localhost:5000/ready`.

### 3.2 Reviewing a Regulatory Audit Event
1. Navigate to **Audit Logs** (`/admin/audit-logs`).
2. Search by Action (e.g. `INSPECTION_SUBMITTED`, `TAMPER_ALARM`).
3. Expand the event record to view the canonical user ID, client IP address, and timestamp.
