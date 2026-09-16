# Servora — Technology Stack Specification

**Document Version:** 1.0.0  
**Status:** Frozen / Baseline for Phase 1  
**Project Name:** Servora  
**Repository:** `https://github.com/mitali-salhotra10/Servora.git`  

---

## 1. Overview & Stack Selection Rationale

The technology choices for Servora are driven by three fundamental software engineering constraints:
1. **Offline-First Field Capability:** The client must run reliably on mobile devices in disconnected environments without native app store deployment friction.
2. **Type-Safe Full-Stack Architecture:** TypeScript across both frontend and backend ensures shared domain types (e.g., inspection schemas, checklist results, DTOs), drastically reducing serialization and contract drift bugs.
3. **Relational Data Integrity:** Safety equipment inspection histories, maintenance agreements, and audit logs require strict relational ACID guarantees provided by PostgreSQL and Prisma ORM.

---

## 2. Frontend Technology Stack (Client Tier)

| Layer / Concern | Technology Selected | Version Target | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Framework** | **React** | `18.x` | Component-driven architecture with high ecosystem maturity for forms, canvas manipulation, and reactive UI states. |
| **Build Tooling** | **Vite** | `5.x` | Extremely fast HMR (Hot Module Replacement), optimized ES modules bundling, and first-class TypeScript integration. |
| **Language** | **TypeScript** | `5.x` | Enforces strict compile-time type safety across UI components, API contracts, and offline data structures. |
| **Styling & Design** | **Tailwind CSS** | `3.4.x` | Utility-first CSS framework enabling responsive, mobile-first, high-contrast user interfaces with minimal bundle overhead. |
| **Routing** | **React Router** | `6.x` | Declarative client-side routing with nested layout routes, route guards, and role-based access redirection. |
| **Server State Management** | **TanStack React Query** | `5.x` | Declarative asynchronous state management, automated query caching, optimistic UI updates, and background refetching upon reconnection. |
| **HTTP Transport** | **Axios** | `1.x` | Promise-based HTTP client supporting request/response interceptors for automatic JWT injection and centralized 401 token refresh handling. |
| **Offline Storage** | **IndexedDB** (via `idb` / `Dexie.js`) | Modern W3C Standard | High-capacity browser storage for offline visit manifests, inspection forms, and binary image blobs. |
| **PWA & Caching** | **Vite PWA Plugin (Workbox)**| `0.20.x` | Automated service worker generation, precaching of application shell assets, and offline fallback navigation. |
| **Signature Capture** | **Signature Pad** / HTML5 Canvas | `5.x` | Smooth on-screen vector signature capture with support for touch devices and stylus pens. |
| **QR Code Scanning** | **html5-qrcode** | `2.3.x` | Cross-platform camera-based QR code scanning supporting both Android and iOS mobile web browsers without native wrappers. |
| **Icons & Visuals** | **Lucide React** | `0.400+` | Clean, lightweight, customizable SVG icon set for mobile field-service actions. |

---

## 3. Backend Technology Stack (Server Tier)

| Layer / Concern | Technology Selected | Version Target | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | **Node.js** | `20.x LTS` | Mature, asynchronous, non-blocking JavaScript runtime with exceptional I/O performance for concurrent sync requests. |
| **Web Application Framework** | **Express.js** | `4.x` | Lightweight, unopinionated, battle-tested REST API framework offering maximum flexibility for custom middleware pipelines. |
| **Language** | **TypeScript** | `5.x` | Strong typing, interfaces, and compile-time verification across controllers, services, and repositories. |
| **Database ORM** | **Prisma ORM** | `5.x` | Next-generation TypeScript ORM providing declarative data modeling, automated migrations, type-safe query builders, and relation handling. |
| **Database Engine** | **PostgreSQL** | `15.x / 16.x` | ACID-compliant relational database with native support for JSONB payloads, geographic indexing, and transactional consistency. |
| **Request Validation** | **Zod** | `3.x` | Composable, schema-based runtime validation for HTTP request bodies, query parameters, and synchronization payloads. |
| **Authentication & Tokens** | **jsonwebtoken (JWT)** | `9.x` | Industry-standard stateless token authentication carrying cryptographic role claims and expiration windows. |
| **Password Hashing** | **bcryptjs** | `2.4.x` | Computationally intensive adaptive hashing function with salt rounds to prevent rainbow table and brute-force attacks. |
| **Security Headers** | **Helmet** | `7.x` | Sets vital HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) to protect against web vulnerabilities. |
| **CORS Management** | **cors** | `2.8.x` | Restricts cross-origin resource sharing strictly to authorized frontend origins. |
| **Rate Limiting** | **express-rate-limit** | `7.x` | Protects authentication and public verification endpoints from brute-force and DoS abuse. |
| **PDF Generation** | **PDFKit** | `0.15.x` | Headless, server-side vector PDF generation library for rendering official, tamper-evident fire safety compliance certificates. |
| **QR Code Generation** | **qrcode** | `1.5.x` | Generates SVG/PNG QR code matrices for embedding into PDF certificates and asset tags. |
| **Logging & Diagnostics** | **Winston** / **Morgan** | `3.x` | Structured application logging with level-based filtering (info, warn, error) and HTTP request tracing. |

---

## 4. Environment & Tooling Architecture

### 4.1 Development Tooling
- **Package Manager:** `npm` (utilizing native npm workspaces for monorepo structure: `client` and `server`).
- **Linter & Formatter:** ESLint and Prettier for uniform code formatting across both client and server codebases.
- **Node Process Manager:** `tsx` / `ts-node-dev` for fast development reload on the backend without manual compilation steps.

### 4.2 Configuration & Environment Management
- Zero hard-coded credentials or connection strings in source code.
- Segregated environment files:
  - `.env.example` committed to git as a documented template.
  - `.env` kept strictly local and git-ignored.
- Standard configuration variables:
  - `PORT`: HTTP listener port (default: 5000)
  - `DATABASE_URL`: PostgreSQL connection string
  - `JWT_SECRET`: 256-bit cryptographic signing secret
  - `JWT_EXPIRES_IN`: Access token lifespan (e.g., `1h` or `7d`)
  - `STORAGE_DRIVER`: `local` or `s3`
  - `UPLOAD_DIR`: Local filesystem path for attachments
  - `PUBLIC_VERIFICATION_BASE_URL`: Base URL for generated QR links (e.g., `https://servora.app/verify/`)

---

## 5. Summary Dependency Decision Matrix

| Concern | Why Chosen | Alternative Considered | Why Alternative Was Rejected |
| :--- | :--- | :--- | :--- |
| **Client Framework** | React + Vite | Next.js | Next.js server-side rendering adds unnecessary complexity for an offline-first PWA where the entire field app must run client-side in the browser when disconnected. |
| **Database** | PostgreSQL | MongoDB | MongoDB lacks strict relational integrity and foreign key constraints essential for multi-year maintenance contracts, asset registries, and audit trails. |
| **ORM** | Prisma ORM | TypeORM / Sequelize | Prisma generates 100% type-safe query results and offers unmatched migration developer experience and schema clarity. |
| **Offline Cache** | IndexedDB | LocalStorage | LocalStorage is synchronous, blocks the main thread, and is limited to ~5MB, making it incapable of storing photographic inspection evidence. |
