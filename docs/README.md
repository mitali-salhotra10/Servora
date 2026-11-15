# Servora — Technical Documentation Index

Welcome to the technical documentation repository for **Servora — Trusted Digital Field-Service Platform**.

This directory serves as the single source of truth for all architectural, functional, security, database, testing, and operational specifications of the Servora platform.

---

## 1. Documentation Taxonomy & Lifecycle Status

The documentation is divided into two distinct governance categories:

* **Frozen Specifications (Phase 1 Baseline):** Formally reviewed, approved, and frozen engineering baselines. They must **not be silently modified** during feature implementation. Any proposed change requires documented architectural justification.
* **Living Engineering Documents (Phase 2+):** Continuously updated implementation artifacts, test execution logs, architecture decision records, and API specifications that evolve with each completed milestone.

---

## 2. Master Documentation Directory

### 2.1 Project Audits & Executive Summaries
* [PROJECT_AUDIT.md](PROJECT_AUDIT.md) — *Living Document*  
  Comprehensive project audit as of November 3, 2026, detailing exact repository state, completed workstreams, test evidence, known limitations, and risk assessments.

### 2.2 Requirements Specifications
* [requirements/product-requirements.md](requirements/product-requirements.md) — **Frozen Phase 1 Baseline**  
  Product Requirements Document (PRD) detailing the fire-safety domain scope, industry problem statement, personas, and the core Servora Trust Chain vision.
* [requirements/functional-requirements.md](requirements/functional-requirements.md) — **Frozen Phase 1 Baseline**  
  Detailed functional requirements catalog specifying 58 discrete requirements (FR-001 through FR-058) organized across 11 functional modules.
* [requirements/non-functional-requirements.md](requirements/non-functional-requirements.md) — **Frozen Phase 1 Baseline**  
  Architectural quality attributes and non-functional requirements (NFR-001 through NFR-025) emphasizing offline resilience, security, and performance.
* [requirements/moscow.md](requirements/moscow.md) — **Frozen Phase 1 Baseline**  
  MoSCoW scope prioritization framework delineating Must Have (semester baseline), Should Have, Could Have, and Won't Have features.

### 2.3 System Architecture & Technology Stack
* [architecture/system-architecture.md](architecture/system-architecture.md) — **Frozen Phase 1 Baseline**  
  System Architecture Document (SAD) featuring high-level tiered diagrams, Trust Chain sequence diagrams, and offline synchronization protocols.
* [architecture/technology-stack.md](architecture/technology-stack.md) — **Frozen Phase 1 Baseline**  
  Technology Stack Specification with architectural justifications for Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, React, and Vite.
* [architecture/api-specification.md](architecture/api-specification.md) — *Living Document*  
  Exhaustive REST API specification covering authentication, site management, equipment tracking, maintenance contracts, visit dispatch, and proposed sync endpoints.

### 2.4 Database & Data Architecture
* [database/data-model.md](database/data-model.md) — **Frozen Phase 1 Baseline**  
  Conceptual Data Model and entity-relationship specifications for all 17 core platform entities and relational enums.
* *Prisma Active Schema:* Located at [server/prisma/schema.prisma](../server/prisma/schema.prisma) — *Living Implementation*  
  Production-ready PostgreSQL Prisma schema mapped 1-to-1 to the conceptual data model.

### 2.5 Security Architecture
* [security/security-requirements.md](security/security-requirements.md) — **Frozen Phase 1 Baseline**  
  Security Architecture Document defining adaptive bcrypt password hashing (SEC-001), stateless JWT lifecycles (SEC-002), server-side authorization boundaries (SEC-003), input sanitization (SEC-004), cryptographic payload sealing (SEC-007), and immutable audit logs (SEC-011).

### 2.6 Planning & Milestones
* [planning/implementation-roadmap.md](planning/implementation-roadmap.md) — *Living Document*  
  Multi-phase implementation roadmap ordering milestones by architectural dependency, acceptance criteria, required tests, and effort estimates.
* [planning/decision-log.md](planning/decision-log.md) — *Living Document*  
  Architecture Decision Records (ADR 001–008) tracking technical choices, context, trade-offs, and proposed future decisions.
* [planning/next-development-step.md](planning/next-development-step.md) — *Living Document*  
  Actionable, turnkey handoff guide and prompt for the next engineering agent embarking on Phase 5 (Digital Trust Chain, Signatures & PDF Certificates).

### 2.7 Testing & Quality Assurance
* [testing/test-strategy.md](testing/test-strategy.md) — *Living Document*  
  Comprehensive testing strategy defining unit, API, integration, and security test protocols, plus reproducible PostgreSQL setup instructions.
* [testing/requirements-traceability.md](testing/requirements-traceability.md) — *Living Document*  
  End-to-end Requirements Traceability Matrix linking FR-001–FR-058 to code modules, test cases, and verification results.
* [testing/test-execution-report.md](testing/test-execution-report.md) — *Living Document*  
  Factual test execution report recording exact test commands, environment observations, and passing metrics (106 tests passed across 23 test suites).
* [testing/test-plan.md](testing/test-plan.md) — *Living Document*  
  Initial Phase 2 test strategy artifact.

---

## 3. Planned Documentation (To Be Authored in Future Milestones)

The following documents are scheduled for creation in future phases as implementation matures:

| Planned Document Path | Target Milestone | Description |
| :--- | :--- | :--- |
| `docs/dfd/context-diagram.md` | Phase 4 (Field Workflow) | Level-0 Context Data Flow Diagram of customer, technician, and public auditor data boundaries. |
| `docs/dfd/dfd-level-1.md` | Phase 4 (Field Workflow) | Level-1 DFD detailing offline sync queues, idempotency filters, and database writes. |
| `docs/uml/class-diagrams.md` | Phase 3 (Client PWA) | Complete UML class diagram of client-side models and backend service domains. |
| `docs/uml/sequence-diagrams.md` | Phase 4 (Field Workflow) | Detailed UML sequence diagrams for offline visit completion, synchronization, and certificate issuance. |
| `docs/uml/state-machine-diagrams.md` | Phase 4 (Field Workflow) | State transition diagrams for `VisitSchedule`, `Contract`, and `ServiceRequest` lifecycles. |
| `docs/architecture/deployment-guide.md` | Phase 10 (Deployment) | Production hosting, Docker containerization, reverse proxy, and environment variable configuration. |
