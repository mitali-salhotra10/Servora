# Servora — Monorepo Project Structure

**Document Version:** 1.0.0  
**Last Updated:** November 14, 2026  
**Repository Architecture:** npm Workspaces Monorepo (`frontend`, `backend`, `shared`)

---

## 1. High-Level Monorepo Layout

Servora is structured as a professional, scalable B2B SaaS monorepo. Applications and packages are partitioned to ensure clean separation of concerns, shared type safety, independent build pipelines, and centralized integration testing.

```
SERVORA/
│
├── frontend/                     # React 18 + TypeScript + Vite PWA Client
│   ├── public/                   # Static assets, PWA manifest, service worker
│   ├── src/
│   │   ├── api/                  # Axios API client, auth interceptors & endpoints
│   │   ├── assets/               # Branding graphics, SVG icons, imagery
│   │   ├── components/           # Reusable UI & Layout Components
│   │   │   ├── common/           # Button, Card, Badge, Input, Spinner, ErrorBoundary
│   │   │   ├── forms/            # Form controls and input abstractions
│   │   │   ├── layout/           # AppLayout, Navbar, Sidebar, MobileNav
│   │   │   └── ui/               # Export facade for shared UI components
│   │   ├── context/              # React Context Providers (AuthContext, SyncContext)
│   │   ├── db/                   # Dexie.js (IndexedDB) offline client database
│   │   ├── features/             # Domain Feature Modules
│   │   │   ├── auth/             # Login, Registration, Password Validation
│   │   │   ├── certificates/     # Certificate list, PDF viewer & public verification
│   │   │   ├── contracts/        # AMC / QMC maintenance agreement management
│   │   │   ├── dashboard/        # Four-role dashboard views & operational charts
│   │   │   ├── equipment/        # QR Scanner modal & equipment inspection cards
│   │   │   ├── facilities/       # Site directory, site detail & creation wizard
│   │   │   ├── inspections/      # Dynamic checklist forms & evidence capture
│   │   │   ├── notifications/    # In-app notifications & compliance alerts
│   │   │   ├── service-requests/ # Customer defect ticketing & triage workflow
│   │   │   ├── technicians/      # Service provider crew & manifest allocation
│   │   │   └── visits/           # Visit calendar, manifest & execution workflow
│   │   ├── hooks/                # Custom React hooks (useAuth, useOfflineVisits)
│   │   ├── pages/                # Route page components
│   │   ├── routes/               # Role-based route guards and AppRoutes definition
│   │   ├── sync/                 # Background synchronization queue & network event listeners
│   │   ├── tests/                # Vitest component & store unit tests (46 tests)
│   │   ├── types/                # Frontend client type definitions
│   │   ├── App.tsx               # Root component with routing and context providers
│   │   ├── index.css             # Tailwind CSS entrypoint
│   │   └── main.tsx              # React DOM initialization
│   ├── package.json              # Frontend dependencies and Vite build scripts
│   ├── tsconfig.json             # TypeScript compiler options for React/DOM
│   └── vite.config.ts            # Vite bundler configuration & test harness
│
├── backend/                      # Node.js + Express + Prisma REST API Service
│   ├── src/
│   │   ├── config/               # Environment variable parsing (Zod) & defaults
│   │   ├── controllers/          # HTTP request handlers & response orchestration
│   │   ├── db/                   # Prisma Client singleton & connection lifecycle
│   │   ├── jobs/                 # Operational scheduled jobs & maintenance checks
│   │   ├── middleware/           # Auth, RBAC, Rate-Limiting, Error & Validation filters
│   │   ├── repositories/         # Database query accessors & Prisma facades
│   │   ├── routes/               # Express route declarations (v1 API)
│   │   ├── schemas/              # Zod validation schemas for request DTOs
│   │   ├── services/             # Core business logic, hash computation, PDF generator
│   │   ├── types/                # Backend TypeScript types & Express augmentations
│   │   ├── utils/                # Crypto digests, Haversine geofence, error classes
│   │   ├── validators/           # Export facade for schemas & validate middleware
│   │   ├── app.ts                # Express application setup, Helmet, CORS & middleware
│   │   ├── index.ts              # Export facade for library usage
│   │   └── server.ts             # HTTP listener entrypoint & graceful shutdown handlers
│   ├── prisma/
│   │   ├── schema.prisma         # Relational database schema (17 models, 15 enums)
│   │   ├── migrations/           # Declarative PostgreSQL migrations
│   │   └── seed.ts               # Synthetic deterministic seeding script
│   ├── tests/
│   │   ├── unit/                 # Pure function unit tests (30 tests)
│   │   └── integration/          # Real Supertest + Supabase integration tests (49 tests)
│   ├── uploads/                  # Persistent local upload storage for photos and cert PDFs
│   ├── package.json              # Backend dependencies, Prisma CLI & test scripts
│   └── tsconfig.json             # TypeScript compiler options for Node.js / ES2022
│
├── shared/                       # Shared contracts and constants
│   ├── constants/                # System limits, default ports, compliance standards
│   ├── schemas/                  # Common regex patterns and validation predicates
│   ├── types/                    # Shared enums (UserRole, VisitStatus, EquipmentType, etc.)
│   ├── index.ts                  # Shared package root export
│   └── package.json              # Shared package definition (`@servora/shared`)
│
├── docs/                         # Comprehensive Documentation
│   ├── api/                      # REST API endpoints, DTOs and error schemas
│   ├── architecture/             # Architecture, project layout, RBAC, offline sync, integrity
│   ├── audit-reports/            # Phase 1-5 execution reports and final verification
│   ├── backup-and-recovery/      # Supabase backup strategy & storage recovery
│   ├── database/                 # Prisma data model, relationships and ER diagrams
│   ├── pilot/                    # Controlled pilot readiness checklist and testing guide
│   └── user-guides/              # Step-by-step role guides for Admin, Customer, Manager, Tech
│
├── scripts/                      # Operational utilities and health probes
│   └── verify-connection.js      # Zero-dependency HTTP probe for /ready endpoint
│
├── tests/                        # Cross-application integration & E2E suites
│   └── e2e/
│       ├── phase3_workflow.e2e.js# 4-Role full lifecycle workflow test
│       ├── phase4_field_ops.e2e.js# QR, geofence, photo upload & offline idempotency test
│       └── phase5_security.e2e.js# RBAC, IDOR, MIME spoofing & immutability test
│
├── .env.example                  # Environment variable reference template
├── .gitignore                    # Git exclusions for dependencies, builds, and uploads
├── package.json                  # Root npm workspace configuration & aggregate scripts
└── README.md                     # Comprehensive platform overview and getting started guide
```

