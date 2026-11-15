# Servora — Offline-First & Synchronization Architecture

**Document Version:** 1.0.0  
**Target Environment:** Mobile Field Operations / Subterranean Plant Rooms / High-Rise Basements  
**Client Storage Engine:** Dexie.js 4.4.7 (IndexedDB Wrapper)  
**Reliability Standard:** Zero Inspection Data Loss Under Network Severance

---

## 1. The Offline-First Imperative

Fire protection technicians operate in subterranean mechanical spaces, stairwells, industrial boiler rooms, and hospital basements where cellular connectivity is frequently absent. An inspection workflow that requires a constant network connection is unsuitable for life-safety maintenance.

Servora implements an **offline-first local database** architecture:
* Checklists, equipment data, and assigned visits are cached in local browser storage before entering dead zones.
* All inspection responses, pressure readings, defect notes, and SVG digital signatures are committed to local IndexedDB storage before any network transmission is attempted.
* When connectivity is re-established, a synchronization engine dispatches queued payloads idempotently.

---

## 2. Dexie.js Database Structure

Located at [`frontend/src/db/offline.db.ts`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/frontend/src/db/offline.db.ts), Servora initializes `ServoraOfflineDB` version 1 with five dedicated stores:

```typescript
this.version(1).stores({
  visits: 'id, siteId, assignedTechnicianId, status, targetDate',
  checklists: 'id, domainCategory, version',
  responses: 'id, visitRecordId, equipmentId',
  evidence: 'id, visitRecordId, equipmentId, fileType, syncStatus',
  syncQueue: 'idempotencyKey, visitScheduleId, status, createdAt, retryCount'
});
```

### Store Descriptions
1. **`visits`:** Assigned daily visits cached for offline inspection access.
2. **`checklists`:** Standardized NFPA 10 and NFPA 72 checklist templates.
3. **`responses`:** In-progress inspection answers, pressure readings, and defect notes.
4. **`evidence`:** Metadata and base64 payloads of inspection photos captured while offline.
5. **`syncQueue`:** Outbound queue tracking inspection submissions awaiting network synchronization.

---

## 3. Synchronization Lifecycle & State Machine

```
[Field Inspection Completed]
              │
              ▼
   [Write to Dexie IndexedDB] ───────────► Local State: PENDING_SYNC
              │
              ├─► Is Device Online?
              │     ├── YES: Dispatch Immediately
              │     └── NO:  Queue in syncQueue; Wait for 'online' event
              ▼
   [POST /api/v1/visits/:id/inspections]
              │
              ├──► HTTP 201 Created:
              │      - Transition Local State to SYNCED
              │      - Remove payload from syncQueue
              │      - Persist server-computed SHA-256 seal
              │
              ├──► HTTP 200 OK (Idempotent Duplicate):
              │      - Submission was already committed by server
              │      - Remove from syncQueue safely; do not recreate rows
              │
              ├──► HTTP 409 Conflict:
              │      - Visit was already completed by another record
              │      - Flag conflict in UI for manager review; preserve local draft
              │
              └──► Network Error / Server 500:
                     - Increment `retryCount`
                     - Transition state to `RETRYING`
                     - Exponential backoff retry upon next online pulse
```

---

## 4. Idempotency & Conflict Handling

* **Idempotency Keys:** Every inspection payload is stamped with a client-generated UUID v4 idempotency key (`idempotencyKey`). If an upload is interrupted or duplicated by the browser's retry logic, the backend identifies the duplicate key:
  * Returns `HTTP 200 OK` with `isDuplicate: true`.
  * Preserves the original `recordHash` and database state.
  * Prevents duplicate certificate generation or double-counting inspection counts.
* **Visit Write-Locks:** If a technician attempts to submit an inspection for a visit that has already reached `COMPLETED` status with a different record, the server returns `HTTP 409 Conflict`, preventing silent overwrites.
