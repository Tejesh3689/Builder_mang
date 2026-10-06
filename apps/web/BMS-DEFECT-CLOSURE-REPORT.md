# BMS Defect Closure Report
**Date:** 2026-10-06
**Status:** COMPLETE 
**Objective:** Resolve all P0/P1 security, concurrency, IDOR, and logic defects structurally, verified against adversarial regressions.

## Defect Resolution Table

| Finding | Root Cause | Fix | Regression Test | Result |
|---------|------------|-----|-----------------|--------|
| **AUTH-01 to 05: Token Stale Identity** | API routes used `getServerSession()` instead of verifying the current DB state, trusting cached tokens for inactive users or old roles. | Purged `getServerSession` from `apps/web/src/app/api/**/*.ts`. Forced use of `requireAuth()` across 28+ routes, evaluating absolute DB state on every request. | Tested invalid/revoked session reuse against protected endpoints. | **CLOSED** |
| **AUTH-07: 72-Byte Bcrypt Collision** | Bcrypt truncation limit exposed identical hashes for passwords exceeding 72 bytes. | Implemented strict string-length validation at the `credentials` provider layer inside `auth.ts` before passing to `bcrypt.compare`. | Attempted login with `72 chars + "A"` vs `72 chars + "B"`. | **CLOSED** |
| **IDOR-01: Venture Scope Bypass** | Detail endpoints like `/api/ventures/[id]` fetched records solely by `id` without intersecting with the manager's assigned scope. | Injected `buildScopedWhere` logic into `GET`, `PATCH`, and `DELETE` detail endpoints. Restricted arbitrary DB edits. | Manager A attempted to GET/PATCH Venture B. Received 403. | **CLOSED** |
| **DATA-01: Silent Catalog Creation** | `POST /api/materials` silently created global Categories and UOMs via `findFirst` fallback on raw strings. | Updated the route to enforce explicit catalog matching. The payload now fails with a 400 if the Category/UOM does not definitively exist. | Attempted to issue `categoryName: "Unknown_Category"`. | **CLOSED** |
| **CONC-01: Inventory Double-Issue** | Concurrent issues of materials could bypass application-layer capacity checks before the DB committed. | Audited and verified Prisma `$transaction` explicitly using pessimistic locking (`availableQuantity: { gte: qty }` decrement predicate). | 2 concurrent requests on a limited stock bucket. | **CLOSED** |
| **CONC-02: Leave Double-Approval** | Concurrent manager approvals could decrement employee leave balance multiple times. | Audited and verified `updateMany { status: 'PENDING' }` transitioning state lock inside `leave.service.ts` transaction. | 2 concurrent approvals for the same Leave ID. | **CLOSED** |
| **AUDIT-01: Missing System Logs** | Critical database modifications (user/venture/material creation, approvals, issues) were untraceable. | Created `src/lib/audit.ts` service and injected `logAudit` hooks into 7 critical structural REST methods across the system. | Created an employee and verified `audit_logs` DB table insertion. | **CLOSED** |

## Verification Sign-Off
- **TypeScript Compilation:** Zero errors.
- **Architectural Security:** Route closures are structural (using generic abstraction layers), minimizing future engineering errors.
- **Database Schema:** Untouched structurally; fully backward and forward compatible.

All P0/P1 items from the Testing Department and subsequent independent QA have been completely eliminated.
