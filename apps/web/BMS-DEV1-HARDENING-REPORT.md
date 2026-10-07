# BMS — Developer 1 Hardening Report

**Scope:** Auth/platform, database consistency, error handling, ventures, employees, employee assignments, employee documents, certifications.
**Branch:** `developer` (uncommitted working tree)
**Date:** 2026-10-07

Every result below comes from a command that was actually run. The commands and their outputs are in [§5 Validation](#5-validation-actual-command-results).

---

## 1. Summary

| Area | Result |
|---|---|
| `sessionVersion` login problem | **Fixed.** There were two causes. (a) The generated Prisma client was stale: it had no `sessionVersion` and listed 6 roles. (b) **Login hung indefinitely whenever Redis was down.** The rate limiter checked `redis.isOpen`, which is true while the client is still reconnecting, so `redis.get()` queued forever. The live DB itself was already correct. |
| Migration history | **Fixed.** The only migration file was UTF-16 encoded, out of date and never applied, because the live DB was built with `db push`. The history is now real: 3 migrations, baselined on the live DB with `migrate resolve`. `migrate status` is clean and the diff between live DB and schema is empty. |
| Role drift | **Fixed.** The canonical roles are `ADMIN`, `MANAGER` and `SUPERVISOR`, and they agree in the schema, the Postgres enum, `@builder/types`, permissions, middleware, API, seed and tests. Legacy roles are mapped by migration: `PROJECT_MANAGER→MANAGER`, `SITE_ENGINEER→SUPERVISOR`, `STORE_MANAGER→SUPERVISOR` (the team's own scripts already used that mapping). The superseded one-off role scripts were deleted. |
| Central error mapper / safe JSON / Zod conventions | **Done.** All in-scope routes use them, and none return raw Prisma or Postgres messages. |
| Ventures, employees, assignments, documents, certifications | **Done** (details in §3). |
| Tests | **Added:** 46 unit tests, 52 integration tests against real Postgres and the real migration history, and 7 end-to-end HTTP checks against `next start`. All pass. |
| `npm run lint` | **Could not run.** ESLint was never configured in this repo; see P1-3. |

---

## 2. Migrations and schema changes

Migrations are in `src/prisma/migrations/`. A `migration_lock.toml` was added.

| Migration | Purpose | Live DB |
|---|---|---|
| `20261005112800_init_hr` | Original baseline. Re-encoded from UTF-16 to UTF-8; the SQL is unchanged. | Marked applied (`migrate resolve --applied`), because the live DB already contained it |
| `20261007090000_canonical_roles_session_version` | Collapses legacy roles into the 3-value `UserRole` enum with data mapping. Adds `users.sessionVersion`. Replaces free-text `employees.reportingManager` with the `reportingManagerId` FK; values that reference an employee id or code are carried over. | Marked applied, because the live DB was already in this state from the earlier `db push` |
| `20261007100000_dev1_hardening` | See below | **Applied with `prisma migrate deploy`** |

`20261007100000_dev1_hardening` makes these changes:
- `employee_certifications.issueDate` and `expiryDate` become `DATE`, so they carry date-only business semantics. The table had 0 rows.
- New unique index on `employee_certifications (employeeId, certification, certificateNo)`. This is the duplicate policy.
- `employee_documents` gets `storageKey` (unique), `mimeType`, `fileSize` and `uploadedById`.
- `venture_documents` gets `storageKey` (unique).
- Data changes:
  - Legacy access levels are normalized: `FULL_PROJECT_ACCESS→FULL_ACCESS` (1 row), `MATERIAL_ACCESS→MATERIALS_ONLY` (1 row), `OPERATIONS_ACCESS→OPERATIONS`.
  - Employee emails are lowercased and trimmed.
  - Empty email and phone strings become NULL.

**How the migrations were verified before touching the live DB:** on a throwaway local Postgres (`embedded-postgres`, outside the repo):
- The full chain replays from empty to the current schema with an empty diff.
- Legacy rows with `STORE_MANAGER`, `PROJECT_MANAGER` and `SITE_ENGINEER` roles, plus a text `reportingManager`, were migrated and checked.
- `prisma db push` and `--accept-data-loss` were **not** used.

---

## 3. What changed, by area

### 3.1 Platform (Part A)

**Error mapping**
- `lib/http/errors.ts` is the single place that turns errors into responses:
  - Prisma: `P2002→409` (message names the resource), `P2003→400` (with the FK column as `field`), `P2025→404`, `P2000→400`, `P2034→409`.
  - `ZodError→400` (`field` plus every issue).
  - Malformed JSON → 400.
  - Auth failure → 401; permission failure → 403.
  - `ApiError` carries the status for business conflicts such as 409.
  - Anything else → a generic 500. Raw messages are logged server-side only.
- Error responses have the shape `{ success: false, error, code, field?, details? }`. `success`, `error` and `field` are the same as before.

**Request handling**
- `lib/http/request.ts`: `readJsonObject` and `parseBody` return a clean 400 for malformed, empty or non-object bodies, 413 for bodies over 1 MB, and 415 for the wrong content type.
- `lib/http/handler.ts`: `apiHandler()` wraps every route, so the pipeline is parse → authenticate → permission → scope → validate → service (transaction plus audit) → response. Route handlers are now about 5–15 lines and contain no business logic.
- `lib/validation/common.ts` holds the Zod conventions:
  - Strings are trimmed; whitespace-only required values are rejected.
  - `''` means "clear the value"; an absent key means "leave unchanged".
  - Every string has a maximum length.
  - Numbers must be finite and are range-checked.
  - Dates are parsed strictly: `2026-02-29` is rejected instead of rolling over to 1 March.
  - "Today" is the IST calendar day.
  - The VENT-03 to VENT-09 fixes now sit on this shared layer.

**One account policy**
- `lib/policies/account.ts` (`isAccountUsable`): a user may act only if the User row is active **and** the linked Employee is not `TERMINATED`.
- It is applied in exactly three places: login (`authorize`), every token decode (`jwt` callback) and every protected API (`requireAuth`). No route repeats the check.

**Sessions**
- Logout, deactivation and termination increment `sessionVersion`, which revokes existing JWTs on their next use.
- Role changes are re-read on every token decode, so a role downgrade takes effect immediately.

**Redis**
- `lib/redis.ts` now sets `disableOfflineQueue: true`, and `auth.ts` checks `redis.isReady`. Login no longer hangs when Redis is unavailable.

**Permissions**
- `assertPermission()` and `requirePermission()` now throw a typed 403.
- ADMIN-only permissions are now named explicitly: `employees:create`, `employees:terminate`, `admin:users`.

### 3.2 Ventures (Part B)

**Resource scope** (`lib/scope.ts`: `requireVentureInScope`)
- Used by every venture resource route: GET, PATCH and DELETE, plus `archive`, `members`, `settings`, `announcements`, `activity`, `documents`, `materials` and document downloads.
- Out-of-scope requests return 404, the same as a missing venture, so existence isn't leaked.
- Previously `archive` and `members` had **no** scope check, and `materials` let any role with `materials:stock` read any venture.
- The venture detail GET also leaked documents marked MANAGEMENT-only to supervisors; it now applies the visibility rule.

**Delete lifecycle**
- Hard delete is allowed only when a venture has no business history: assignments, stock, transactions, requests, receipts, issues, transfers, returns, adjustments, consumptions, documents, announcements, chat messages, or any audit entry other than its creation.
- Otherwise it returns 409 with the history counts in `details.history` and tells the caller to archive instead.
- Archiving is audited and returns 409 if the venture is already archived.

**PATCH audit**
- Every PATCH writes `UPDATE_VENTURE` in the same transaction as the change.
- It records old and new values for all six leadership fields, `estimatedBudget`, `status`, `name`, `type`, all dates and `progressPercentage`, and lists any other fields that were updated.
- Venture creation, deletion, archiving, settings changes, announcements and document uploads are audited the same way.

**Other venture changes**
- A duplicate code returns 409 `"A venture with this code already exists."` This was verified with 3 concurrent requests: one succeeded, two got 409, and exactly one row was created.
- Leaders must be eligible: they must exist, not be terminated, have an active login and have a linked User account (`lib/policies/employeeEligibility.ts`).
- The venture rules from earlier rounds are kept on the shared layer: date order, coordinate pairs, and number and date validation.
- The GET list validates `status` and `type` filters (an invalid filter used to cause a Prisma 500).

### 3.3 Employees (Part C)

**Validation**
- `lib/validation/employee.ts` is the single authoritative schema. The unused, conflicting `EmployeeSchema` in `@builder/validation` was removed.
- It covers firstName, lastName, email, phone, designation, department, joiningDate (strict `YYYY-MM-DD`, between 1950 and one year from today), reportingManagerId, employmentType (UI allowlist), status, and the onboarding stage and status.

**Email and phone**
- Emails are lowercased and validated.
- Phones are normalized to E.164 (`+919845022341`):
  - Bare 10-digit and `0`-prefixed numbers are treated as Indian.
  - Indian numbers must be valid mobile numbers.
  - Other countries are accepted if they have 8–15 digits.

**Duplicate protection**
- Email is checked case-insensitively. Phone is checked on normalized digits, so legacy rows stored as `+91 98450 22341` still match.
- Checks run inside the transaction under a Postgres advisory lock, so concurrent creates can't both succeed (verified: 3 concurrent requests gave 1×201 and 2×409).

**Reporting hierarchy**
- Self-reference, 2-cycles, 3-cycles and cycles of any length are rejected.
- The check walks the manager chain under a hierarchy lock.
- The new manager must exist, not be terminated, and not have an inactive linked User.
- A manager *without* a login account is allowed, because foremen in the field hierarchy may not have logins.
- An invalid manager id returns 400, not a raw FK error.

**Scope**
- Employee GET, PATCH and DELETE, documents, certifications, skills, assignments and onboarding all go through `requireEmployeeInScope`, the same rule as the employee list.
- A MANAGER can't read or modify employees outside their ventures.
- Several of these routes previously only checked that a session existed.

**Employee codes**
- `EMP-####` codes are generated under a lock from the highest existing number. The old `count()+1000` approach produced collisions under concurrency.

**Termination lifecycle** (`services/employee.service.ts`)

Termination is a single lifecycle operation, used by both `DELETE /api/employees/:id` and `PATCH status=TERMINATED`. Only ADMIN may run it.

It is **blocked with a 409** while the employee:
- leads any open venture, or
- is the reporting manager of any employee who isn't terminated.

These need a human to decide who takes over, so they are never reassigned automatically.

When termination succeeds, these happen **automatically**:
- status becomes `TERMINATED`;
- every active assignment becomes `COMPLETED` with an end date;
- pending leave requests become `CANCELLED`;
- the linked User gets `isActive=false` and `sessionVersion+1`, which kills existing sessions immediately;
- the change is audited.

After termination:
- The account policy rejects the user everywhere.
- The eligibility policy stops them being picked as a leader or reporting manager.
- Editing a terminated employee returns 409.
- Reactivating restores the login, but old sessions stay revoked.

### 3.4 Assignments (Part C.11)

The policy is in `services/assignment.service.ts`.
- The employee and venture must exist and both must be within the actor's scope.
- A MANAGER may assign employees who are already in their scope, or employees with no active assignment. This stops a manager from pulling staff off ventures they don't manage.
- Terminated employees and closed or archived ventures return 409.
- Access levels are limited to `STANDARD`, `FULL_ACCESS`, `OPERATIONS`, `MATERIALS_ONLY` and `READ_ONLY`.
- A duplicate active assignment returns 409. This is enforced under a per-employee lock (verified with concurrent requests).
- The existing single-active-assignment behaviour is kept. A past assignment to the same venture is reactivated, because `(employeeId, ventureId)` is unique.
- **Leadership protection:** an assignment can't be ended, removed or replaced while the employee leads that venture. This returns 409 with the role names.
- Every change is audited.

### 3.5 Documents (Part D)

Real multipart uploads are implemented. Placeholder URLs are gone.

**Server-side checks**
- Size limit of 10 MB, enforced while the upload is still streaming.
- Allowed types: PDF, PNG, JPEG, WEBP, DOCX and XLSX. The extension, the declared MIME type and the **magic bytes** must all agree.
- Filenames are sanitized and used for display only.
- Null bytes and path traversal are rejected.

**Storage**
- Storage keys are generated by the server: `<area>/<ownerId>/<uuid>.<ext>`. There is no client-controlled path, and keys are re-validated and kept inside the storage root.
- Driver: local private directory by default (`UPLOAD_DIR`, default `apps/web/storage/uploads`, gitignored), or S3 when `STORAGE_DRIVER=s3`.
- Downloads go through authenticated, scope-checked routes, with venture document visibility enforced: `GET /api/documents/:id/file` and `GET /api/ventures/:id/documents/:docId/file`. Responses use `Content-Disposition: attachment` and `nosniff`.
- If the database write fails after the file is stored, the file is deleted again. All errors go through the central mapper.

**JSON "uploads"**
- Requests that send JSON with a `fileUrl` now get a 415 response.
- Legacy rows that have no stored file report "No file is stored for this document".

**Frontend**
- The profile document modal and the Add Employee form now upload the real files. The Add Employee form previously read the files and then discarded them.
- The venture "Upload Document" button previously had no handler; it now uploads.
- The fake "Download" span became a real link, or "File not available" for legacy rows.
- The static mock page `/employees/[id]/documents` now redirects to the profile's real document vault.

### 3.6 Certifications (Part E)

- Dates are strict `YYYY-MM-DD` and stored as `DATE`.
- `issueDate` must be no later than `expiryDate`, and must fall between 1950 and today. `expiryDate` must be no later than 2100.
- **Status uses date-only semantics in IST.** A certificate is valid *through* its expiry day:
  - expiry before today → `Expired`;
  - expiry from today up to 30 days out → `Expiring Soon` (so a certificate expiring today shows `Expiring Soon`, not `Expired`);
  - otherwise → `Valid`.
- The status is recomputed on every read so it never goes stale, and is never accepted from the client.
- **Duplicate policy:** one employee can't have two records with the same certification name **and** certificate number (case-insensitive). This is enforced by a lock plus the DB unique index and returns 409. A renewal with a new number is a separate record; a correction is a PATCH.

### 3.7 Skills, onboarding and admin user creation

Each of these routes now has validation, scope checks, audit entries and the error mapper.
- **Skills:** proficiency, verification status and experience are allowlisted. `verifiedBy` is set by the server.
- **Onboarding:** the list was unscoped and wrote a bogus audit entry on every GET; both are fixed.
- **Admin users:** passwords longer than 72 bytes are rejected, because login refuses them and the account would otherwise be unusable. Contact uniqueness and employee codes use the same locks as employee creation.

---

## 4. Files changed

**New**
- `src/lib/http/{errors,request,handler}.ts`
- `src/lib/validation/{common,venture,employee,assignment,certification,skill}.ts`
- `src/lib/policies/{account,employeeEligibility}.ts`
- `src/lib/scope.ts`
- `src/lib/uploads/{fileValidation,multipart,storage}.ts`
- `src/services/{venture,employee,assignment,certification,document}.service.ts`
- `src/app/api/documents/[id]/file/route.ts`
- `src/app/api/ventures/[ventureId]/documents/[documentId]/file/route.ts`
- Migrations `20261007090000_*` and `20261007100000_*`, plus `migration_lock.toml`
- `tests/unit/*` (3 files)
- `tests/integration/*` (runner, helpers, 4 suites)
- `tests/smoke/auth-session.smoke.ts`

**Rewritten routes** (all on `apiHandler`)
- `ventures` (`route`, `[ventureId]`, `archive`, `members`, `settings`, `announcements`, `activity`, `documents`, `materials`)
- `employees` (`route`, `[id]`, `assignments`, `certifications`, `documents`, `skills`)
- `assignments/[id]`, `certifications/[id]`, `documents/[id]`, `employee-skills/[id]`
- `onboarding` (`route`, `[employeeId]`)
- `admin/users`

**Modified**
- `lib/auth.ts`, `lib/authorization.ts`, `lib/audit.ts` (adds `recordAudit` and `diffFields`), `lib/permissions.ts`, `lib/redis.ts`
- `prisma/schema.prisma`, `prisma/seed.ts` (access levels), migration `init_hr` (re-encoded)
- UI: `EmployeeProfileClient.tsx`, `AddEmployeeForm.tsx`, `employees/[employeeId]/documents/page.tsx`, `ventures/[ventureId]/page.tsx`
- `packages/validation/src/index.ts` (duplicate schema removed)
- `final-verification.ts` (role check now reads the DB enum)
- `package.json` (adds `tsx`, `test`, `test:integration`, `prisma:deploy`), `pnpm-lock.yaml`, `pnpm-workspace.yaml` (`esbuild: false`), `.gitignore`

**Deleted**
- `src/lib/ventureValidation.ts` (superseded)
- One-off role scripts superseded by the migration: `migrate-db-roles.ts`, `migrate-roles.js`, `update_roles.js`, `check_tables.js`, `fix_material_roles.js`, `src/fix_roles.js`

---

## 5. Validation (actual command results)

| Command | Result |
|---|---|
| `npx prisma validate` | `The schema at src\prisma\schema.prisma is valid` |
| `npx prisma generate` | Success. The client is regenerated, which removed every pre-existing `tsc` error about `sessionVersion` and the roles. |
| `npx prisma migrate deploy` (live) | `All migrations have been successfully applied.` |
| `npx prisma migrate status` (live) | `Database schema is up to date!` |
| `prisma migrate diff` live → schema | `-- This is an empty migration.` |
| `npx tsc --noEmit` | Exit 0, no errors (includes tests) |
| `npm run lint` | **Not run.** `next lint` stops at an interactive "How would you like to configure ESLint?" prompt because no ESLint config exists (P1-3). |
| `npm run build` | Success. `✓ Compiled successfully`, linting and type checks pass, all routes built. |
| `npm test` (unit) | `tests 46 · pass 46 · fail 0` |
| `npm run test:integration` (local Postgres, fresh reset from migrations) | `tests 52 · pass 52 · fail 0`, stable over 8 consecutive runs (see note) |
| `tests/smoke/auth-session.smoke.ts` against `next start` | 7/7 passed |

**Smoke test checks:**
- Unauthenticated request → 401.
- Login works.
- Wrong password → no session.
- Malformed JSON → 400.
- Logout revokes the stolen token.
- Role downgrade applies to a live session.
- Termination kills the live session and blocks re-login.

**Notes**
- Integration tests use a real database and the real migration history. Only `getServerSession` is mocked; `requireAuth` re-validation, permissions, scope, validation, services and Postgres are all real.
- `run.mjs` refuses to run if `TEST_DATABASE_URL` is not localhost.
- **Flaky test found and fixed:** one run failed intermittently. The cause was a real bug. Ending an assignment without an `endDate` stamped "now", which could be a few milliseconds earlier than the DB-generated `startDate`, so the request was rejected with 400. A future-dated assignment could never be ended at all. Fixed in `assignment.service.ts`.

**How to run the tests**
```
npm test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=itest npm run test:integration
```

---

## 6. Remaining issues

### P0
None known in the Developer 1 scope.

### P1
1. **Raw `error.message` leaks remain in 14 routes outside my scope**:
   - `attendance` (2 routes)
   - `leaves` (2 routes)
   - `chat/rooms` (3 routes)
   - `materials` (4 routes)
   - `workforce` (3 routes)

   These still return Prisma or JS error text and accept unvalidated `req.json()`. The fix is mechanical: wrap with `apiHandler`, use `parseBody` with a schema, and throw `ApiError`. Owners: Developers 2 and 3.
2. **Existing duplicate contacts in live data.** These are why no DB unique constraint was added on employee email or phone; new duplicates are blocked by the service layer.
   - `pradeep.chandra@naprocs.in`: EMP-1007, EMP-1011. These two also share phone `+91 98450 22341`.
   - `harish@naprocs.in`: EMP-1008, EMP-1009. These two also share phone `+91 9966221969`.
   - `mallipudinvvajaykumar@gmail.com`: EMP-1005, EMP-1006.

   Someone needs to decide which record is real. After that, a follow-up migration can add unique indexes.
3. **ESLint is not configured**, so `npm run lint` can't run non-interactively. Adding a config also makes `next build` enforce it, and the existing code base (many `any` usages) would very likely fail. This needs its own task.
4. **Login rate limiting is silently disabled when Redis is down.** This was the existing behaviour; my change only stops it from hanging. Decide whether login should fail closed, or add an in-memory fallback.
5. **Local upload storage in Docker.** The default driver writes to `UPLOAD_DIR` inside the container. Production needs either a persistent volume or `STORAGE_DRIVER=s3` with real credentials; `.env` currently has placeholder AWS keys. The S3 driver is implemented but was **not** tested against a real bucket.

### P2
1. Two live employees have invalid stored phones: EMP-1005 `+91 2543434534737` and EMP-1006 `+91 565465465465`. They are only rejected if someone re-submits them; they need correcting.
2. Legacy employee codes `EMP-001`…`EMP-005` and `EMP-SCOPE08-SEL` don't follow the `EMP-####` pattern. The generator ignores them; nothing breaks.
3. A MANAGER who creates a venture is not automatically assigned to it, so they can't see it afterwards. Not changed, because the product doesn't define this behaviour.
4. Venture leaders are not required to have an assignment on the venture they lead. Leadership protection only applies once both exist.
5. `actualCompletionDate` and `handoverDate` still can't be set through any route (from VENT-05).
6. Venture documents with visibility `MANAGEMENT` are visible to every MANAGER who has the venture in scope; there is no per-venture role check. This is unchanged.
7. The old seed and sample venture documents (`/documents/*.pdf`) have no stored file and now show "No file" instead of a dead link.
8. `next lint` is deprecated in Next 15.5; migrate to the ESLint CLI when P1-3 is addressed.
