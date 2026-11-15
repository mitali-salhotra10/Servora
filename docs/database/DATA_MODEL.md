# Servora — Database Schema & Data Model Specification

**ORM:** Prisma 5.22.0  
**Database Engine:** PostgreSQL 17.11  
**Source File:** [`backend/prisma/schema.prisma`](file:///c:/Users/MITALI%20SALHOTRA/OneDrive/Desktop/Servora/backend/prisma/schema.prisma)

---

## 1. Domain Entities & Fields

### 1.1 `User` (Identity & Authentication)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `email` | `String` | `@unique` | Corporate login email |
| `passwordHash` | `String` | | Salted bcrypt hash (cost 10) |
| `phone` | `String?` | | Optional contact phone |
| `role` | `UserRole` | `@default(CUSTOMER)` | `ADMIN`, `CUSTOMER`, `SERVICE_MANAGER`, `TECHNICIAN` |
| `tokenVersion` | `Int` | `@default(1)` | Invalidation counter for refresh tokens |
| `isActive` | `Boolean`| `@default(true)` | Soft-disable flag |
| `createdAt` | `DateTime` | `@default(now())` | Registration timestamp |

### 1.2 `Site` (Facility Location)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `customerId` | `String` | `FK -> CustomerProfile.id` | Tenant organization boundary |
| `siteName` | `String` | | Building or campus name |
| `address` | `String` | | Street address |
| `city` | `String` | | City |
| `state` | `String` | | State or province |
| `postalCode` | `String` | | Postal or ZIP code |
| `latitude` | `Decimal` | `@db.Decimal(10, 7)` | GPS Latitude (WGS 84) |
| `longitude` | `Decimal` | `@db.Decimal(10, 7)` | GPS Longitude (WGS 84) |
| `geofenceRadiusMeters` | `Int` | `@default(150)` | Radius for technician check-in |

### 1.3 `Equipment` (Fire-Safety Asset)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `siteId` | `String` | `FK -> Site.id` | Facility where asset is installed |
| `serialNumber` | `String` | | Manufacturer serial number |
| `qrCodeIdentifier`| `String` | `@unique` | Scannable QR code identifier |
| `equipmentType` | `EquipmentType` | | `FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM_PANEL`, `DETECTOR_SENSOR` |
| `specification` | `String` | | e.g. "10lb ABC Dry Chemical", "Class II Hydrant" |
| `locationInSite`| `String` | | e.g. "Floor 2, Corridor East near Stairwell B" |
| `status` | `EquipmentStatus` | `@default(OPERATIONAL)` | `OPERATIONAL`, `NEEDS_MAINTENANCE`, `DECOMMISSIONED` |
| `lastInspectionDate` | `DateTime?`| | Date of most recent inspection |
| `nextInspectionDueDate`| `DateTime?`| | Recalculated due date based on frequency |

### 1.4 `VisitSchedule` (Scheduled Maintenance)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `siteId` | `String` | `FK -> Site.id` | Target facility |
| `contractId` | `String?` | `FK -> Contract.id` | Associated AMC |
| `serviceRequestId`| `String?` | `FK -> ServiceRequest.id` | Associated defect ticket |
| `assignedTechnicianId`| `String?` | `FK -> User.id` | Assigned field technician |
| `targetDate` | `DateTime` | | Scheduled execution date |
| `dueDate` | `DateTime` | | SLA deadline date |
| `status` | `VisitStatus` | `@default(PLANNED)` | `PLANNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE` |

### 1.5 `VisitRecord` (Cryptographic Inspection Record)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `visitScheduleId`| `String` | `@unique, FK -> VisitSchedule.id` | Enforces 1-to-1 relationship |
| `idempotencyKey` | `String` | `@unique` | Client UUID v4 for duplicate suppression |
| `checkInLatitude`| `Decimal` | `@db.Decimal(10, 7)` | Technician GPS at check-in |
| `checkInLongitude`| `Decimal` | `@db.Decimal(10, 7)` | Technician GPS at check-in |
| `isGeofenceVerified`| `Boolean`| | Server-calculated Haversine verification |
| `recordHash` | `String` | | SHA-256 seal of canonical JSON payload |
| `customerSignerName`| `String?`| | Representative witness name |
| `customerSignatureData`| `String?`| `@db.Text` | Base64 SVG signature vector |

---

## 2. Enums Reference (15)

1. `UserRole`: `CUSTOMER`, `SERVICE_PROVIDER`, `SERVICE_MANAGER`, `ADMIN`
2. `ProviderVerificationStatus`: `PENDING_VERIFICATION`, `VERIFIED`, `SUSPENDED`
3. `EquipmentType`: `FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM_PANEL`, `DETECTOR_SENSOR`
4. `EquipmentStatus`: `OPERATIONAL`, `NEEDS_MAINTENANCE`, `DECOMMISSIONED`
5. `ContractFrequency`: `MONTHLY`, `QUARTERLY`, `BI_ANNUAL`, `ANNUAL`
6. `ContractStatus`: `DRAFT`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `TERMINATED`
7. `VisitStatus`: `PLANNED`, `ASSIGNED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED`
8. `VisitType`: `RECURRING_MAINTENANCE`, `EMERGENCY_INSPECTION`, `REPAIR_REFILL`
9. `DomainCategory`: `FIRE_EXTINGUISHER`, `FIRE_HYDRANT`, `FIRE_ALARM`, `GENERAL_SAFETY`
10. `AttachmentType`: `PHOTO_BEFORE`, `PHOTO_AFTER`, `PRESSURE_GAUGE`, `SIGNATURE_IMAGE`, `DEFECT_PROOF`
11. `CertificateStatus`: `VALID`, `REVOKED`, `EXPIRED`
12. `ServiceRequestUrgency`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
13. `ServiceRequestStatus`: `SUBMITTED`, `TRIAGED`, `DISPATCHED`, `RESOLVED`, `CLOSED`, `CANCELLED`
14. `AuditAction`: `USER_LOGIN`, `USER_LOGOUT`, `SITE_CREATED`, `EQUIPMENT_REGISTERED`, `VISIT_SCHEDULED`, `VISIT_ASSIGNED`, `INSPECTION_SUBMITTED`, `CERTIFICATE_GENERATED`, `CONTRACT_ACTIVATED`, `TAMPER_ALARM`
15. `NotificationType`: `INSPECTION_OVERDUE`, `VISIT_ASSIGNED`, `CERTIFICATE_ISSUED`, `DEFECT_REPORTED`
