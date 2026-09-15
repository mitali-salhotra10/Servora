# Servora

## Trusted Digital Field-Service Platform

Servora is a trusted digital field-service platform designed to connect customers with local service providers while maintaining secure, verifiable digital records of completed services.

For the semester implementation, Servora focuses on the fire-safety servicing domain, including recurring maintenance of fire extinguishers, hydrants and alarm systems.

The platform is designed to support both independent service providers and small service teams rather than assuming that every technician belongs to a large formal company.

---

## Problem

Local service work is often managed through phone calls, WhatsApp messages, spreadsheets, paper records and photos stored on individual devices.

This can lead to:

- missed service visits
- poor scheduling
- scattered service evidence
- difficulty proving that a service was completed
- lack of structured service history
- weak accountability
- dependence on internet connectivity during field work

Servora provides a structured digital workflow for these activities.

---

## Core Vision

Servora connects:

Customer
↓
Servora
↓
Local Service Provider
↓
Service
↓
Secure Digital Proof

The objective is not simply to find a technician.

The objective is to create a trustworthy digital workflow and verifiable record around the service.

---

## Core Features

### Customer

- Account registration and login
- Browse/request services
- Service provider discovery
- Service requests/bookings
- Booking status
- Service history
- Digital service certificates
- Service verification

### Service Provider

- Provider profile
- Service management
- Customer management
- Assigned visits
- Recurring service schedules
- Technician workflow
- Checklist completion
- Photo evidence
- Customer signature
- Service history

### Offline-First Technician Workflow

Technicians must be able to perform essential field operations without an internet connection.

Offline workflow:

Technician
→ Servora PWA
→ IndexedDB
→ Pending Sync Queue
→ Internet Restored
→ API
→ Idempotency Validation
→ PostgreSQL
→ Synchronization Acknowledgement

The system must prevent duplicate synchronization.

### Digital Trust Features

- GPS/geofenced check-in
- QR-based equipment identification
- Structured service checklists
- Photo evidence
- Digital signatures
- Timestamped visit records
- Hash-based service verification
- Digital compliance certificates
- QR-based certificate verification
- Public read-only certificate verification

### Management

- Customer management
- Service provider management
- Contracts
- Recurring visit scheduling
- Upcoming visits
- Overdue visits
- Compliance information
- Technician performance
- Reports

---

## Fire-Safety Semester Scope

The semester MVP focuses on:

- Fire extinguishers
- Fire hydrants
- Fire alarm systems
- Recurring maintenance/service visits
- Service checklists
- Proof of service
- Compliance records

The architecture should remain extensible to other field-service domains in the future.

---

## Main Roles

### Customer
Requests services, tracks service activity and accesses service records.

### Service Provider
Provides services and manages customers, service requests and service records.

### Service Manager
Manages multiple technicians, schedules, contracts and operational information.

### Administrator
Manages system-level users, access and platform configuration.

---

## Technology Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- TanStack React Query
- PWA

### Backend

- Node.js
- Express
- TypeScript

### Database

- PostgreSQL
- Prisma ORM

### Security

- JWT
- bcrypt
- Role-Based Access Control
- Server-side authorization
- Secure environment variables

### Storage

Object storage will be used for service evidence such as photographs and generated certificates.

---

## Architecture

The high-level architecture is:

Customer / Service Provider / Manager
↓
React PWA
↓
Express REST API
↓
Business Logic
↓
Prisma ORM
↓
PostgreSQL

For offline technician operations:

React PWA
↓
IndexedDB
↓
Offline Queue
↓
Sync Manager
↓
Express API
↓
Idempotency Check
↓
PostgreSQL

---

## Development Method

Servora will be developed using an incremental Software Engineering process:

1. GitHub & Project Foundation
2. Requirements & System Design
3. UI/UX Design
4. Mockups
5. Backend Foundation
6. Authentication & Authorization
7. Customer & Provider Management
8. Service & Contract Management
9. Automatic Visit Scheduling
10. Technician Workflow
11. Offline-First Synchronization
12. Digital Trust Features
13. Dashboard & Reports
14. Verification & Testing
15. Deployment
16. Documentation & Viva Preparation

Each major feature follows:

Requirement
→ Design
→ Implementation
→ Testing
→ Verification

---

## Repository Structure

```text
Servora/
│
├── client/
│   └── React + Vite PWA
│
├── server/
│   └── Node + Express API
│
├── docs/
│   ├── requirements/
│   ├── uml/
│   ├── dfd/
│   ├── architecture/
│   ├── planning/
│   └── testing/
│
├── tests/
│
├── README.md
├── .gitignore
└── package.json
```
