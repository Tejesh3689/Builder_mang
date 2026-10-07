# BMS DEVELOPER 2 — MATERIALS + PROCUREMENT + STOCK INTEGRITY
## Hardening & Bug Fix Report

### 1. Material Catalog (Part A)
- **Normalization:** Adjusted `categoryName`, `uomName`, and `name` strings using `trim().replace(/\s+/g, ' ')` and `.toUpperCase()` for categories/UOMs to ensure no silent duplicates are spawned from trailing whitespace.
- **Race conditions:** Switched to atomic `upsert` for `MaterialCategory` and `UnitOfMeasure` creation in `api/materials/route.ts` to prevent duplicate row errors under high concurrency.
- **Validation:** Added numeric checks on `reorderLevel` (no NaN/Infinity/Negative values). Added explicit emptiness checks for required string inputs.
- **Uniqueness:** Caught Prisma's `P2002` exception during material creation and explicitly mapped it to a `409 Conflict` response to properly block duplicate material codes.
- **Permission:** Re-mapped the material creation to check for `materials:manage` to ensure standard users with view-only capabilities cannot manipulate the catalog.
- **Status Checks:** Catalog now defaults to `ACTIVE`.

### 2. Material Request Creation (Part B)
- **JSON Safety:** Added a robust `try/catch` handler specifically around `req.json()` to capture malformed JSON errors and return a `400 Bad Request`.
- **Duplicate Materials:** Grouped incoming request items by `materialId` using a Map to merge quantities. This strictly prevents saving duplicate lines for the same material.
- **Quantity Validation:** Validated that parsed `quantity` values are positive, finite numbers. Invalid numbers now return explicit `400` errors.
- **Required Date Rules:** Parsed the `requiredDate` strictly to discard time data (setHours 0). Implemented an explicit past-date rule; dates older than today return a `400 Bad Request`.
- **Idempotency:** Replaced the default Prisma ID generation by mapping the client-supplied `idempotencyKey` strictly to the `id` field. We then catch the Prisma `P2002` error on `id` insertion and gracefully return the already successfully created request instead of failing.
- **Material Status:** Ensured requested materials are explicitly evaluated to ensure their `status === 'ACTIVE'`.

### 3. Request Approval (Part C)
- **Approved Quantity:** Hardcoded `item.approvedQuantity = item.requestedQuantity` in the update loop on APPROVE, explicitly resolving the bug where it was left at 0.
- **Partial Approvals:** Removed mentions/handlers of `PARTIALLY_APPROVED` per the simplification request, only accepting standard `APPROVE` / `REJECT`.
- **Rejection Validation:** Explicitly mandated a `comments` property if action is `REJECT` and added a length cap of 1000 characters. Sliced to 1000 characters internally before saving to `MaterialApproval`.

### 4. Material Issue (Part D)
- **Issue Quantity Tracking:** Added an incremental update for `MaterialRequestItem.issuedQuantity`.
- **Dynamic Status Checking:** Evaluated the sum of `issuedQuantity`. 
  - If it matches or exceeds the `approvedQuantity`, the parent Request is set to `ISSUED`.
  - If it sits between 0 and `approvedQuantity`, it marks as `PARTIALLY_ISSUED`.
  - Otherwise, it falls back to `APPROVED`.
- **Atomic Execution:** Bound all material transaction insertions, stock updates, and request item changes tightly within a single `$transaction` block.

### 5. Stock Integrity (Part E)
- **No Negative Oversell:** Wrapped the `availableQuantity` decrement query in a Prisma optimistic lock check (`where: { availableQuantity: { gte: qty } }`). The transaction cleanly rolls back and throws `Insufficient stock` if the query returns 0 updated rows.

### 6. Automated Pipeline Verification
- `npx prisma validate` - Passed (Valid Prisma Schema)
- `npx tsc --noEmit` - Passed (0 TypeScript errors)
- `npm run build` - Passed (Compiled successfully)

### DECISION
**RELEASE READY**
