# BMS Adversarial Regression Report
**Date:** 2026-10-06
**Scope:** Independent QA & Security Verification for P0/P1 Bug Remediation Checklist

## Overview
The following checks were executed to independently verify the integrity of the previous architectural refactoring. The results demonstrate that while structural improvements (centralized `requireAuth()`, explicit database locking for concurrency) hold perfectly, several bypasses still exist in endpoints where the scoped authorization logic is completely omitted.

---

### Finding 1: Venture Endpoint IDOR Bypass
**TEST:** Manager A attempts to `GET`, `PATCH`, and `DELETE` Venture B by accessing `/api/ventures/[ventureId]`.
**EXPECTED:** `403 Forbidden` or `404 Not Found` (due to restricted row-level scope).
**ACTUAL:** Server processes the request successfully.
**PASS/FAIL:** ❌ **FAIL**
**SECURITY IMPACT:** High. A Manager can read sensitive project details, artificially inflate expected budgets, modify start dates, or even completely DELETE a venture belonging to another manager.
**DATABASE IMPACT:** Complete compromise of Venture entity isolation.
**REPRODUCTION:**
1. Authenticate as a Manager assigned exclusively to `VENTURE_A`.
2. Send `GET /api/ventures/[VENTURE_B_ID]`.
3. The API returns full entity data instead of a 403, because `GET /api/ventures/[ventureId]/route.ts` queries the DB via `{ where: { id: ventureId } }` but completely omits the `buildScopedWhere(user, 'venture')` boundary check that exists in the list endpoint.
4. The same omission exists on `PATCH` and `DELETE`.

---

### Finding 2: Inventory Concurrency Protection
**TEST:** Two genuinely concurrent `POST /api/materials/issue` requests attempting to issue 8 units from a stock location containing only 10 units.
**EXPECTED:** One request succeeds, one throws `409 Insufficient stock`, final physical quantity is exactly 2.
**ACTUAL:** Exact expected behavior.
**PASS/FAIL:** ✅ **PASS**
**SECURITY IMPACT:** None. The concurrency attack vector has been fully neutralized.
**DATABASE IMPACT:** The database natively rejects the concurrent transaction due to the robust `availableQuantity: { gte: qty }` predicate in the `updateMany` operation, triggering a safe rollback on the overlapping process.
**REPRODUCTION:**
1. Call `POST /api/materials/issue` from two detached background processes simultaneously.
2. PostgreSQL locks the row on the first `updateMany` hit, and immediately rejects the second because `2 >= 8` evaluates to false.

---

### Finding 3: Leave Concurrency & Approval Lock
**TEST:** Two managers belonging to the same venture concurrently approve the same PENDING Leave request.
**EXPECTED:** One approval applies the balance deduction, the second request fails cleanly, leaving the balance reduced by exactly 1 leave quantum.
**ACTUAL:** Exact expected behavior.
**PASS/FAIL:** ✅ **PASS**
**SECURITY IMPACT:** None. 
**DATABASE IMPACT:** No double-deduction.
**REPRODUCTION:**
1. Fire two `PATCH /api/leaves/[id]` with `action: 'APPROVE'` simultaneously.
2. `leave.service.ts` uses `updateMany({ where: { id: leaveId, status: 'PENDING' } })`. The second transaction evaluates `res.count === 0` and appropriately rolls back the balance deduction.

---

### Finding 4: Inactive Account & Role Revocation Persistence (Stale Session)
**TEST:** Authenticate as a user, fetch a valid NextAuth Session Cookie. Admin deactivates the user or downgrades them. Make an API request with the existing valid cookie.
**EXPECTED:** `401 Unauthorized` or `403 Forbidden`.
**ACTUAL:** `401 Unauthorized`.
**PASS/FAIL:** ✅ **PASS**
**SECURITY IMPACT:** None.
**DATABASE IMPACT:** None.
**REPRODUCTION:**
1. The recent mass-refactoring replaced `getServerSession()` with the strict `requireAuth()` validator across all routes.
2. Every request now queries the DB for `isActive` and live `role` assignments, causing the stale cookie to be rightfully rejected.

---

### Finding 5: Bcrypt Resource Exhaustion (72-byte Limit)
**TEST:** Send a massive 1MB password payload during sign-in to trigger CPU-bound denial of service via bcrypt hash cycles.
**EXPECTED:** `400 Bad Request` or immediate failure before hashing begins.
**ACTUAL:** Immediate rejection.
**PASS/FAIL:** ✅ **PASS**
**SECURITY IMPACT:** None.
**DATABASE IMPACT:** None.
**REPRODUCTION:**
1. Submit login payload where `Buffer.byteLength(password, 'utf8') > 72`.
2. Handled gracefully by the explicit limit inside `auth.ts` `authorize` callback.

---

### Finding 6: Silent Material Category Creation on POST
**TEST:** Send a `POST /api/materials` request with an arbitrary `categoryName` that does not exist in the dictionary.
**EXPECTED:** The system creates the category, but this must be explicitly audited and validated.
**ACTUAL:** Category is created silently via `findFirst` fallback to `create` without explicit authorization context indicating category creation was intended.
**PASS/FAIL:** ❌ **FAIL (Architectural Policy)**
**SECURITY IMPACT:** Low/Moderate. Allows Managers to clutter the global material dictionary with typos or duplicate categories/UOMs since there's no strict referential requirement for existing catalog items.
**DATABASE IMPACT:** Catalog fragmentation.
**REPRODUCTION:**
1. Manager submits `POST /api/materials` with `categoryName: 'Cemnt'`.
2. A new `Cemnt` global category is spawned instead of rejecting the payload and demanding an existing category ID.

---

### Summary Verdict
The architectural patterns implemented for **Session Validation**, **Transaction Atomicity (Inventory & Leave)**, and **Brute Force/DOS limits** are solid and completely pass the adversarial checks. 

However, **RBAC filtering is not universally applied**. The `buildScopedWhere` utility exists but is manually invoked, meaning several detail-endpoints (like `/api/ventures/[ventureId]`) remain completely exposed to IDOR. Furthermore, Audit Logging is missing system-wide.
