# Servora — Authentication & Role-Based Access Control (RBAC)

**Document Version:** 1.0.0  
**Security Standard:** OWASP Top 10 Compliant Authentication Architecture  
**Encryption / Hashing:** bcrypt (Salt Factor 10), HMAC-SHA256 (JWT)

---

## 1. Authentication Lifecycle

Servora implements a secure, stateless JWT authentication architecture:

```
[Client]                                              [Backend API]
   │                                                        │
   ├───► 1. POST /api/v1/auth/login { email, password } ───►│
   │                                                        ├─► Validates via Zod schema
   │                                                        ├─► Retrieves User by email
   │                                                        ├─► Verifies bcrypt password hash
   │                                                        └─► Issues Access & Refresh Tokens
   │◄─── 2. HTTP 200 { accessToken, refreshToken, user } ◄──┤
   │                                                        │
   ├───► 3. API Request: Authorization: Bearer <accessToken>┼─► Validates signature & expiry
   │                                                        └─► Attaches req.user { id, role, orgId }
   │◄─── 4. HTTP 200 Protected Resource Payload ───────────┤
```

### 1.1 Credential & Token Specifications
* **Password Hashing:** Passwords are never stored or logged in plaintext. They are hashed using `bcrypt` with cost factor 10. Passwords must contain $\ge 8$ characters, at least one numeral, and at least one special character.
* **Access Tokens:** Signed with `JWT_SECRET` via `jsonwebtoken`. Expire after **15 minutes** (`15m`).
* **Refresh Tokens:** Signed with `JWT_SECRET`. Expire after **7 days** (`7d`). Can be exchanged at `POST /api/v1/auth/refresh`.
* **Zero Account Enumeration:** Invalid login attempts return uniform `HTTP 401 Unauthorized` with message `"Invalid email or password"`.
* **Zero Demo Fallback in Production:** In production (`NODE_ENV === 'production'`), demo fallback logic is disabled. Invalid passwords for demo accounts are strictly rejected.

---

## 2. Role-Based Permissions Matrix

Servora defines four distinct system roles with granular access boundaries:

| API Domain / Resource | ADMIN | SERVICE_MANAGER | CUSTOMER | TECHNICIAN |
| :--- | :---: | :---: | :---: | :---: |
| **Platform Dashboard Metrics** | Full Global | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Provider Dashboard Metrics** | Global View | Own Provider Org | ❌ Forbidden | ❌ Forbidden |
| **Customer Dashboard Metrics** | Global View | ❌ Forbidden | Own Customer Org | ❌ Forbidden |
| **Technician Manifest** | Global View | All Provider Techs | ❌ Forbidden | Assigned Visits Only |
| **Create / Manage Sites** | Any Site | Assigned AMCs | Own Organization | ❌ Read Only |
| **Register / Edit Equipment** | Any Equipment| Assigned Sites | Own Facilities | Status Update Only |
| **Raise Service Requests** | Any | ❌ Forbidden | Own Facilities | ❌ Forbidden |
| **Schedule Visits & Assign Tech**| Any | Own Provider Org | ❌ Forbidden | ❌ Forbidden |
| **Submit Field Inspections** | Any | Any | ❌ Forbidden | Assigned Visits Only |
| **Issue Compliance Certificates**| Any | Permitted AMCs | ❌ Forbidden | ❌ Forbidden |
| **View Audit Logs** | Global | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **Public Certificate Portal** | Public | Public | Public | Public |

---

## 3. Direct API Tenant Isolation (IDOR Defense)

Tenant isolation is enforced in the **backend service tier**, not merely in frontend navigation:

1. **Contracts (`GET /api/v1/contracts/:id`):**
   * If `user.role === 'CUSTOMER'`: Rejects requests where `contract.customerId !== user.organizationId` with `HTTP 403 Forbidden`.
   * If `user.role === 'SERVICE_PROVIDER'` or `'TECHNICIAN'`: Rejects requests where `contract.providerId !== user.organizationId` with `HTTP 403 Forbidden`.
2. **Attachments (`GET /api/v1/attachments/:id`):**
   * Inspects `visitRecord.visitSchedule.site.customerId`. Cross-tenant requests return `HTTP 403 Forbidden`.
3. **Sites & Facilities (`GET /api/v1/sites/:id`):**
   * Verifies `site.customerId === user.organizationId`. Customers cannot view other companies' facilities.
