# Servora — Inspection Record Integrity & Cryptographic Sealing

**Document Version:** 1.0.0  
**Mathematical Foundation:** Deterministic Canonical UTF-8 JSON + SHA-256 Digest Hashing  
**Regulatory Context:** NFPA 10 / NFPA 72 Life-Safety Legal Non-Repudiation  

---

## 1. Why Cryptographic Sealing Is Required

In fire protection and building safety compliance, inspection records serve as legal evidence during fire marshal audits, insurance underwriting claims, and municipal fire code reviews. 

If inspection records can be silently edited, dates modified, or pass/fail flags altered after a visit is completed, the records lose evidential value. Servora enforces mathematical immutability and non-repudiation:
* Every completed inspection generates a **SHA-256 cryptographic seal**.
* Any byte modification to the checklist responses, pressure measurements, equipment IDs, timestamps, or signatures alters the resulting digest, immediately triggering a tamper alarm.

---

## 2. Canonical JSON Serialization Algorithm

Standard `JSON.stringify` does not guarantee key ordering across JavaScript runtime engines or language implementations. To ensure that the client and server compute identical cryptographic digests from identical data:

```typescript
function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalizeJson(obj[key]);
  });
  return '{' + pairs.join(',') + '}';
}
```

### Sealing Payload Schema
The sealed payload contains:
1. `visitScheduleId`: Target visit identifier.
2. `equipmentResponses`: Array of checklist items, sorted by `equipmentId`.
3. `checkInCoordinates`: Exact GPS coordinates verified against site geofence.
4. `customerSignerName` & `customerSignatureData`: Base64 signature vector.
5. `completedAt`: ISO 8601 completion timestamp.

The SHA-256 digest of this canonical string is calculated and permanently stored in `VisitRecord.recordHash`.

---

## 3. Completed Visit Immutability Write-Locks

Once a visit status reaches `COMPLETED`, the domain layer in [`backend/src/services/visit.service.ts`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/backend/src/services/visit.service.ts) locks the record against mutation:
* `updateVisitStatus`: Rejects attempts to revert status (e.g. from `COMPLETED` back to `IN_PROGRESS`) with `HTTP 400 Bad Request: "Cannot revert status of an already completed visit"`.
* `assignTechnician`: Rejects attempts to reassign technician on completed visits with `HTTP 400 Bad Request: "Cannot reassign technician for an already completed visit"`.
* Role enforcement: Only `SERVICE_MANAGER` or `ADMIN` can initiate visit state transitions.

---

## 4. Public Certificate Verification & PII Sanitization

Every compliant inspection can generate a verifiable compliance certificate (`Certificate`). Each certificate includes:
* **Unique Certificate Number:** e.g. `CERT-2026-APEX-001`.
* **Public QR Code:** Directs to `http://localhost:5173/verify/:certificateNumber`.
* **Cryptographic Verification:** The public endpoint re-computes and verifies the `verificationHash` against the persisted `VisitRecord.recordHash`.

### PII Masking Standards
To comply with corporate privacy and security policies, the public portal scrubs sensitive data:
* **Site Name:** Masked partially (e.g. `MetroHea - Unit ***`).
* **Customer Organization:** Stripped from public view.
* **Contractor Financials & Technician Details:** Completely omitted.
* **Public Visibility:** Only Certificate Number, Status (`VALID` / `EXPIRED`), Compliance Verdict (`COMPLIANT`), and Cryptographic Hash are displayed.