---

## 2. Workspace Scripts Reference

The root `package.json` coordinates all packages via npm workspaces:

| Command | Action | Scope |
| :--- | :--- | :--- |
| `npm run dev` | Starts frontend (5173) and backend (5000) concurrently | Monorepo |
| `npm run dev:frontend` | Starts Vite development server with HMR | `frontend` |
| `npm run dev:backend` | Starts backend using `tsx watch` | `backend` |
| `npm run build` | Compiles TypeScript and runs production builds | Monorepo |
| `npm run build:frontend`| Executes `tsc && vite build` (outputs to `frontend/dist`) | `frontend` |
| `npm run build:backend` | Executes `tsc` (outputs to `backend/dist`) | `backend` |
| `npm run typecheck` | Runs `tsc --noEmit` across all workspaces | Monorepo |
| `npm run test` | Runs unit and integration tests across workspaces | Monorepo |
| `npm run test:frontend`| Runs frontend Vitest suite (46 tests) | `frontend` |
| `npm run test:backend` | Runs backend Vitest suites (79 tests) | `backend` |
| `npm run test:unit` | Runs backend unit tests (30 tests) | `backend` |
| `npm run test:integration`| Runs live Supabase integration tests (49 tests) | `backend` |
| `npm run test:e2e` | Runs all 3 E2E integration test suites | `tests/e2e` |
| `npm run prisma:validate` | Validates Prisma schema syntax | `backend` |
| `npm run prisma:generate` | Generates `@prisma/client` bindings | `backend` |
