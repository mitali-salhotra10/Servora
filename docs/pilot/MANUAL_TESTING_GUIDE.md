# Servora — Manual Field Testing & Demonstration Guide

**Target Environment:** Local Workspace (`http://localhost:5173`) + Mobile Smartphone / Tablet  
**Backend Endpoint:** `http://localhost:5000`  
**Prerequisites:** Backend running (`npm run dev:backend`), Frontend running (`npm run dev:frontend`)

---

## 1. Authorized Pilot & Development Accounts

The synthetic database seed provides four authorized accounts representing the four platform roles:

| Role | Authorized Email Account | Organization | Key Responsibility |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin@servora.app` | Servora Global Platform | Global governance, audit logs, system health |
| **`CUSTOMER`** | `facilities@apexcommerce.com` | Apex Commercial Properties | Facility management, equipment tracking, defect tickets |
| **`SERVICE_MANAGER`** | `manager@redshieldfire.com` | RedShield Fire & Safety Ltd | Contractor dispatch, AMC monitoring, visit scheduling |
| **`TECHNICIAN`** | `tech.davis@redshieldfire.com` | RedShield Fire & Safety Ltd | Mobile field inspections, QR scanning, offline sync |

> [!NOTE]
> All seeded accounts share the standard development password configured in `backend/prisma/seed.ts` (e.g. `Password123!`).

---

## 2. Step-by-Step Manual Testing Scenarios

### Scenario 1: Customer Defect Reporting Workflow
1. Navigate to `http://localhost:5173/login`.
2. Log in as Customer (`facilities@apexcommerce.com`).
3. Click on **Facilities** (`/sites`). Observe that only Apex properties are visible.
4. Click **Apex West Retail Plaza**, then click on an asset (e.g. `FIRE_EXTINGUISHER`).
5. Click **Raise Request** (`/requests`).
6. Select Urgency: `HIGH`. Enter description: `"Gauge needle dropped below 10 bar."`.
7. Submit the request. Notice the new ticket number `SR-XXXXXXXX` with status `SUBMITTED`.
8. Log out.

### Scenario 2: Service Manager Dispatch Workflow
1. Log in as Service Manager (`manager@redshieldfire.com`).
2. Notice the incoming service request in **Service Requests** (`/requests`).
3. Navigate to **Service Visits** (`/visits`) $\rightarrow$ Click **Schedule Visit**:
   * Facility: Select `Apex West Retail Plaza`.
   * Type: `EMERGENCY_INSPECTION`.
   * Associated Request: Select the ticket raised in Scenario 1.
   * Assign Technician: Select `Marcus Davis`.
4. Click **Schedule & Dispatch**.
5. Log out.

### Scenario 3: Technician Mobile Field Execution Workflow
1. Log in as Technician (`tech.davis@redshieldfire.com`).
2. The **Daily Manifest** (`/visits/my-visits`) displays the newly assigned visit.
3. Tap on the visit card $\rightarrow$ Click **Execute Inspection**.
4. Tap **Scan QR Code** and simulate/test optical camera scanning or enter tag `SRV-EQ-APX-FE-001`.
5. Fill out the compliance checklist questions. Ensure pressure is recorded in green zone.
6. Add a photo (before inspection).
7. Collect on-site customer signature in the signature canvas pad.
8. Click **Submit & Seal Inspection**.
9. The visit transitions to `COMPLETED` and the cryptographic hash seal is displayed.

### Scenario 4: Public Compliance Certificate Verification
1. Open an incognito browser window (logged out).
2. Navigate to `http://localhost:5173/verify`.
3. Enter certificate number `CERT-2026-APEX-001` (or click the QR link from a completed certificate).
4. Observe the public verification portal:
   * Status is displayed as **COMPLIANT** and **VALID**.
   * Site Name is partially masked (`Commercial Facility - Sector 18, Unit ***`).
   * Customer and technician contact PII are scrubbed.
   * Cryptographic SHA-256 seal is verified against the database.

---

## 3. Physical Device Testing (Hardware-Specific Checks)

| Feature | Physical Hardware Test Procedure | Expected Result |
| :--- | :--- | :--- |
| **Camera QR Scanner** | Open Servora on a smartphone connected to local Wi-Fi (`http://<LAN-IP>:5173`). Grant camera permissions and scan a printed QR code. | Camera video stream opens in modal; barcode decoder identifies asset instantly. |
| **GPS Geofencing** | Submit an inspection from a physical phone. Compare device coordinates to facility latitude/longitude. | If within 150m, server records `isGeofenceVerified: true`. If outside, server overrides to `false`. |
| **Airplane Mode Offline Sync** | Enable Airplane Mode on phone. Complete an inspection and tap Submit. Turn Airplane Mode off. | Submission stores in IndexedDB with status `PENDING_SYNC`. Upon reconnecting, sync engine auto-submits. |
