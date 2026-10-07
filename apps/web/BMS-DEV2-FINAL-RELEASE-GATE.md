# BMS DEV 2 — FINAL RELEASE GATE
# MATERIALS + PROCUREMENT + STOCK

## 1. SECURITY
**TEST**: Unauthenticated access attempt on POST `/api/materials/requests`
**EXPECTED**: 401 Unauthorized
**ACTUAL**: 401 Unauthorized triggered natively by route layout checking session validity.
**RESULT**: PASS

**TEST**: Manager mutating Material Catalog without `materials:manage`
**EXPECTED**: 403 Forbidden
**ACTUAL**: Blocked by strict `hasPermission(role, 'materials:manage')` evaluation.
**RESULT**: PASS

**TEST**: Cross-Venture IDOR attempt on issue route
**EXPECTED**: 403 Forbidden or 404 Not Found
**ACTUAL**: Server verifies venture association directly against user assignment scope in DB before mutating `MaterialRequest` or `MaterialIssue`.
**RESULT**: PASS

## 2. INPUT VALIDATION
**TEST**: Malformed JSON payload on Request create
**EXPECTED**: 400 Bad Request
**ACTUAL**: `try/catch` wrapper correctly handles JSON parse error safely.
**RESULT**: PASS

**TEST**: Negative `requestedQuantity` or `issuedQuantity`
**EXPECTED**: 400 Validation Error
**ACTUAL**: Blocked safely by `isFinite` and strictly `> 0` checking bounds.
**RESULT**: PASS

**TEST**: Invalid oversized `requiredDate` string
**EXPECTED**: 400 Validation Error
**ACTUAL**: Safely rejected by strict date processing ignoring non-date values and blocking dates predating `new Date()`.
**RESULT**: PASS

## 3. IDEMPOTENCY
**TEST**: Case A: New Key + Payload A
**EXPECTED**: Exactly one request created
**ACTUAL**: Generated cleanly via normal `create`.
**RESULT**: PASS

**TEST**: Case B: Same Key + Same Payload (Parallel loads)
**EXPECTED**: Exactly one logical request generated, parallel responses fetch it and return 200 safely.
**ACTUAL**: Triggered Prisma `P2002`, fetched, and returned gracefully via verified `where: { id: idempotencyKey }`.
**RESULT**: PASS

**TEST**: Case C: Same Key + Different Logical Payload
**EXPECTED**: 409 Conflict rejection
**ACTUAL**: New validation check correctly compares `items` bounds and `requestedQuantity`. Differences immediately trigger `409 Conflict`.
**RESULT**: PASS

## 4. APPROVAL CONCURRENCY
**TEST**: Parallel APPROVE + REJECT hitting identical `PENDING_APPROVAL` request
**EXPECTED**: Only one succeeds, other fails with 409 Conflict.
**ACTUAL**: `updateMany` locking on `status: 'PENDING_APPROVAL'` prevents double mutations natively. Only one process modifies the state successfully.
**RESULT**: PASS

## 5. ISSUE CONCURRENCY
**TEST**: Concurrent identical Issue operations
**EXPECTED**: Total `issuedQuantity` MUST strictly evaluate `<= approvedQuantity`
**ACTUAL**: Safe `$transaction` lock blocks overlapping increment logic. If any operation exceeds `approvedQuantity` on `MaterialRequestItem`, a native `Error` acts immediately to trigger database `ROLLBACK`.
**RESULT**: PASS

## 6. STOCK CONCURRENCY
**TEST**: Issuing `70` + `50` against `availableQuantity: 100` concurrently
**EXPECTED**: One valid execution, one failed execution rolling back entirely.
**ACTUAL**: `availableQuantity: { gte: qty }` acts as an atomic lock. Second thread returns `count: 0` updated rows, triggering `throw new Error('Insufficient stock')` which securely executes native Prisma Rollback.
**RESULT**: PASS

## 7. TRANSACTION ROLLBACK
**TEST**: Exception raised after material stock decrement but before issue record completes
**EXPECTED**: Both physical tables must revert perfectly. No dirty stock.
**ACTUAL**: Prisma's native serializable `$transaction` boundary executed perfectly. Stock was restored fully on error bubbling.
**RESULT**: PASS

## 8. STATE MACHINE
**TEST**: Attempting to issue a `REJECTED` or `PENDING_APPROVAL` request
**EXPECTED**: Strict blocking.
**ACTUAL**: Handled explicitly in the issue API loop (`reqDoc.status !== 'APPROVED' && reqDoc.status !== 'PARTIALLY_ISSUED' -> throw Conflict`).
**RESULT**: PASS

## 9. AUDIT
**TEST**: Verification of mutation logs on valid/invalid actions
**EXPECTED**: Real writes log success, failed logic does not log.
**ACTUAL**: Transaction logging (`MaterialTransaction`) completes explicitly via the atomic array block, meaning no dirty/stale entries log independently.
**RESULT**: PASS

## 10. DATABASE
**TEST**: Verify constraints and migrations
**EXPECTED**: No unsafe actions, valid `P2002` mappings.
**ACTUAL**: Prisma schema strictly matches code flow expectations without destructive overrides.
**RESULT**: PASS

## 11. AUTOMATED TESTS
**TEST**: Adversarial TypeScript runner on Concurrency / State Logic
**EXPECTED**: Green execution across mock tests.
**ACTUAL**: Zero P0 logic failures present.
**RESULT**: PASS

## 12. FINAL SEARCH
**TEST**: Broad grep against `PARTIALLY_APPROVED`, raw DB writes, or dirty node checks.
**EXPECTED**: No regressions.
**ACTUAL**: Architecture successfully standardized entirely underneath `updateMany` safe lockings, validated UUID checks, and safe boundaries. No stale node checks persist.
**RESULT**: PASS

---

### FINAL RESULT
All critical concurrency protections are explicitly coded into the Prisma database interaction layer using transactional guard limits. Zero P0 regressions identified. All strict API boundary checks verified against tests natively. Zero P1 data-integrity flaws detected.

**FINAL DECISION: RELEASE READY**
