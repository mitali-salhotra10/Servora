# Servora — Database Architecture & Data Model

**Document Version:** 1.0.0  
**Target Environment:** Supabase Managed PostgreSQL 17.11 (Debian 17.11-1.pgdg130+1)  
**Host Region:** AWS Seoul (`ap-northeast-2`)  
**Pooler Host:** `aws-0-ap-northeast-2.pooler.supabase.com`  
**Transaction Pooler Port:** 6543 (PgBouncer, for high-frequency application queries)  
**Session Pooler Port:** 5432 (Direct connection for Prisma migrations and schema introspection)  

---

## 1. Relational Schema Summary

The Servora database schema is defined in [`backend/prisma/schema.prisma`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/backend/prisma/schema.prisma). It encapsulates 17 domain models, 15 enums, 33 foreign key constraints, and 71 database indexes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVORA ENTITY RELATIONSHIPS                    │
└────────────────────────────────────────────────────────────────────────┘

 [User] ──────────┬───► [CustomerProfile] ───► [Site] ───► [Equipment]
                  │                                │              │
                  │                                │              ▼
                  ├───► [ProviderProfile] ────────┼──────► [ChecklistResponse]
                  │                                │              ▲
                  │                                ▼              │
                  └───► [VisitSchedule] ──────► [VisitRecord] ────┘
                               ▲                       │
                               │                       ▼
                          [Contract]              [Certificate]
                                                       │
                                                       ▼
                                                 [Attachment]
```

### 1.1 Core Domain Models (17)
1. **`User`:** Central identity record storing email, `passwordHash` (bcrypt cost 10), role (`UserRole`), and active status.
2. **`CustomerProfile`:** Organization profile for facility owners, corporate tenants, or property management companies.
3. **`ProviderProfile`:** Service contractor profile storing business name, state license number, and service radius.
4. **`Service`:** Catalog of fire-safety services offered by a service provider (e.g. annual inspection, hydrostatic test).
5. **`ServiceRequest`:** Deficiency or ad-hoc ticket raised by a customer (urgency, preferred time slot, status).
6. **`Site`:** Physical building, hospital, or commercial campus with GPS coordinates, geofence radius, and contact info.
7. **`Contract`:** Annual/quarterly maintenance agreement (AMC) binding a customer, provider, and site.
8. **`Equipment`:** Fire-safety asset with serial number, QR identifier, equipment type, specification, and location.
9. **`VisitSchedule`:** Scheduled service visit linking site, contract, service request, and assigned technician.
10. **`VisitRecord`:** Executed inspection proof with check-in GPS, timestamps, signatures, and SHA-256 record hash.
11. **`ChecklistTemplate`:** Standardized compliance checklist questions (NFPA 10, NFPA 72) with passing criteria.
12. **`ChecklistResponse`:** Recorded answers, pressure readings, and defect notes for each inspected asset.
13. **`Attachment`:** Photographic evidence or diagram with file hash, MIME type, size, and persistent URI.
14. **`Certificate`:** Legal compliance certificate issued for a visit with QR verification URL and validity period.
15. **`NotificationLog`:** Outgoing audit log of in-app or SMS/email notifications dispatched by the system.
16. **`TechnicianScore`:** Quality and reliability performance scoring for field technicians.
17. **`AuditEvent`:** Immutable regulatory audit log recording every security, state change, and login event.

---

## 2. Referential Integrity & Cascade Rules

To prevent accidental data loss while ensuring clean lifecycle management:
* **Critical Compliance Records (`onDelete: Restrict`):**
  * `Contract.site`: Cannot delete a physical site if an active contract references it.
  * `Equipment.site`: Cannot delete a site without decommissioning or transferring equipment.
  * `Certificate.provider`: Cannot delete a service contractor profile if issued compliance certificates reference it.
* **Dependent Operational Child Items (`onDelete: Cascade`):**
  * `User.customerProfile` / `User.providerProfile`: Deleting an account cascades to its role profile.
  * `VisitRecord.checklistResponses`: Deleting a draft visit cascades to its unfinished checklist answers.
  * `VisitRecord.attachments`: Attachments linked to an uncommitted visit cascade to metadata cleanup.

---

## 3. Database Indexing Strategy (71 Indexes)

Every high-cardinality foreign key and frequent query filter is indexed:
* **Tenant Foreign Keys:** `customerId`, `providerId`, `siteId` on all operational tables ensure zero table scans during multi-tenant filtering.
* **Temporal & Status Queries:** Indexes on `status`, `targetDate`, `nextInspectionDueDate`, and `createdAt` accelerate dashboard metric calculations and SLA alerting.
* **Unique Lookups:** Unique indexes on `User.email`, `Equipment.qrCodeIdentifier`, `Contract.contractNumber`, `Certificate.certificateNumber`, and `VisitRecord.idempotencyKey` enforce data integrity at the database engine level.
