# BMS DEV 1 FINAL MATERIAL REQUEST HARDENING

## Issue
The Material Request, Catalog, and Approval workflows suffered from systematic duplication bugs, unhandled race conditions, unchecked JSON parsing, and fragmented error handling that leaked raw database faults (`P2002`, `P2003`) directly to clients.

## Root Cause
- Routes independently handled generic `try/catch` and often skipped JSON malformation checks, leading to `500 Internal Server Error` instead of `400 Bad Request`.
- Quantity checks relied solely on implicit float behaviors instead of strictly mapping to `quantity > 0` and `< Infinity`.
- `idempotencyKey` replay lacked robust duplicate payload checking, meaning different bodies sharing a UUID mapped natively over each other gracefully instead of producing a `409`.
- Approval and issue operations queried values and then ran `UPDATE`, leaving wide gaps for race conditions during concurrent user submissions.

## Files Changed
- `src/lib/api-errors.ts`
- `src/app/api/materials/requests/route.ts`
- `src/app/api/materials/requests/[id]/route.ts`
- `src/app/api/materials/issue/route.ts`
- `src/app/api/materials/route.ts`

## Implementation
### A. Central API Error Architecture
Introduced `src/lib/api-errors.ts` providing `parseJsonSafe(req)` and a canonical `handleApiError(error)` wrapper. All raw Prisma constraint codes (`P2002`, `P2003`, `P2025`) safely map to HTTP-compliant `409`, `400`, and `404` errors respectfully without leaking stack traces. 

### B. Safe JSON Parsing
Consolidated `req.json()` calls to `parseJsonSafe()`. Malformed arrays, raw strings, or null inputs appropriately trigger an `ApiError(400)`.

### C. Role + Permission Consistency
`SUPERVISOR` role and `STORE_MANAGER` migrations were cleaned. Canonical checks utilize standard `hasPermission()` mapping rather than unsafe direct equality `role === 'X'` evaluations.

### D. Material Catalog
All Category and UOM requests trim strings natively to eradicate whitespace duplication vulnerabilities. Creation wraps inside a safe `.upsert()` call instead of risky check-then-create gaps. 

### E & F. Request & Quantity Validation
The Zod `MaterialRequestSchema` forces numerical validation. On backend loops, parameters statically filter using `isFinite()` AND `qty > 0`. Zero and negative inputs result directly in `400 Validation Error`. Duplicate `materialId` inclusions within the same Request automatically summarize into a consolidated sum inside a Map array, preventing double entries.

### G. Required Date
Strict validation applies explicit filtering: `new Date(reqDateStr)`. Epoch translation ensures that all invalid months/dates resolve into `NaN` triggering a hard `400`. Discarded any date prior to `Date.now()`.

### H & I. Material Request Idempotency
UUID `idempotencyKey` values map exactly to `MaterialRequest.id`. Safe payloads gracefully retrieve via a native `P2002` error capture. A strict loop explicitly evaluates that `venturedId` and all requested item values map perfectly in quantities; mismatched payloads force an immediate `409 Conflict`.

### J & K. Approval Concurrency
Stripped dead `PARTIALLY_APPROVED` code completely from the repository loop. Approvals run exactly atop `.updateMany` where `status === 'PENDING_APPROVAL'`. If a parallel transaction successfully resolves it first, `.count === 0` throws an explicit Error rollback guaranteeing exactly one valid execution mapping.

### L. Rejection Reason
Mandatory `comments` strings evaluate string-length validations directly. Inputs `>= 1000` characters safely throw an outright `400` instead of a silent slice that hides invalid bounds from the frontend UI. 

### M. Request Resource Scope
Queries mapping against requests automatically bundle behind `buildScopedWhere(user, 'venture')` ensuring strict resource-association matches. Administrators possess overarching permissions whereas Managers limit exclusively to scoped relationships natively mapped. 

### N. Audit
Transaction logs only occur when atomic transactions fully complete. Failed increments/stock calculations automatically bubble into rollbacks that strip audit trails prior to write, ensuring exact 1:1 mapping against true operational data execution.

### O & P. Testing & Database
Tested with Adversarial node scripting resolving duplicate idempotency payload checks, bounds testing for quantity strings, and cross-venture mapping safely blocking unauthorized reads.

## Final Decision
Code executes deterministically alongside database locks. Zero P0 or P1 architectural flaws. 

**RESULT: RELEASE READY**
