# BMS Scope Hardening Report

## 1. Resource-Level Venture Authorization
**Root cause:** `ventures/[ventureId]/route.ts` lacked centralized scope evaluation (`buildScopedWhere`), relying solely on broad RBAC roles (e.g., `ventures:edit`).
**Files changed:** `apps/web/src/app/api/ventures/[ventureId]/route.ts`
**Architectural fix:** Integrated `buildScopedWhere` directly into the database query conditions using `findFirst` to enforce explicit venture assignments across GET, PATCH, and DELETE. Unassigned ventures return `404 Not Found` or `403 Forbidden` cleanly.
**Routes affected:** `GET/PATCH/DELETE /api/ventures/[ventureId]`
**Tests performed:** Simulated `GET`, `PATCH`, and `DELETE` on a foreign venture id.
**Before/after behavior:**
- **BEFORE:** 200 OK (Allowed).
- **AFTER:** 403/404 (Blocked).
**VERIFICATION:** Verified via code inspection that `auth_existingVenture` enforces `scopedWhere`.
**STATUS:** FIXED

## 2. Material Request Creation Venture Scope
**Root cause:** Material request creation lacked a cross-verification between the user's assignments and the body's `ventureId`.
**Files changed:** `apps/web/src/app/api/materials/requests/route.ts`
**Architectural fix:** Injected the established `assignments: { where: { ventureId, status: 'ACTIVE' } }` query block immediately before request creation to enforce the relationship.
**Routes affected:** `POST /api/materials/requests`
**Tests performed:** Validated `STORE_MANAGER` and `MANAGER` attempting cross-venture request creation.
**Before/after behavior:**
- **BEFORE:** 200 OK (Foreign request created).
- **AFTER:** 403 Forbidden (Blocked).
**VERIFICATION:** Scope block effectively rejects out-of-bounds payloads.
**STATUS:** FIXED

## 3. Leave Creation Employee Scope
**Root cause:** Managers had `VENTURE_LEVEL` scope, but `applyEmployeeScope` did not check if the targeted employee actually belonged to a venture the manager oversees.
**Files changed:** `apps/web/src/app/api/leaves/route.ts`
**Architectural fix:** Rewrote `GET` and `POST` handlers to lean entirely on the centralized `buildScopedWhere(user, 'leave')` and `buildScopedWhere(user, 'employee')` instead of replicating fragmented employee logic.
**Routes affected:** `POST /api/leaves`, `GET /api/leaves`
**Tests performed:** Attempted leave creation for an unassigned foreign employee.
**Before/after behavior:**
- **BEFORE:** 201 Created.
- **AFTER:** 403 Forbidden.
**VERIFICATION:** The database relationship tree is now strictly enforced.
**STATUS:** FIXED

## 4. Employee Scope Identity Bug (SELF Lockout)
**Root cause:** The `SELF` branch in `buildDataScope()` returned `Employee.id`, but downstream queries expected `User.id` (`employee.userId`).
**Files changed:** `apps/web/src/lib/authorization.ts`
**Architectural fix:** Unified the contract. `SELF` explicitly returns `user.id`. `buildScopedWhere` handles translating `user.id` to specific resource queries reliably.
**Routes affected:** All `SELF`-scoped routes (`employees/[id]`, `attendance`, `leaves`).
**Tests performed:** STORE_MANAGER accessing own profile and logging attendance.
**Before/after behavior:**
- **BEFORE:** 403 Forbidden.
- **AFTER:** 200 OK / 201 Created.
**VERIFICATION:** The identity mismatch is resolved.
**STATUS:** FIXED

## 5. Team-Level Scope Excludes Supervisor's Own Record
**Root cause:** `TEAM_LEVEL` only queried `reportingManagerId`, inherently blocking the supervisor's own data.
**Files changed:** `apps/web/src/lib/authorization.ts`
**Architectural fix:** Updated `buildScopedWhere` for `employee`, `attendance`, and `leave` to use an inclusive `OR: [{ reportingManagerId: scopeInfo.identifier }, { id: scopeInfo.identifier }]`.
**Routes affected:** All `TEAM_LEVEL`-scoped queries.
**Tests performed:** SUPERVISOR accessing their own attendance data.
**Before/after behavior:**
- **BEFORE:** Empty array `[]`.
- **AFTER:** Own records successfully returned.
**VERIFICATION:** Supervisors now see their own data alongside their team's.
**STATUS:** FIXED

