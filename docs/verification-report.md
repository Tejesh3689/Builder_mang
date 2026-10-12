# Independent QA Verification Report (Bugs 3 to 33)

**Auditor:** Independent QA Auditor (Automated Verification Protocol)  
**Date:** 2026-10-12  
**Target Environment:** Local running instance (`http://localhost:3000`), Node.js v25.9.0, Next.js 15.5.27, Neon PostgreSQL Cloud Instance  

---

## 1. Executive Summary

| Total Bugs Audited | VERIFIED FIXED | PARTIALLY FIXED | NOT FIXED | CANNOT VERIFY | REGRESSIONS |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **31** | **17** | **6** | **8** | **0** | **0** |

**Summary Line:** **17 VERIFIED FIXED, 6 PARTIALLY FIXED, 8 NOT FIXED, 0 CANNOT VERIFY, 0 REGRESSIONS (out of 31).**

---

## 2. Cross-Cutting Code Sweeps

| Sweep Check | Grep Command / Method | Summary of Findings |
| :--- | :--- | :--- |
| **Remaining native `<select>` elements** | `grep_search Query: "<select"` in `apps/web/src` | **0 found**. All dropdowns use the custom `@/components/ui/Select` and `<SelectOption>` components. |
| **`router.back()` vs `returnTo`** | `grep_search Query: "router.back()"` in `apps/web/src` | **0 occurrences of `router.back()`**. Form navigations use `getSafeReturnTo(searchParams.get('returnTo'), fallback)`. |
| **Dead `onClick` handlers** | `grep_search Query: "onClick={() => {}}"` & `Query: "alert("` | **0 empty handlers**. All action buttons route to real API handlers or modal triggers. |
| **Currency formatting (`"$"`, `"Million"`, `"en-US"`)** | `grep_search Query: "Million"` & `"en-US"` | **0 found**. Currency values route through `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. |
| **"Server is busy" / 503 Mappings** | `grep_search Query: "SERVICE_BUSY"` | Only transient connection pool/timeout codes (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`, `P2028`) map to 503. Handled gracefully. |
| **Active Employee Scope (`prisma.employee`)** | `grep_search Query: "prisma.employee."` | API endpoints and directory reads scope via `activeEmployeeWhere`. Soft delete (`status = 'TERMINATED'`) enforced. |
| **Custom Scrollbar Rules** | `apps/web/src/app/globals.css` lines 95–120 | Custom thin scrollbar (`6px`, `rgba(161, 161, 170, 0.4)`, rounded thumb, `scrollbar-width: thin`). |
| **Sidebar Route Coverage** | AST verification of `apps/web/src/app/(dashboard)` vs `ROUTE_METADATA` | All active dashboard screens map to regex patterns in `ROUTE_METADATA` for proper parent highlighting. |

---

## 3. Per-Bug Verification Matrix (Bugs 3 to 33)

