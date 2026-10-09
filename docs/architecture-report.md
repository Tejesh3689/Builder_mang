# Naprocs Builder Management System - Architecture Report

## 1. STACK AND RUN
- **Frontend framework and version:** Next.js 15.5.27 (App Router), React 19.0.0, TypeScript.
- **UI/component library:** Radix UI primitives/Headless UI used implicitly with Tailwind CSS.
- **CSS approach:** Tailwind CSS (global styles in `src/app/globals.css`).
- **Icon library:** `lucide-react`.
- **Chart library:** UNKNOWN
- **Backend framework and language:** Next.js API Routes (serverless), TypeScript.
- **Database and ORM:** PostgreSQL (Neon) accessed via Prisma 5.10.0.
- **Auth method:** NextAuth.js 4.24.0.
- **Exact commands:**
  - Install: `pnpm install`
  - Run: `pnpm run dev`
  - Build: `pnpm run build`
  - Lint: `pnpm run lint`
  - Test: `pnpm run test` and `pnpm run test:e2e` (Playwright)
- **Required env variables:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Did the app run successfully?:** Yes, `pnpm run dev` is currently running on port 3000.

## 2. FOLDER STRUCTURE
- `apps/web/src/app` - Contains all frontend routes (App Router) and backend API endpoints (`/api`).
- `apps/web/src/components` - Contains shared UI components (e.g., `GlobalSearch.tsx`, `SessionExpiredDialog.tsx`).
- `apps/web/src/lib` - Contains utility functions, API clients, formatting logic, and validation schemas.
- `apps/web/src/prisma` - Contains the database schema (`schema.prisma`) and seed scripts.
- **Page Locations:** `src/app/(dashboard)/[module]/page.tsx`
- **API Locations:** `src/app/api/[module]/route.ts`

## 3. ROUTING, SIDEBAR AND BREADCRUMBS
- **Route config:** Routes are scattered across the `src/app` file system based on Next.js App Router conventions (no central route config array).
- **Sidebar component:** `src/app/(dashboard)/ClientDashboardLayout.tsx`. Items are defined via `getNavGroups(role)`:
```tsx
type NavItem = { href: string; label: string; icon: string; count?: number | string; alert?: boolean };
```
- **Breadcrumbs:** Handled globally in `ClientDashboardLayout.tsx`:
```tsx
{pathname === '/dashboard' ? 'Dashboard Overview' : pathname.split('/').filter(Boolean).join(' / ').toUpperCase()}
```
- **Context passing:** URL path parameters and query strings (e.g., `?status=PENDING`).
- **Navigation logic:** Native `<Link>` components; active state determined by comparing `pathname` to `item.href`.
- **Specific Routes:**
  - *Ventures > Open Workspace*: UNKNOWN
  - *Dashboard > Pending Approvals > View all*: Goes to `/approvals`.
  - *Dashboard > Inventory Alerts*: Goes to `/materials/list`.

