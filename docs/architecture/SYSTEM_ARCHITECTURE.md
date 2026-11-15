# Servora — System Architecture & Workflow Specification

**Document Version:** 1.0.0  
**Target Environment:** Local Monorepo (`frontend:5173`, `backend:5000`) + Remote Supabase PostgreSQL (Seoul: `aws-0-ap-northeast-2.pooler.supabase.com`)  
**Compliance Standards:** NFPA 10 (Fire Extinguishers), NFPA 72 (Fire Alarm Systems), OSHA 1910.157

---

## 1. Architectural Overview

Servora is an enterprise-grade digital field-service and regulatory compliance platform engineered specifically for fire-safety maintenance contractors, multi-facility real estate asset managers, and compliance auditors.

The system employs a **3-tier decoupled architecture**:
1. **Frontend PWA Client (Port 5173):** React 18 single-page application enhanced with Progressive Web App (PWA) capabilities and Dexie.js (IndexedDB) for resilient offline operation in cellular-dead zones (e.g. subterranean mechanical rooms).
2. **Backend REST API (Port 5000):** Express 4 application written in TypeScript, providing stateless JWT-authenticated endpoints, multi-tenant isolation barriers, binary magic-byte upload validation, rate limiting, and cryptographic record sealing.
3. **Remote Managed Database:** Supabase PostgreSQL 17.11 running in AWS Seoul (`ap-northeast-2`), connected via transaction pooling (PgBouncer, Port 6543) and session pooling (Port 5432).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVORA ARCHITECTURE                            │
└────────────────────────────────────────────────────────────────────────┘

    [ Customer Portal ]    [ Manager Dashboard ]    [ Mobile Technician ]
          (React)                 (React)               (Dexie PWA)
             │                       │                       │
             └───────────────────────┼───────────────────────┘
                                     │ HTTPS / JSON / Multipart
                                     ▼
                      ┌─────────────────────────────┐
                      │    Express REST API (5000)  │
                      │  - Helmet / CORS            │
                      │  - Multi-Tier Rate Limiter  │
                      │  - JWT Authentication       │
                      │  - Role Guards (RBAC)       │
                      │  - Zod Request Validators   │
                      │  - SHA-256 Record Sealer    │
                      └──────────────┬──────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         ┌─────────────────────┐           ┌─────────────────────┐
         │  Supabase PostgreSQL│           │  Persistent Storage │
         │  17.11 (ap-northeast)│          │  (backend/uploads/) │
         │  - 17 Domain Models │           │  - Binary Photos    │
         │  - 33 Foreign Keys  │           │  - PDF Certificates │
         │  - 71 DB Indexes    │           └─────────────────────┘
         └─────────────────────┘
```

---

## 2. End-to-End Business Workflow (The Servora Lifecycle)

The platform connects all four domain roles into an end-to-end operational lifecycle:

```
[CUSTOMER]
  │
  ├─► 1. Registers organisation & facility sites (`POST /sites`)
  │
  ├─► 2. Registers fire-safety equipment with QR codes (`POST /equipment`)
  │
  ├─► 3. Raises maintenance or deficiency request (`POST /service-requests`)
  │
[SERVICE MANAGER]
  │
  ├─► 4. Reviews incoming ticket and active contract SLA
  │
  ├─► 5. Schedules visit and dispatches technician (`POST /visits`)
  │
[TECHNICIAN]
  │
  ├─► 6. Loads assigned daily manifest (`GET /visits/my-visits`)
  │
  ├─► 7. Arrives on site; camera scans QR code (`GET /equipment/qr/:code`)
  │
  ├─► 8. Fills dynamic compliance checklist & captures photos
  │
  ├─► 9. Captures dual-party digital signatures & GPS coordinates
  │
  ├─► 10. Submits inspection record with Idempotency-Key (`POST /visits/:id/inspections`)
  │
[BACKEND SERVICE ENGINE]
  │
  ├─► 11. Recalculates spherical Haversine distance against registered site GPS
  │
  ├─► 12. Generates canonical UTF-8 JSON and seals record with SHA-256 hash
  │
  ├─► 13. Write-locks completed visit record against status rollback or tampering
  │
  ├─► 14. Generates regulatory compliance certificate & vector PDF (`POST /certificates`)
  │
[PUBLIC AUDITOR]
  │
  └─► 15. Scans certificate QR code to verify validity on public portal (`GET /certificates/verify/:num`)
          (PII masked, certificate validity and cryptographic hash confirmed)
```

---

## 3. Technology Stack Reference

| Tier | Component | Technology / Library | Version | Role in Architecture |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Framework | React | 18.3.1 | Component-based interactive UI |
| | Language | TypeScript | 5.5.4 | Static typing and interfaces |
| | Build Tool | Vite | 8.3.8 | Modern bundler and dev server |
| | Offline Storage| Dexie.js | 4.4.7 | IndexedDB wrapper for local caching |
| | Styling | Tailwind CSS | 3.4.11 | Utility-first responsive design |
| | Icons | Lucide React | 0.441.0 | SVG icon system |
| | QR Scanner | html5-qrcode | 2.3.8 | Optical camera and file barcode reader |
| | State & Query | TanStack React Query | 5.56.2 | Server state management and caching |
| **Backend** | Framework | Express | 4.21.1 | HTTP routing and middleware chain |
| | Runtime | Node.js | v22.20.0 | Server-side JavaScript runtime |
| | ORM | Prisma | 5.22.0 | Type-safe PostgreSQL client & migrations |
| | Hashing | bcryptjs | 2.4.3 | Salted password hashing (cost factor 10)|
| | Tokens | jsonwebtoken | 9.0.2 | HMAC-SHA256 stateless session tokens |
| | Validation | Zod | 4.6.7 | Runtime schema validation |
| | Security | Helmet | 7.1.0 | Standard HTTP security headers |
| | File Ingress | Multer | 2.5.0 | Multipart form-data handling |
| | PDF Engine | PDFKit | 0.20.2 | Programmatic PDF document generation |
| | QR Engine | QRCode | 1.5.4 | PNG/SVG QR code generation |
| **Database** | Database | PostgreSQL | 17.11 | Managed relational database |
| | Hosting | Supabase | Free Tier | Cloud database in AWS Seoul |
| | Pooler | PgBouncer | Port 6543 | Transaction pooling for serverless/app |
