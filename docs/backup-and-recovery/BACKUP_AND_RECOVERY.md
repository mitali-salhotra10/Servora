# Servora — Backup, Disaster Recovery & Storage Durability Runbook

**Document Version:** 1.0.0  
**Target Environment:** Local Workspace Host + Supabase PostgreSQL 17.11 (AWS Seoul)  
**Standard Recovery Objectives:** RTO $\le 4\text{ hours}$, RPO $\le 24\text{ hours}$ (Daily Snapshot)

---

## 1. Supabase PostgreSQL Backup Architecture

Servora's relational database is hosted on a managed Supabase PostgreSQL 17.11 cluster in AWS Seoul (`ap-northeast-2`).

### 1.1 Automated Snapshot Schedule
* **Snapshot Frequency:** Automated snapshot executed every 24 hours.
* **Retention Window:** 7 days.
* **Covered Assets:**
  * All 17 domain tables, constraints, foreign keys, triggers, and sequences.
  * User credentials, authentication hashes, and session invalidation counters.
  * Cryptographic `VisitRecord.recordHash` seals and compliance certificate records.
* **Point-in-Time Recovery (PITR) Assessment:**
  * *Free Tier Status:* PITR is **NOT enabled** on the Free tier.
  * *Enterprise Recommendation:* Upgrade to Supabase Pro Tier ($25/mo) with the PITR add-on to enable continuous Write-Ahead Log (WAL) archiving to S3, permitting second-by-second rollback.

---

## 2. Local File Storage Durability & Recovery Runbook

Uploaded inspection photographs and certificate PDFs are stored locally in [`backend/uploads/`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/backend/uploads/).

### 2.1 File Storage Dual-Write Risk
Because database metadata rows and binary files are stored separately:
1. **Host Ephemerality Warning:** If the backend container or virtual machine is destroyed without a persistent volume mount, all binary photos in `backend/uploads/` will be lost while the database metadata in Supabase survives.
2. **Mandatory Volume Mount:** For any pilot container deployment (Docker, AWS ECS), `backend/uploads/` **must be mapped to a persistent host volume or network volume (AWS EFS)**.

### 2.2 Backup Procedure for Local Uploads
To back up binary assets to an off-site archive:
```bash
# 1. Archive the uploads directory with timestamp
tar -czvf servora_uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# 2. Compute SHA-256 integrity checksum
sha256sum servora_uploads_backup_*.tar.gz > servora_uploads_checksum.txt
```

---

## 3. Disaster Recovery Restoration Procedure

### 3.1 Database Restoration (Non-Destructive Protocol)
> [!CAUTION]
> Never perform a restore test on the active live production database. Use a branched staging database.

1. Open the Supabase Management Console for project `oovvffhcfjovfcfkwhqf`.
2. Navigate to **Database** $\rightarrow$ **Backups**.
3. Select the desired daily snapshot.
4. Click **Restore Backup to Staging Project** to verify schema and record integrity before touching pilot environments.

### 3.2 Uploads Restoration Procedure
1. Stop the backend server daemon to prevent write-conflicts:
   ```bash
   npm run stop:backend
   ```
2. Restore the archive into `backend/uploads/`:
   ```bash
   tar -xzvf servora_uploads_backup_YYYYMMDD.tar.gz -C backend/
   ```
3. Verify file permissions and readability:
   ```bash
   ls -la backend/uploads/
   ```
4. Restart the backend server and run the connection probe:
   ```bash
   npm run dev:backend
   node scripts/verify-connection.js
   ```