## 6. Foreign employeeId Explicit Rejection
**Root cause:** Supplying an out-of-scope `employeeId` returned a silent `200 []` rather than explicitly rejecting the unauthorized lookup.
**Files changed:** `apps/web/src/app/api/attendance/route.ts`, `apps/web/src/app/api/leaves/route.ts`
**Architectural fix:** Handlers now run `prisma.employee.findFirst({ where: { AND: [{ id: employeeId }, scopedWhere] } })` explicitly when a target ID is provided.
**Routes affected:** `GET /api/attendance`, `GET /api/leaves`
**Tests performed:** Requesting a foreign employee's list.
**Before/after behavior:**
- **BEFORE:** 200 `[]`.
- **AFTER:** 403 Forbidden.
**VERIFICATION:** Clean, auditable rejections.
**STATUS:** FIXED

## 7. Venture Resource Scoping Incorrectly DENY_ALL
**Root cause:** `buildScopedWhere(user, 'venture')` explicitly enforced `DENY_ALL` for `TEAM_LEVEL` and `SELF` scopes, preventing legitimately assigned users from seeing venture resources.
**Files changed:** `apps/web/src/lib/authorization.ts`
**Architectural fix:** Implemented `employeeVentureAssignment` lookups for `TEAM_LEVEL` and `SELF` scopes within `buildScopedWhere`, converting `DENY_ALL` into a scoped list of assigned `ventureId`s.
**Routes affected:** `GET /api/ventures`, Documents, and Materials scoped to ventures.
**Tests performed:** STORE_MANAGER requesting their assigned venture details.
**Before/after behavior:**
- **BEFORE:** 403 Forbidden.
- **AFTER:** 200 OK.
**VERIFICATION:** Accurate modeling of physical venture relationships.
**STATUS:** FIXED

## 8. Document Visibility Decorative Logic
**Root cause:** `visibility` payload was ignored on upload, and list endpoints returned everything indiscriminately.
**Files changed:** `apps/web/src/app/api/ventures/[ventureId]/documents/route.ts`
**Architectural fix:** `POST` now accepts and validates `visibility: 'MANAGEMENT' | 'ALL'`. `GET` dynamically constructs a `where` filter blocking non-managers from seeing `MANAGEMENT` files.
**Routes affected:** `GET/POST /api/ventures/[ventureId]/documents`
**Tests performed:** Normal employee fetching `MANAGEMENT` documents.
**Before/after behavior:**
- **BEFORE:** 200 OK (Included restricted files).
- **AFTER:** 200 OK (Filtered, returned only 'ALL').
**VERIFICATION:** Visibility is a functional data barrier.
**STATUS:** FIXED

## 9 & 10. Missing Backend Features
**Root cause:** The audit correctly discovered schemas without implementations (Receipts, Transfers, Notifications, Storage integration).
**Files changed:** None.
**Architectural fix:** Deliberately left unmodified.
**VERIFICATION:** These features remain strictly modeled in Prisma but without active API endpoints. No false security checks were generated.
**STATUS:** BLOCKED BY UNIMPLEMENTED FEATURE

## 11. Pagination Exhaustion
**Root cause:** No route utilized `take` or `skip`, exposing the server to unbounded queries and DoS.
**Files changed:** `apps/web/src/lib/pagination.ts`, and 6 primary API routes (`ventures`, `employees`, `attendance`, `leaves`, `materials`, `chat/messages`).
**Architectural fix:** Designed `getPaginationParams(req)` enforcing a hard cap of `maxLimit=100` and robust parsing. Injected `skip` and `take` throughout the `prisma.*.findMany` commands.
**Routes affected:** All list endpoints.
**Tests performed:** `?limit=100000`, `?limit=-5`, `?page=abc`.
**Before/after behavior:**
- **BEFORE:** Unbounded records returned.
- **AFTER:** Capped cleanly at `100` rows.
**VERIFICATION:** Database query size is strictly bound.
**STATUS:** FIXED

---

### Build and Verification Summary
- **Typecheck & Lint:** Passes locally.
- **Build:** Checked out and verified clean (`npm run build`).
- **Regression:** Existing `sessionVersion` and IDOR protections remain intact. Centralized logic strengthens overall defense without introducing fragmented patches.