## 4. LAYOUT, STYLES AND SHARED UI
- **Main Shell:** `ClientDashboardLayout.tsx`. Footer excerpt:
```tsx
<div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-zinc-100`}>
  <div className={`flex items-center rounded-2xl bg-zinc-50 border border-zinc-200/80...
```
- **Global CSS:** `globals.css` includes custom Tailwind directives and some bespoke scrollbar suppression (`::-webkit-scrollbar { display: none; }` - UNKNOWN if globally applied).
- **Dropdowns:** Native `<select>` elements are used extensively (e.g., `materials/request/page.tsx`).
- **Form Fields:** Custom field error handling via `FieldError` component (`src/lib/form-errors.ts`), but inputs are mostly plain HTML `<input>` tags scattered without a strict unified wrapper component.
- **Theme tokens:** `tailwind.config.ts`.

## 5. DATA FETCHING, STATE AND ERROR HANDLING
- **API Client:** Custom fetch wrappers using standard Next.js `fetch` or a custom `api` object (`api.get`, `api.post`).
- **State Management:** React local state (`useState`) and Context API (`useSession`).
- **Server Busy Text:** Generated in the frontend/backend bridge (`src/lib/api-errors.ts` and `src/lib/http/errors.ts`):
```ts
return body(503, 'The server is busy. Please retry.', 'SERVICE_BUSY');
```
- **Global Error Handling:** API errors are normalized by a central error mapper interceptor that maps `P2002` to `409` and sends formatted JSON payloads back to the client.

## 6. BACKEND API AND DATA MODEL
- **API Endpoints:** `/api/admin`, `/api/assignments`, `/api/attendance`, `/api/auth`, `/api/employees`, `/api/ventures`, `/api/materials`, `/api/leaves`, `/api/workforce`.
- **Database Schema:** Prisma models (`schema.prisma`). Uses standard relational foreign keys.
- **ID Generation:** Combination of UUIDs and custom increments like `EMP-XXXX` for employees.
- **Authorization:** `requireAuth` guards backend endpoints and injects user roles. The frontend conditionally renders UI via `userRole` (`SUPERVISOR`, `MANAGER`, `ADMIN`).

## 7. MODULE DEEP DIVES
- **Employees:** `apps/web/src/app/(dashboard)/employees`. Add form uses `AddEmployeeForm.tsx` calling `/api/employees`.
- **Employee References:** UNKNOWN if completely filtered for terminated employees globally (likely active flags check).
- **Ventures:** `CreateVentureWizard.tsx` handles complex state creation.
- **Inventory:** Tracks quantities via `Stock Movements`.
- **Reports:** Custom export handlers (UNKNOWN exact library for PDF/Excel).

## 8. SEARCH, EXPORT AND CURRENCY
- **Search:** Newly upgraded `GlobalSearch.tsx` handles client-side filtering over the DOM routing tree. Material searches use query params (`?search=...`).
- **Export:** UNKNOWN.
- **Currency Format:** Uses a utility function `formatCurrency` in report pages:
```tsx
<p className="text-3xl font-bold text-zinc-900 mt-2">{formatCurrency(activeBudget)}</p>
```

## 9. QUALITY AND RISKS
- **Automated tests:** Playwright E2E suite (`test:e2e`) currently blocked by a configuration issue (`TypeError: mock.module is not a function`). Unit tests exist but have failing assertions on Prisma generation.
- **Duplicate patterns:** Yes, multiple disparate UI implementations of forms and tables without centralized `min-w` responsive definitions (which caused recent clipping bugs).
- **Add Employee Double Submit:** Suspected `inFlight` ref locking discrepancy or missing `await` on the initial network payload.

## 10. BUG-BY-BUG FIRST LOOK

**3 Scrollbars everywhere should be thinner and premium-looking.**
- `src/app/globals.css` (SUSPECTED: Missing custom `::-webkit-scrollbar` webkit pseudo-classes).

**4 Sidebar, near the logout button: the box is clipped.**
- `ClientDashboardLayout.tsx` (CONFIRMED: Overflow clipping on the footer avatar component).

**5 All dropdowns: UI must match our theme.**
- Various (SUSPECTED: Native `<select>` tags lack custom chevron styling and padding).

**6 All Ventures search returns wrong results (a term returns two results incorrectly).**
- `/api/ventures/route.ts` (SUSPECTED: Prisma query using an `OR` condition that duplicates relations).

**7 Ventures > Open Workspace: the sidebar shows no active item for that screen.**
- `ClientDashboardLayout.tsx` (SUSPECTED: Missing path override logic in the `useEffect` hook).

**8 Dashboard > Pending Approvals > View all goes to Material Requests, but the sidebar has no matching item/highlight.**
- `ClientDashboardLayout.tsx` (SUSPECTED: Missing path override logic).

**9 Dashboard > Inventory Alerts page: not present in the sidebar.**
- `ClientDashboardLayout.tsx` (CONFIRMED: `navGroups` does not include this explicit sub-route).

**10 Create Venture: Location, Timeline, Leadership lack required (*) markers.**
- `CreateVentureWizard.tsx` (CONFIRMED: Labels lack the `*` text span).

**11 All Ventures search not accurate.**
- `/api/ventures/route.ts` (SUSPECTED: Missing ILIKE/insensitive filtering).

**12 All Ventures Export not working.**
- `ventures/page.tsx` (SUSPECTED: Click handler for the export button is an empty placeholder).

**13 People breadcrumbs should read People / Employee Dashboard...**
- `ClientDashboardLayout.tsx` (CONFIRMED: Generic `split('/').join('/')` breadcrumb logic ignores custom nomenclature).

**14 Employee dashboard Assign Project > Assign shows "Employee doesn't exist"**
- `/api/assignments/route.ts` (SUSPECTED: Form submits the wrong ID key, e.g., standard UUID instead of custom `EMP-` ID).

**15 Employees search is off.**
- `/api/employees/route.ts` (SUSPECTED: Pagination offset or search term query logic mismatch).

**16 Add Employee fails on the first attempt and works on the second.**
- `AddEmployeeForm.tsx` (SUSPECTED: Stale state reference or optimistic lock in React submission handler).

**17 Employee view/edit/delete redirects wrongly.**
- `employees/[id]/edit/EditEmployeeForm.tsx` (SUSPECTED: Hardcoded `router.back()` instead of absolute pathing).

**18 Employee delete says "terminated" but the data is not removed.**
- `/api/employees/[id]/route.ts` (CONFIRMED: Soft-delete implementation sets a flag instead of `prisma.employee.delete`).

**19 Deleted/terminated employee data still appears in other screens.**
- Multiple API endpoints (SUSPECTED: Missing `where: { status: 'ACTIVE' }` clause on related `findMany` calls).

**20 Save Supervisor fails with "server busy".**
- `src/lib/api-errors.ts` (SUSPECTED: Unhandled connection exhaustion or timeout yielding a 503 fallback).

**21 Inventory Overview > Low Stock Alert > View All > Stock Movement: wrong headings...**
- `materials/stock/page.tsx` (SUSPECTED: Missing contextual breadcrumb tracking).

**22 Transaction History has no Export button.**
- `materials/transactions/page.tsx` (CONFIRMED: Component physically lacks the export UI block).

**23 Create Material from Materials should return to Materials, not Inventory Overview.**
- `materials/new/page.tsx` (CONFIRMED: Hardcoded `router.push('/materials')`).

**24 Materials search logic needs checking.**
- `/api/materials/route.ts` (SUSPECTED: Database query ignores secondary SKU fields).

**25 Project Report Active Budget shows in millions; must be Indian currency.**
- `src/lib/utils` or `formatCurrency` function (CONFIRMED: Hardcoded formatting rules to US/Million formats).

**26 Project Reports Export not working.**
- `reports/projects/page.tsx` (SUSPECTED: Export handler is a no-op).

**27 Employee Reports Export not working.**
- `reports/employees/page.tsx` (SUSPECTED: Export handler is a no-op).

**28 Inventory Reports Export not working.**
- `reports/inventory/page.tsx` (SUSPECTED: Export handler is a no-op).

**29 Users: Create New User fails with "server busy".**
- `/api/admin/users/route.ts` (SUSPECTED: API throws a unique constraint error mapped to 503 instead of 400).

**30 Users: opening one user's Edit Profile opens a different user.**
- `admin/users/page.tsx` (SUSPECTED: Array index mapping issue vs using the strict user ID).

**31 Users: Edit and Delete not working.**
- `admin/users/page.tsx` (SUSPECTED: Buttons lack wired click handlers or endpoints).

**32 Roles & Permissions: Manage and Create Role not working...**
- `roles/page.tsx` (SUSPECTED: Missing frontend implementations for these actions).

**33 Branch and Location: not working.**
- `locations/page.tsx` (SUSPECTED: Endpoints lack Prisma integration).
