# Servora — Local Database Discovery & Configuration Audit (Windows)

**Audit Type:** Read-Only Local Host System & Repository Inspection  
**Audit Date:** November 11, 2026  
**Auditor:** Senior Infrastructure & Database Systems Auditor  
**Host Machine:** Windows 11 Enterprise (x64), Local Host Environment  
**Repository Branch:** `main`  
**Host Constraint:** Strictly Local Operation (No Cloud Hosting, No AWS, No Supabase, No Neon)  

---

## 1. Executive Summary & Categorization

A comprehensive, non-destructive inspection was performed on this Windows laptop to determine whether PostgreSQL, local database services, existing database files, and Prisma migrations are present.

### Primary Categorization:
**`PostgreSQL not installed on host machine`**

* **Summary Finding:** PostgreSQL is **completely absent** from this Windows laptop. No PostgreSQL installation directories, binaries (`psql.exe`, `postgres.exe`, `pg_ctl.exe`), Windows services, or registry keys exist.
* **Other Local Databases Detected:** A local database service is present and running on the laptop: **`MySQL80` (MySQL 8.0)**, actively listening on port **3306**.
* **Repository Database Assets:** The repository contains a validated 17-model Prisma schema (`server/prisma/schema.prisma`) configured for `postgresql`, but contains no migration directory (`prisma/migrations/`), no SQL dumps, and no database backup files.
* **Current Runtime Mode:** The backend cached circuit breaker (`isDatabaseOnline()`) detects that port 5432 is offline and automatically runs in **explicit Demo Mode (Simulated Data)**, serving compliant in-memory records without crashing.

---

## 2. Required 14-Item Audit Checklist

| # | Inspection Item | Audit Result | Evidence & Technical Details |
|---|---|:---:|---|
| **1** | **PostgreSQL installed** | **NO** | Inspected `C:\Program Files\PostgreSQL`, `C:\Program Files (x86)\PostgreSQL`, `C:\PostgreSQL`, `D:\PostgreSQL`, User AppData, Windows Uninstall registry keys, and `PATH`. Zero PostgreSQL directories or executables found. |
| **2** | **PostgreSQL service found** | **NO** | `Get-Service` queried for `*postgres*` and `*pgsql*`. Zero matching Windows services exist. |
| **3** | **PostgreSQL service running** | **NO** | No PostgreSQL service is installed or running. |
| **4** | **PostgreSQL installation path** | **None** | No PostgreSQL installation directory exists on any local drive. |
| **5** | **PostgreSQL data directory** | **None** | No `data/` cluster directory exists. |
| **6** | **Port and listening status** | **Port 5432: NOT LISTENING**<br/>*(Port 3306: LISTENING - MySQL)* | TCP test to `127.0.0.1:5432` failed (`TcpTestSucceeded: False`). TCP port 3306 is actively listening under PID 6232 (`MySQL80` service). |
| **7** | **Existing Servora database** | **NO** | No database named `servora_db` exists because no PostgreSQL database engine is present to host it. |
| **8** | **Database provider configured in Prisma** | **`postgresql`** | Defined in `server/prisma/schema.prisma`: `datasource db { provider = "postgresql" url = env("DATABASE_URL") }`. |
| **9** | **Environment configuration status** | **Present & Configured** | `server/.env` exists with: `DATABASE_URL="postgresql://servora_user:***@localhost:5432/servora_db?schema=public"` (password redacted). |
| **10** | **Existing migrations and their status** | **None created or applied** | `server/prisma/migrations/` folder does not exist. `npx prisma migrate status` reports `P1001: Can't reach database server at localhost:5432`. |
| **11** | **Existing database files and backups** | **None** | Recursive scan of the workspace found zero `.sql`, `.dump`, `.bak`, `.db`, `.sqlite`, or Docker compose files. |
| **12** | **Project using demo data** | **YES** | Backend serves in-memory mock data with `{ isDemoMode: true, dataSource: "SIMULATED_DEMO" }`. Frontend displays prominent amber disclosure banner. |
| **13** | **Exact issue preventing connectivity** | **Database Engine Absent** | The project configuration expects a PostgreSQL database server at `localhost:5432`, but no PostgreSQL software is installed on the laptop. |
| **14** | **Recommended next steps** | **Install Local PostgreSQL** | Download and install PostgreSQL 16 for Windows locally, create `servora_user` and `servora_db`, then run `npx prisma migrate dev`. *(Alternative local options detailed below).* |

---

## 3. Deep-Dive Inspection Findings

### 3.1 Host Filesystem Inspection
The following paths were probed for PostgreSQL software:
* `C:\Program Files\PostgreSQL`: **NOT FOUND**
* `C:\Program Files (x86)\PostgreSQL`: **NOT FOUND**
* `C:\PostgreSQL`: **NOT FOUND**
* `D:\PostgreSQL`: **NOT FOUND**
* `C:\Users\MITALI SALHOTRA\AppData\Local\Programs\PostgreSQL`: **NOT FOUND**

### 3.2 Executable & CLI Command Discovery
* `where.exe psql`: **NOT FOUND IN PATH**
* `where.exe pg_ctl`: **NOT FOUND IN PATH**
* `where.exe postgres`: **NOT FOUND IN PATH**
* Environment variable `$env:PATH`: Contains Node.js, Git, and Windows system paths. Zero PostgreSQL paths present.

### 3.3 Windows Registry Inspection
* `HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*`: Probed for `*postgres*` and `*postgresql*`. **0 entries found**.
* `HKLM:\SOFTWARE\PostgreSQL`: **Registry key not present**.
* `HKLM:\SOFTWARE\WOW6432Node\PostgreSQL`: **Registry key not present**.
* `HKCU:\SOFTWARE\PostgreSQL`: **Registry key not present**.