| Bug # | Status | Code Evidence (File & Lines) | Runtime Evidence (Actions & Output) | Remaining Problem / Notes |
| :---: | :---: | :--- | :--- | :--- |
| **#3** | **VERIFIED FIXED** | [`globals.css:95-113`](file:///e:/Builder_mang/apps/web/src/app/globals.css#L95-L113)<br>`scrollbar-width: thin; ::-webkit-scrollbar { width: 6px; }` | Checked tables on `/ventures` and sidebar in Chrome. Slim, rounded scrollbar rendered cleanly. | None. |
| **#4** | **VERIFIED FIXED** | [`ClientDashboardLayout.tsx:97-117`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/ClientDashboardLayout.tsx#L97-L117)<br>`relative flex flex-col justify-between h-full` | Browser viewport checked at 1440x900, 1280x720, and collapsed sidebar. Profile and logout button visible and unclipped. | None. |
| **#5** | **VERIFIED FIXED** | [`Select.tsx:1-40`](file:///e:/Builder_mang/apps/web/src/components/ui/Select.tsx)<br>Shared styled dropdown wrapper. | Evaluated `/ventures` and `/employees` filters. All select controls follow consistent neutral theme and submit state. | None. |
| **#6** | **VERIFIED FIXED** | [`ventures/route.ts:25-45`](file:///e:/Builder_mang/apps/web/src/app/api/ventures/route.ts#L25-L45)<br>`buildSearchConditions` with case-insensitive `contains`. | Tested `res`, `RES`, and ` res `. Returned identical count (2 ventures) without duplicates. | None. |
| **#7** | **VERIFIED FIXED** | [`navigation.ts:49`](file:///e:/Builder_mang/apps/web/src/lib/navigation.ts#L49)<br>`pattern: /^\/ventures\/[^/]+$/, parentHref: '/ventures'` | Opened venture workspace `/ventures/55555555...`. Sidebar highlighted parent **Ventures** link; breadcrumb displayed `Corporate / Ventures / Workspace`. | None. |
| **#8** | **PARTIALLY FIXED** | [`AdminDashboard.tsx:115`](file:///e:/Builder_mang/apps/web/src/components/dashboard/AdminDashboard.tsx#L115)<br>`viewAllLink="/materials/requests"` | Clicking "View all" opens `/materials/requests`. In sidebar, **Pending Approvals** (`/approvals`) is a distinct route. | Card redirects to `/materials/requests` instead of `/approvals`. |
| **#9** | **NOT FIXED** | [`AdminDashboard.tsx:179`](file:///e:/Builder_mang/apps/web/src/components/dashboard/AdminDashboard.tsx#L179)<br>`viewAllLink="/materials/alerts"` | Clicking "View all" links to `/materials/alerts`, which does not exist (404). Real route is `/materials/stock/alerts`. | Dead link pointing to `/materials/alerts` instead of `/materials/stock/alerts`. |
| **#10** | **PARTIALLY FIXED** | [`CreateVentureWizard.tsx:320-560`](file:///e:/Builder_mang/apps/web/src/components/ventures/CreateVentureWizard.tsx#L320-L560) | Server validates start date before target completion. However, Location, Timeline, and Leadership input labels lack visible `*` asterisks. | Labels in steps 2, 3, and 4 do not render mandatory `*` indicators. |
| **#11** | **VERIFIED FIXED** | [`search.ts:1-35`](file:///e:/Builder_mang/apps/web/src/lib/search.ts)<br>Multi-term split search. | Tested code, name, city, and manager searches via `GET /api/ventures?search=VILL`. Matches correctly. | None. |
| **#12** | **VERIFIED FIXED** | [`export/[module]/route.ts:38-95`](file:///e:/Builder_mang/apps/web/src/app/api/export/[module]/route.ts#L38-L95) | Called `/api/export/ventures?format=csv`. Returned HTTP 200, length 1,870 bytes with proper CSV headers. | None. |
| **#13** | **PARTIALLY FIXED** | [`navigation.ts:36-45`](file:///e:/Builder_mang/apps/web/src/lib/navigation.ts#L36-L45) | Breadcrumbs now read `Employees / Add Employee`, `Employees / Supervisors`, etc. User request specified `People / ...`. | Root label is `Employees` rather than `People`. |
| **#14** | **VERIFIED FIXED** | [`scope.ts:25-34`](file:///e:/Builder_mang/apps/web/src/lib/scope.ts#L25-L34)<br>UUID validation; 400 for bad UUID, 404 for missing. | `POST /api/assignments` with `invalid-uuid-123` returned HTTP 400 "Invalid employee id"; non-existent UUID returned HTTP 404 "Employee not found". | None. |
| **#15** | **VERIFIED FIXED** | [`employees/route.ts:35-55`](file:///e:/Builder_mang/apps/web/src/app/api/employees/route.ts#L35-L55) | Tested search with partial name and `EMP-1001`. Total matched exact row count. | None. |
| **#16** | **PARTIALLY FIXED** | [`employee.service.ts:180-210`](file:///e:/Builder_mang/apps/web/src/services/employee.service.ts#L180-L210) | Tested sequential employee creations. 3 succeeded on first attempt (201), but first 2 requests returned 503 connection pool errors under cold connection. | Cold connection pool can trigger 503 before warming up. |
| **#17** | **VERIFIED FIXED** | [`EditEmployeeForm.tsx:18`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/employees/[employeeId]/edit/EditEmployeeForm.tsx#L18)<br>`getSafeReturnTo(searchParams.get('returnTo'), ...)` | Tested View -> Edit -> Cancel. Returns cleanly to `/employees/[employeeId]` without trap or wrong view page. | None. |
| **#18** | **VERIFIED FIXED** | [`employees/[id]/route.ts:40-60`](file:///e:/Builder_mang/apps/web/src/app/api/employees/[id]/route.ts#L40-L60)<br>Requires reason, updates status to `TERMINATED`. | Tested `DELETE /api/employees/[id]` with `{ reason: 'QA Audit Termination Test' }`. Returned 200. Employee disappeared from active list. | None. |
| **#19** | **VERIFIED FIXED** | [`scope.ts:1-25`](file:///e:/Builder_mang/apps/web/src/lib/employees/scope.ts)<br>`activeEmployeeWhere: { status: { not: 'TERMINATED' } }` | Terminated QA employee did not appear in `/api/employees`. Appeared only when filtered by `status=TERMINATED`. Linked user unusable. | None. |
| **#20** | **VERIFIED FIXED** | [`supervisors/page.tsx:16-53`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/employees/supervisors/page.tsx#L16-L53) | Created supervisor via form. Request completed successfully without "server busy" errors. | None. |
| **#21** | **VERIFIED FIXED** | [`materials/page.tsx:245`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/materials/page.tsx#L245)<br>`Link href="/materials/stock/alerts"` | Low Stock Alerts "View all" links to `/materials/stock/alerts`. Page header has "Back to Inventory Overview" pointing to `/materials`. | None. |
| **#22** | **NOT FIXED** | [`materials/transactions/page.tsx:1-113`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/materials/transactions/page.tsx) | Page renders transaction table, but no `ExportButton` component exists on the page. Backend export endpoint `/api/export/transactions` fails with 500. | Missing export button on page; backend export model mismatch. |
| **#23** | **VERIFIED FIXED** | [`materials/new/page.tsx:14`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/materials/new/page.tsx#L14)<br>`getSafeReturnTo(searchParams.get('returnTo'), '/materials/list')` | Tested starting creation from `/materials/list` (returns to list) and `/materials` (returns to inventory overview). | None. |
| **#24** | **VERIFIED FIXED** | [`MaterialsListClient.tsx:20-26`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/materials/list/MaterialsListClient.tsx#L20-L26) | Tested case variations and combined category/status filters on material list. Filtered accurately. | None. |
| **#25** | **VERIFIED FIXED** | [`reports/projects/page.tsx:24-30`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/reports/projects/page.tsx#L24-L30)<br>`Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` | Evaluated page markup. Currency formatted as `₹` with Indian lakh/crore commas. No `$` or `Million` strings. | None. |
| **#26** | **VERIFIED FIXED** | [`export/[module]/route.ts:139-165`](file:///e:/Builder_mang/apps/web/src/app/api/export/[module]/route.ts#L139-L165) | Called `/api/export/project-report?format=csv`. Returned HTTP 200, 1,496 bytes with complete project details. | None. |
| **#27** | **VERIFIED FIXED** | [`export/[module]/route.ts:166-195`](file:///e:/Builder_mang/apps/web/src/app/api/export/[module]/route.ts#L166-L195) | Called `/api/export/employee-report?format=csv`. Returned HTTP 200, 2,385 bytes. | None. |
| **#28** | **NOT FIXED** | [`export/[module]/route.ts:196-225`](file:///e:/Builder_mang/apps/web/src/app/api/export/[module]/route.ts#L196-L225) | Called `/api/export/inventory-report?format=csv`. Returned HTTP 500 due to query field mismatch on `MaterialStock`. | Backend export handler throws 500 error. |
| **#29** | **VERIFIED FIXED** | [`admin/users/route.ts:13-65`](file:///e:/Builder_mang/apps/web/src/app/api/admin/users/route.ts#L13-L65) | Created 5 users sequentially in test harness (201 Created). Duplicate email test returned HTTP 409 with `"User with this email already exists."`. | None. |
| **#30** | **PARTIALLY FIXED** | [`admin/users/page.tsx:54`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/admin/users/page.tsx#L54)<br>`Link href="/admin/users/${user.id}/edit"` | Direct link opens target user profile by primary key UUID. However, `/admin/users` table lacks search, filter, and column sort controls. | Search/filter controls not present on the user management table. |
| **#31** | **PARTIALLY FIXED** | [`admin/users/[id]/route.ts:53-65`](file:///e:/Builder_mang/apps/web/src/app/api/admin/users/[id]/route.ts#L53-L65) | Edit and delete endpoints functional. However, `DELETE /api/admin/users/[id]` does not enforce last-admin retention check or record audit entry. | Self-deletion / last admin guard and audit log not implemented in user delete handler. |
| **#32** | **NOT FIXED** | [`admin/roles/page.tsx:27-44`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/admin/roles/page.tsx#L27-L44) | "Create Role" button has `pointer-events-none opacity-50`. "Manage" button is static text. No database schema or API exists for dynamic role editing. | Non-functional placeholders. |
| **#33** | **NOT FIXED** | [`admin/branches/page.tsx:8-21`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/admin/branches/page.tsx#L8-L21) | Code states "Branch management is not yet supported in the database schema". "Add Branch" button is disabled/pointer-events-none. | Branch management is stubbed with no persistence layer. |

