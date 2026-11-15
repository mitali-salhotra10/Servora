# Servora — Field Service Technician Mobile User Guide

**Target Audience:** Certified Field Service Technicians, Fire-Safety Inspectors  
**Authorized Role:** `SERVICE_PROVIDER` / `TECHNICIAN`  
**Mobile Portal Route:** `/visits/my-visits`  
**Offline Capability:** Fully functional without Wi-Fi or cellular connectivity  

---

## 1. Overview & Mobile-First Design

The Technician workflow is optimized for smartphones, rugged field tablets, and mobile browsers. It is built to operate reliably in underground boiler rooms, basement mechanical plants, and industrial complexes where cellular signals fail.

---

## 2. Step-by-Step Field Inspection Workflow

### Step 1: Accessing Your Daily Field Manifest
1. Open Servora on your mobile device (`http://localhost:5173`).
2. Log in using your technician credentials.
3. Your **Daily Manifest** automatically opens, listing all visits assigned to you for today, ordered by urgency and schedule.
4. Tap on the scheduled visit card to open the **Visit Execution Screen**.

### Step 2: Arriving On-Site & QR Identification
1. Upon arriving at the facility, tap **Scan QR Code**.
2. Point your camera at the physical QR code barcode affixed to the fire-safety asset.
   * *Manual Entry Fallback:* If the QR tag is faded or covered in paint, switch to the **Manual Entry** tab and enter the alphanumeric identifier (e.g. `SRV-EQ-APX-FE-001`).
3. The system instantly matches the asset against the facility's live registered inventory, displaying:
   * Equipment Type (e.g. Fire Extinguisher - 10lb ABC).
   * Manufacturer & Serial Number.
   * Last Inspection Date & Location Description.
   * *Cross-Site Safety Check:* If you scan an extinguisher belonging to a different building, the system immediately warns you and blocks cross-site recording.

### Step 3: Completing the Compliance Checklist
1. Inspect the physical unit according to the NFPA 10 / NFPA 72 checklist questions:
   * **Location & Visibility:** Unit is unobstructed and mounted at required height.
   * **Operating Instructions:** Nameplate legible and facing outward.
   * **Pressure Gauge Reading:** Check if needle is in the operational green zone ($13.5\text{–}15\text{ bar}$).
   * **Safety Seals & Pull Pins:** Tamper seal intact and pin firmly in place.
   * **Physical Damage:** Check for corrosion, denting, or nozzle blockage.
2. Tap **PASS** or **FAIL** for each item. If an item fails, enter specific defect notes.

### Step 4: Capturing Photographic Evidence
1. Tap **Add Photo** to capture proof of condition.
2. Choose:
   * **Before Inspection Photo:** Asset in-situ.
   * **Pressure Gauge Close-Up:** Showing needle in the green zone.
   * **Defect Proof:** Showing any physical corrosion or broken seal.
3. Photos are automatically compressed, validated against magic-byte spoofing, and stamped with SHA-256 ingress digests.

### Step 5: Signatures & Inspection Sealing
1. Present the screen to the on-site building facility manager or witness.
2. Enter the witness's full name (e.g. "Marcus Vance - Facilities Lead").
3. Have the client sign using finger touch or stylus in the digital signature pad.
4. Tap **Submit & Seal Inspection**.
5. The device captures GPS coordinates, computes a canonical SHA-256 seal, and transmits the payload to the server.
6. The visit status transitions to **COMPLETED** and is permanently write-locked.

---

## 3. Working Completely Offline (No Cellular Signal)

When working in basements or shielded structures:
1. **Pre-Cache Before Entering:** Open your manifest while still in cellular reception to ensure checklist templates are cached in IndexedDB.
2. **Inspect Normally Offline:** You can scan equipment, record checklist answers, take photos, and collect client signatures completely offline.
3. **Draft Recovery:** If your phone battery dies or the browser tab closes, your draft inspection is safely stored in local IndexedDB and restores automatically when reopened.
4. **Automatic Synchronization:** When you return to cellular range, the offline queue detects the `online` event, uploads the sealed payload, and removes it from the local sync queue.