### 3.4 Windows Services & Listening Ports
* **PostgreSQL Services**: `Get-Service | Where-Object { $_.Name -match "postgres|pgsql" }` returned empty.
* **Win32_Service Binary Paths**: `Get-CimInstance Win32_Service | Where-Object { $_.PathName -match "postgres" }` returned empty.
* **Other Database Engines Detected on Laptop:**
  ```text
  Name     DisplayName   Status    StartType
  ----     -----------   ------    ---------
  MySQL80  MySQL80       Running   Automatic
  ```
  * Service Name: `MySQL80`
  * Engine: Oracle MySQL 8.0 Server
  * State: **Running**
  * Port: **3306** (Listening on `::3306` / `0.0.0.0:3306`, PID 6232)
* **Virtualization & Container Subsystems:**
  * Docker: Not installed (`'docker' is not recognized as an operable program`).
  * WSL (Windows Subsystem for Linux): Not installed (`The Windows Subsystem for Linux is not installed`).

---

## 4. Repository Configuration Inspection

### 4.1 Environment Configuration (`server/.env`)
* File: `server/.env` (Present)
* Content *(Credentials Redacted)*:
  ```env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL="postgresql://servora_user:***@localhost:5432/servora_db?schema=public"
  JWT_SECRET="servora-super-secret-jwt-key-min-32-chars-long-development"
  JWT_EXPIRES_IN="1h"
  CORS_ORIGIN="http://localhost:5173"
  UPLOAD_DIR="./uploads"
  PUBLIC_VERIFICATION_BASE_URL="http://localhost:5173/verify"
  ```
* Template: `server/.env.example` matches `server/.env`.

### 4.2 Prisma Schema (`server/prisma/schema.prisma`)
* Datasource Configuration:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
* Schema Integrity: **Valid** (Confirmed via `npx prisma validate --schema=server/prisma/schema.prisma`).
* Models Defined: 17 models (`User`, `CustomerProfile`, `ProviderProfile`, `Site`, `Equipment`, `Contract`, `VisitSchedule`, `VisitRecord`, `ChecklistResponse`, `Attachment`, `Certificate`, `AuditEvent`, `ServiceRequest`, etc.).
* Migration Directory (`server/prisma/migrations/`): **Does not exist**. No migrations have ever been generated or run against a physical database.

### 4.3 Database Dumps, Backups & Files
A recursive scan of the repository was conducted for:
`*.sql`, `*.dump`, `*.bak`, `*.db`, `*.sqlite`, `docker-compose.yml`, `compose.yaml`.
* **Result:** **0 database files or backups found in the repository.**

---

## 5. Current Runtime Behavior: Circuit Breaker & Demo Mode

Because port 5432 is not listening, the application utilizes its built-in circuit breaker to prevent server hangs:
1. **Liveness (`/health`)**: Returns `200 OK` (Node.js runtime active).
2. **Readiness (`/ready`)**: Returns `200 OK` with payload:
   ```json
   {
     "status": "not_ready",
     "database": {
       "connected": false,
       "message": "Database is not reachable. Check DATABASE_URL and database service status."
     }
   }
   ```
3. **Dashboard & API Fallback**:
   - The circuit breaker [`isDatabaseOnline()`](file:///C:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/server/src/utils/dbProbe.ts) tests port 5432 with a 300ms timeout and caches the offline state for 5 seconds.
   - All role requests (`CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`) immediately receive compliant mock records in **3ms–35ms**.
   - The frontend prominently renders a top-level amber disclosure banner:
     > **Demo Mode (Simulated Data)**: PostgreSQL server is offline on port 5432. Active session is operating with realistic compliant mock records. Source: `SIMULATED_DEMO`.

---

## 6. Actionable Next Steps to Run Locally on Windows

To connect a real local database without using any cloud or external services, here are the three purely local paths available:

### Option A: Install Native PostgreSQL 16 on Windows (Recommended Standard)
This maintains the exact PostgreSQL architecture defined in Phase 1 specifications.
1. Download the official PostgreSQL 16 Windows x64 installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Run the installer locally:
   - Accept default installation directory: `C:\Program Files\PostgreSQL\16`.
   - Set password to match `server/.env` (or update `.env` to match your chosen password).
   - Port: `5432`.
   - The installer automatically registers and starts the `postgresql-x64-16` Windows service.
3. Open `psql` or pgAdmin locally to create the database:
   ```sql
   CREATE DATABASE servora_db;
   CREATE USER servora_user WITH PASSWORD 'servora_password';
   GRANT ALL PRIVILEGES ON DATABASE servora_db TO servora_user;
   ```
4. Run migrations locally:
   ```powershell
   npx prisma migrate dev --name init --schema=server/prisma/schema.prisma
   ```

---

### Option B: Leverage the Existing Local MySQL 8.0 Service
Because **MySQL 8.0 (`MySQL80`) is already running locally on port 3306** on this laptop:
1. Create a local database in MySQL:
   ```sql
   CREATE DATABASE servora_db;
   ```
2. In `server/prisma/schema.prisma`, update provider to `mysql`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update `DATABASE_URL` in `server/.env` to point to `mysql://root:<your_mysql_password>@localhost:3306/servora_db`.
4. Run `npx prisma migrate dev --name init`.

---

### Option C: Use Zero-Installation Local SQLite (Single File)
If you do not want to install any additional software or configure database users:
1. In `server/prisma/schema.prisma`, set provider to `sqlite`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
2. Run `npx prisma migrate dev --name init`.
3. The database runs completely locally inside a single file `server/prisma/dev.db` with zero services required.
