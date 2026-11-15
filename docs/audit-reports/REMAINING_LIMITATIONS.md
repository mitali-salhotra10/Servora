# Servora — Remaining Limitations & Production Roadmap
**Document ID:** DOC-SERVORA-LIM-001  
**Project:** Servora B2B Fire-Safety Maintenance & Compliance Management Platform  
**Execution Stage:** Final Master Execution  
**Status:** INFORMATIONAL / ROADMAP  

---

## 1. Overview

This document provides a transparent, technical assessment of the operational boundaries and remaining technical trade-offs present in the current Servora codebase. While the platform is fully functional, secure, and ready for pilot deployment, scaling beyond single-instance pilot environments requires addressing the following architectural items.

---

## 2. Infrastructure & Architectural Boundaries

### 2.1 In-Memory Rate Limiting
- **Current Implementation:** Rate limiting on `/api/v1/auth/*` and public verification endpoints is managed in-memory using `express-rate-limit`.
- **Limitation:** In-memory counters are local to a single Node.js process. When scaling horizontally across multiple backend instances behind a round-robin load balancer, client rate-limit counters are partitioned across processes, allowing higher request volumes than intended.
- **Production Recommendation:** Integrate a centralized Redis cluster using `rate-limit-redis` or an API Gateway (e.g., Cloudflare, AWS API Gateway) to maintain global rate-limit state.

### 2.2 Local Filesystem Uploads vs. Object Storage
- **Current Implementation:** Uploaded photographic inspection evidence and signatures are stored on the local filesystem under `backend/uploads/`.
- **Limitation:**
  - Local disk storage is ephemeral in containerized cloud environments (AWS ECS Fargate, Google Cloud Run, Kubernetes). Containers restarting will lose uploaded files unless backed by persistent volumes (EFS/NFS).
  - Serving static assets through Express increases memory footprint under heavy traffic.
- **Production Recommendation:** Migrate the upload pipeline to an S3-compatible cloud object store (Amazon S3, Google Cloud Storage, or Supabase Storage) utilizing client-side direct uploads via secure presigned PUT URLs with server-side validation.

### 2.3 Supabase Connection Pooler Quotas
- **Current Implementation:** The backend connects to Supabase PostgreSQL via the transaction pooler on port 6543 (`DATABASE_URL`) and session pooler on port 5432 (`DIRECT_URL`).
- **Limitation:** On Supabase Free/Starter tiers, pooler client limits are capped (typically 15–20 direct connections, and up to 200 pooler client connections). Under high concurrent load or multiple Prisma Client instances, connection exhaustion (`P2024: Timed out fetching a connection from the pool`) can occur.
- **Production Recommendation:**
  - Maintain `connection_limit=10` in Prisma connection strings per instance.
  - Upgrade to Supabase Pro/Enterprise tier for production workloads to allocate dedicated compute instances and larger connection pooler allowances.

### 2.4 Supabase Backup Retention & Point-in-Time Recovery (PITR)
- **Current State:** The database operates on daily automated backup snapshots provided by the platform.
- **Limitation:** Point-in-Time Recovery (continuous WAL archiving allowing restoration to any specific second) is not active on free-tier projects. Unplanned data corruption would require restoring from the previous midnight snapshot.
- **Production Recommendation:** Enable Supabase PITR (7-day or 30-day retention) before launching commercial customer data processing.

---

## 3. Operational & Field Considerations

### 3.1 Hardware Camera & Optical QR Scanning Under Glare
- **Current State:** The browser QR scanner leverages `@zxing/browser` with full camera stream resolution, paired with an alphanumeric manual fallback.
- **Field Consideration:** In real boiler rooms, basements, or outdoor environments, reflective barcode laminates, low ambient lighting, or scratched QR labels may hinder optical scanning.
- **Mitigation:** The manual alphanumeric search fallback is intentionally prominent in the UI. Pilot technicians must be trained to use manual code entry when optical scanning encounters optical obstruction.

### 3.2 GPS Precision & Underground Signal Attenuation
- **Current State:** The mobile client queries `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`. The backend computes the haversine distance against facility coordinates with a 500m geofence radius.
- **Field Consideration:** Facilities located in subterranean levels, reinforced concrete vaults, or dense urban canyons may experience significant GPS drift or timeout errors.
- **Operational Policy:** Geofence deviations are recorded as warnings and audit flags in the database rather than hard-blocking inspection submission, ensuring critical safety repairs are not delayed by sensor limitations.

### 3.3 Email Notification Dispatch Provider
- **Current State:** Notifications for ticket creation, visit assignment, and certificate expiration are recorded in the PostgreSQL `Notification` table and surfaced via in-app badge feeds.
- **Limitation:** External email delivery (SMTP, SendGrid, Amazon SES, or Postmark) is stubbed to console logs pending production SMTP credential provisioning.
- **Production Recommendation:** Configure production SMTP credentials in `backend/.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) to enable automated email delivery to customers and managers.

---

## 4. Summary Matrix

| Domain | Pilot Status | Production Requirement | Priority |
|:---|:---|:---|:---:|
| **Rate Limiting** | In-Memory (Passed) | Redis Cluster Store | Medium |
| **Asset Storage** | Local Disk (Protected) | S3 / Supabase Storage Bucket | High (Pre-Scale) |
| **Database Pool** | PgBouncer Port 6543 | Supabase Pro Dedicated Compute | Medium |
| **PITR Backups** | Daily Snapshots | Supabase PITR 7-Day Retention | High (Commercial) |
| **QR & GPS** | Tested & Validated | Physical Field Trials on Android/iOS | High (Pilot Goal) |
| **External Email** | In-App Feed & Console | SMTP / SendGrid Gateway | Medium |