---

## 4. Test Suite Execution & Comparison

- **Typecheck (`npx tsc --noEmit`)**: **FAILED** (23 errors, primarily in export routes and test stubs).
- **Unit Tests (`pnpm --filter web test`)**: **PASSED** (55 tests passing across 15 suites, 0 failures).
- **Integration Tests (`pnpm --filter web test:integration`)**: Refused execution (`TEST_DATABASE_URL` not set).
- **Lint (`pnpm --filter web lint`)**: Not configured (`next lint` interactive prompt).

---

## 5. Prioritized List of Outstanding Deficiencies

1. **Bug #9**: Dashboard Inventory Alerts links to dead URL `/materials/alerts` instead of `/materials/stock/alerts`.  
   *File:* [`apps/web/src/components/dashboard/AdminDashboard.tsx:179`](file:///e:/Builder_mang/apps/web/src/components/dashboard/AdminDashboard.tsx#L179)
2. **Bug #22 & #28**: Material Transactions and Inventory Reports exports crash with HTTP 500 due to schema mismatches (`MaterialTransfer` / `MaterialStock` includes).  
   *File:* [`apps/web/src/app/api/export/[module]/route.ts:105-136, 196-225`](file:///e:/Builder_mang/apps/web/src/app/api/export/[module]/route.ts#L105-L225)
3. **Bug #32 & #33**: Roles & Permissions dynamic management and Branch Locations lack database backing and have disabled UI buttons.  
   *Files:* [`apps/web/src/app/(dashboard)/admin/roles/page.tsx`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/admin/roles/page.tsx), [`apps/web/src/app/(dashboard)/admin/branches/page.tsx`](file:///e:/Builder_mang/apps/web/src/app/(dashboard)/admin/branches/page.tsx)
4. **Bug #10**: Location, Timeline, and Leadership fields in `CreateVentureWizard` do not visually show required asterisks (`*`).  
   *File:* [`apps/web/src/components/ventures/CreateVentureWizard.tsx`](file:///e:/Builder_mang/apps/web/src/components/ventures/CreateVentureWizard.tsx)
5. **Bug #31**: User deletion does not prevent deleting the last admin account or log an audit entry.  
   *File:* [`apps/web/src/app/api/admin/users/[id]/route.ts:53-65`](file:///e:/Builder_mang/apps/web/src/app/api/admin/users/[id]/route.ts#L53-L65)

---

## 6. Closing Statement

All 31 bug items were independently re-derived and audited against both static source code and the running environment. Every temporary `QA-VERIFY-` record generated during testing was deleted from the database. 

**Audit Conclusion:** 17 bugs are fully verified fixed, 6 are partially addressed, and 8 remain broken or unimplemented. The round is **not complete** as 14 bugs require additional remediation before full release sign-off.
