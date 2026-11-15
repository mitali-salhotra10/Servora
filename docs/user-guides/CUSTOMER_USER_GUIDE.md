# Servora — Customer & Facility Manager User Guide

**Target Audience:** Facility Managers, Corporate Real Estate Directors, Building Safety Officers  
**Authorized Role:** `CUSTOMER`  
**Portal Route:** `/dashboard`  

---

## 1. Overview & Tenant Boundaries

The `CUSTOMER` role is tailored for organizations that own, lease, or manage physical properties requiring fire-safety and life-safety regulatory compliance. 

All customer data is **strictly tenant-isolated**. Customers can only view and manage facilities, equipment, maintenance contracts, service requests, inspection histories, and compliance certificates that belong exclusively to their own registered organization.

---

## 2. Key Customer Capabilities

### 2.1 Customer Dashboard (`/dashboard`)
* **Facility Compliance Cards:** Visual summary of all facilities with operational status badges.
* **Inspection Status:** Counts of compliant equipment, units requiring maintenance, and upcoming inspection due dates.
* **Quick Actions:** One-click shortcuts to Add Facility, Register Equipment, or Raise Service Request.

### 2.2 Facility Management (`/sites`)
* **Add a Facility:** Click **Add Facility** (`/sites/new`) to register a new building:
  * Facility Name (e.g. "Apex Commercial Tower").
  * Physical street address, city, state, postal code.
  * Latitude & Longitude coordinates (used for technician geofence verification).
  * Geofence Radius (default 150 meters).
  * On-site emergency contact name and phone number.
* **Inspect Facility Assets:** Click on any facility to open [`SiteDetailPage`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/frontend/src/pages/SiteDetailPage.tsx). View all fire extinguishers, hydrants, and alarms registered at that address.

### 2.3 Fire-Safety Equipment Inventory
* Register equipment with unique QR barcode identifiers.
* Categorize equipment by type:
  * **Fire Extinguishers:** ABC Dry Chemical, CO2, Water Mist, Clean Agent.
  * **Fire Hydrants:** Class I, Class II, Class III, Yard Hydrants.
  * **Fire Alarm Panels:** Addressable or Conventional Control Units.
  * **Detectors & Sensors:** Smoke, Heat, Duct, or Flame Detectors.
* Track last inspection date and next due date calculated automatically under NFPA guidelines.

### 2.4 Raising a Service Request (`/requests`)
When on-site staff discover a damaged unit, discharged extinguisher, or alarm trouble indicator:
1. Navigate to **Service Requests** in the sidebar.
2. Click **Create Request**.
3. Select the affected facility and equipment asset.
4. Set Urgency: `LOW` (Routine), `MEDIUM` (Inspection defect), `HIGH` (Discharged unit), or `CRITICAL` (Alarm system failure).
5. Specify preferred date and preferred time slot (`MORNING_09_12` or `AFTERNOON_13_17`).
6. Enter descriptive notes and submit.
7. Track real-time status transitions: `SUBMITTED` $\rightarrow$ `TRIAGED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RESOLVED`.

### 2.5 Accessing Compliance Certificates (`/certificates`)
* View all regulatory compliance certificates issued following completed technician inspections.
* Download official PDF certificates complete with scannable QR verification badges.
* Share certificate numbers with local fire marshals, insurance underwriters, or corporate compliance auditors.
