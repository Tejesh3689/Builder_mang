import { randomBytes, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { buildScopedWhere } from '@/lib/authorization';
import { recordAudit } from '@/lib/audit';
import { ApiError, badRequest, notFound } from '@/lib/http/errors';
import { requireVentureInScope } from '@/lib/scope';
import { runTransaction } from '@/lib/transaction';
import type {
  AdjustmentCreateInput,
  ReturnCreateInput,
  TransferCreateInput,
  TransferReceiveInput,
} from '@/lib/validation/inventory';

/**
 * Stock movements other than issue/receipt: transfers, returns and physical-count adjustments.
 *
 * Invariants every movement keeps:
 *  - Stock only changes by increment/decrement inside a transaction, never by overwriting a value
 *    read earlier, so concurrent movements compose.
 *  - Decrements use a conditional updateMany (availableQuantity >= qty) so stock can't go negative.
 *  - Every change to physicalQuantity writes a MaterialTransaction row whose balanceAfter is the
 *    new physicalQuantity, so the ledger always reconciles with stock.
 *  - Out-of-scope records are reported as 404, like lib/scope.ts.
 */

type Tx = Prisma.TransactionClient;
type Actor = Parameters<typeof buildScopedWhere>[0] & { id: string };

// Quantities are DECIMAL(12,3) columns: do all arithmetic and comparisons in Decimal, never float.
type Qty = number | Prisma.Decimal;
const dec = (v: Qty | null | undefined) => new Prisma.Decimal(v ?? 0);
const IN_TRANSIT_STATUSES = ['DISPATCHED', 'IN_TRANSIT'];

// UOMs counted in whole units; fractional quantities are rejected for these.
const WHOLE_UNITS = new Set([
  'BAG', 'BAGS', 'BOX', 'BOXES', 'NO', 'NOS', 'NUMBER', 'NUMBERS', 'PC', 'PCS', 'PIECE', 'PIECES',
  'UNIT', 'UNITS', 'EA', 'EACH', 'SET', 'SETS', 'ROLL', 'ROLLS', 'BUNDLE', 'BUNDLES', 'SHEET', 'SHEETS',
  'DRUM', 'DRUMS', 'CAN', 'CANS', 'CARTON', 'CARTONS', 'PACKET', 'PACKETS', 'PAIR', 'PAIRS',
]);

export const docNumber = (prefix: string) =>
  `${prefix}-${Date.now().toString().slice(-6)}${randomBytes(3).toString('hex').toUpperCase()}`;

// ---------------------------------------------------------------------------
// Scope & reference data
// ---------------------------------------------------------------------------

/** Venture-id filter for list queries: undefined = unrestricted (ADMIN). */
async function ventureIdFilter(user: Actor): Promise<{ in: string[] } | undefined> {
  const where = (await buildScopedWhere(user, 'venture')) as any;
  if (where.id === 'DENY_ALL') return { in: [] };
  return where.id;
}

async function isVentureInScope(user: Actor, ventureId: string) {
  return requireVentureInScope(user, ventureId).then(() => true, () => false);
}

/** Stock location whose venture is in the user's scope (404 otherwise). */
export async function requireLocationInScope(user: Actor, id: string, { mustBeActive = true } = {}) {
  const location = await prisma.stockLocation.findUnique({ where: { id } });
  if (!location || !(await isVentureInScope(user, location.ventureId))) throw notFound('Stock location not found');
  if (mustBeActive && location.status !== 'ACTIVE') {
    throw new ApiError(409, `Stock location ${location.name} is not active`, 'LOCATION_INACTIVE');
  }
  return location;
}

type MaterialWithUnit = Prisma.MaterialGetPayload<{ include: { unitOfMeasure: true } }>;

async function loadMaterials(db: Tx | typeof prisma, ids: string[], { mustBeActive = true } = {}) {
  const materials = await db.material.findMany({ where: { id: { in: ids } }, include: { unitOfMeasure: true } });
  if (materials.length !== new Set(ids).size) throw notFound('Material not found');
  if (mustBeActive) {
    const inactive = materials.find((m) => m.status !== 'ACTIVE');
    if (inactive) throw new ApiError(409, `Material ${inactive.name} is not active`, 'MATERIAL_INACTIVE');
  }
  return new Map(materials.map((m) => [m.id, m]));
}

/** Rejects fractional quantities for materials counted in whole units (bags, boxes, pieces...). */
export function assertUnitPrecision(material: MaterialWithUnit, quantity: Qty, field: string) {
  const unit = material.unitOfMeasure.name.trim().toUpperCase();
  if (WHOLE_UNITS.has(unit) && !dec(quantity).isInteger()) {
    throw badRequest(`${field} for ${material.name} must be a whole number of ${material.unitOfMeasure.name}`, field);
  }
}

// ---------------------------------------------------------------------------
// Stock + ledger primitives (call inside a transaction)
// ---------------------------------------------------------------------------

type StockKey = { materialId: string; stockLocationId: string };

/** Decrements available + physical stock atomically; 409 if not enough is available. */
async function removeStock(tx: Tx, key: StockKey, quantity: Qty, errorCode: string) {
  const res = await tx.materialStock.updateMany({
    where: { ...key, availableQuantity: { gte: quantity } },
    data: { availableQuantity: { decrement: quantity }, physicalQuantity: { decrement: quantity } },
  });
  if (res.count === 0) {
    const stock = await tx.materialStock.findUnique({ where: { materialId_stockLocationId: key } });
    throw new ApiError(409, 'Requested quantity exceeds available stock', errorCode, undefined, {
      materialId: key.materialId,
      requested: quantity,
      available: stock?.availableQuantity ?? 0,
    });
  }
  return tx.materialStock.findUniqueOrThrow({ where: { materialId_stockLocationId: key } });
}

/** Increments stock, creating the row on first receipt (atomic upsert on the compound key). */
async function addStock(tx: Tx, key: StockKey, ventureId: string, quantity: Qty) {
  return tx.materialStock.upsert({
    where: { materialId_stockLocationId: key },
    create: { ...key, ventureId, physicalQuantity: quantity, availableQuantity: quantity, reservedQuantity: 0 },
    update: { physicalQuantity: { increment: quantity }, availableQuantity: { increment: quantity } },
  });
}

/** Ensures the stock row exists, then row-locks it so the caller can read-then-write safely. */
async function lockStock(tx: Tx, key: StockKey, ventureId: string) {
  await tx.$executeRaw`
    INSERT INTO material_stocks (id, "materialId", "ventureId", "stockLocationId", "physicalQuantity", "reservedQuantity", "availableQuantity", "updatedAt")
    VALUES (${randomUUID()}, ${key.materialId}, ${ventureId}, ${key.stockLocationId}, 0, 0, 0, NOW())
    ON CONFLICT ("materialId", "stockLocationId") DO NOTHING`;
  await tx.$queryRaw`
    SELECT id FROM material_stocks WHERE "materialId" = ${key.materialId} AND "stockLocationId" = ${key.stockLocationId} FOR UPDATE`;
  return tx.materialStock.findUniqueOrThrow({ where: { materialId_stockLocationId: key } });
}

async function writeLedger(
  tx: Tx,
  entry: StockKey & {
    ventureId: string;
    transactionType: string;
    quantityIn?: Qty;
    quantityOut?: Qty;
    balanceAfter: Qty;
    referenceType: string;
    referenceId: string;
    performedById: string;
    remarks?: string;
  }
) {
  await tx.materialTransaction.create({
    data: { transactionNumber: docNumber('TXN'), quantityIn: 0, quantityOut: 0, ...entry },
  });
}

/** Sorted by materialId so multi-item transactions always lock stock rows in the same order (no deadlocks). */
const byMaterial = <T extends { materialId: string }>(items: T[]) =>
  [...items].sort((a, b) => a.materialId.localeCompare(b.materialId));

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

const idempotencyConflict = () =>
  new ApiError(409, 'idempotencyKey was already used for a different request', 'IDEMPOTENCY_CONFLICT');

const sameItems = (a: { materialId: string; qty: Qty }[], b: { materialId: string; qty: Qty }[]) =>
  a.length === b.length &&
  a.every((x) => b.some((y) => y.materialId === x.materialId && dec(y.qty).equals(dec(x.qty))));

// ---------------------------------------------------------------------------
// Transfers: DRAFT -> DISPATCHED -> RECEIVED | RECEIVED_WITH_SHORTFALL, or -> CANCELLED
// ---------------------------------------------------------------------------

const transferInclude = {
  items: { include: { material: { include: { unitOfMeasure: true } } } },
  fromLocation: true,
  toLocation: true,
} satisfies Prisma.MaterialTransferInclude;

export async function listTransfers(user: Actor, { status, skip = 0, take = 25 }: { status?: string; skip?: number; take?: number }) {
  const ventures = await ventureIdFilter(user);
  const where: Prisma.MaterialTransferWhereInput = {
    ...(status ? { status } : {}),
    ...(ventures ? { OR: [{ ventureId: ventures }, { toLocation: { ventureId: ventures } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.materialTransfer.findMany({ where, include: transferInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.materialTransfer.count({ where }),
  ]);
  return { items, total };
}

/** A transfer visible to the user: either end's venture in scope. */
export async function getTransfer(user: Actor, id: string) {
  const transfer = await prisma.materialTransfer.findUnique({ where: { id }, include: transferInclude });
  if (
    !transfer ||
    !((await isVentureInScope(user, transfer.fromLocation.ventureId)) || (await isVentureInScope(user, transfer.toLocation.ventureId)))
  ) {
    throw notFound('Transfer not found');
  }
  return transfer;
}

async function replayTransfer(input: TransferCreateInput) {
  const existing = await prisma.materialTransfer.findUnique({ where: { id: input.idempotencyKey }, include: transferInclude });
  if (!existing) return null;
  if (
    existing.fromLocationId !== input.fromLocationId ||
    existing.toLocationId !== input.toLocationId ||
    !sameItems(
      existing.items.map((i) => ({ materialId: i.materialId, qty: i.dispatchedQuantity })),
      input.items.map((i) => ({ materialId: i.materialId, qty: i.quantity }))
    )
  ) {
    throw idempotencyConflict();
  }
  return { transfer: existing, replayed: true };
}

export async function createTransfer(user: Actor, input: TransferCreateInput) {
  const from = await requireLocationInScope(user, input.fromLocationId);
  const to = await requireLocationInScope(user, input.toLocationId);
  // A retried request returns the original result instead of being re-validated against the new state.
  const prior = await replayTransfer(input);
  if (prior) return prior;

  const materials = await loadMaterials(prisma, input.items.map((i) => i.materialId));
  for (const item of input.items) assertUnitPrecision(materials.get(item.materialId)!, item.quantity, 'quantity');

  try {
    const transfer = await runTransaction(async (tx) => {
      const created = await tx.materialTransfer.create({
        data: {
          id: input.idempotencyKey,
          transferNumber: docNumber('TRF'),
          ventureId: from.ventureId,
          fromLocationId: from.id,
          toLocationId: to.id,
          status: 'DRAFT',
          items: { create: input.items.map((i) => ({ materialId: i.materialId, dispatchedQuantity: i.quantity })) },
        },
        include: transferInclude,
      });
      await recordAudit(tx, {
        userId: user.id,
        action: 'CREATE_TRANSFER',
        ventureId: from.ventureId,
        details: { transferId: created.id, fromLocationId: from.id, toLocationId: to.id, items: input.items },
      });
      return created;
    });
    return { transfer, replayed: false };
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    // A concurrent request with the same key won the insert.
    const replay = await replayTransfer(input);
    if (!replay) throw e;
    return replay;
  }
}

/** DRAFT -> DISPATCHED: stock leaves the source location. */
export async function dispatchTransfer(user: Actor, id: string) {
  const transfer = await getTransfer(user, id);
  // Only the sending side may dispatch.
  if (!(await isVentureInScope(user, transfer.fromLocation.ventureId))) throw notFound('Transfer not found');
  if (transfer.status !== 'DRAFT') {
    throw new ApiError(409, `Transfer is ${transfer.status}, only DRAFT transfers can be dispatched`, 'TRANSFER_NOT_DRAFT');
  }
  if (transfer.fromLocation.status !== 'ACTIVE' || transfer.toLocation.status !== 'ACTIVE') {
    throw new ApiError(409, 'Source or destination location is not active', 'LOCATION_INACTIVE');
  }

  return runTransaction(async (tx) => {
    // Claiming the status transition first serialises concurrent dispatches of the same transfer.
    const claimed = await tx.materialTransfer.updateMany({
      where: { id, status: 'DRAFT' },
      data: { status: 'DISPATCHED', dispatchDate: new Date(), dispatchedById: user.id },
    });
    if (claimed.count === 0) throw new ApiError(409, 'Transfer is no longer a DRAFT', 'TRANSFER_NOT_DRAFT');

    await loadMaterials(tx, transfer.items.map((i) => i.materialId));
    for (const item of byMaterial(transfer.items)) {
      const key = { materialId: item.materialId, stockLocationId: transfer.fromLocationId };
      const stock = await removeStock(tx, key, item.dispatchedQuantity, 'TRANSFER_EXCEEDS_AVAILABLE_STOCK');
      await writeLedger(tx, {
        ...key,
        ventureId: transfer.fromLocation.ventureId,
        transactionType: 'TRANSFER_OUT',
        quantityOut: item.dispatchedQuantity,
        balanceAfter: stock.physicalQuantity,
        referenceType: 'TRANSFER',
        referenceId: id,
        performedById: user.id,
      });
    }

    await recordAudit(tx, { userId: user.id, action: 'DISPATCH_TRANSFER', ventureId: transfer.ventureId, details: { transferId: id } });
    return tx.materialTransfer.findUniqueOrThrow({ where: { id }, include: transferInclude });
  });
}

/**
 * DISPATCHED -> RECEIVED (or RECEIVED_WITH_SHORTFALL). Per line, received + damaged must not exceed
 * dispatched; any remainder is recorded as a shortfall. Only received (good) units enter destination
 * stock; damaged units are recorded on the line but not made available.
 */
export async function receiveTransfer(user: Actor, id: string, input: TransferReceiveInput) {
  const transfer = await getTransfer(user, id);
  // Only the receiving side may receive.
  if (!(await isVentureInScope(user, transfer.toLocation.ventureId))) throw notFound('Transfer not found');
  if (!IN_TRANSIT_STATUSES.includes(transfer.status)) {
    throw new ApiError(409, `Transfer is ${transfer.status}, only dispatched transfers can be received`, 'TRANSFER_NOT_IN_TRANSIT');
  }

  const lines = new Map(transfer.items.map((i) => [i.materialId, i]));
  if (input.items.length !== lines.size || input.items.some((i) => !lines.has(i.materialId))) {
    throw badRequest('items must list every material on the transfer exactly once', 'items');
  }

  const shortfalls: { materialId: string; dispatched: string; received: string; damaged: string; shortfall: string }[] = [];
  for (const item of input.items) {
    const line = lines.get(item.materialId)!;
    assertUnitPrecision(line.material, item.receivedQuantity, 'receivedQuantity');
    assertUnitPrecision(line.material, item.damagedQuantity, 'damagedQuantity');
    const accounted = dec(item.receivedQuantity).plus(item.damagedQuantity);
    if (accounted.gt(line.dispatchedQuantity)) {
      throw new ApiError(
        400,
        `Received + damaged (${accounted}) exceeds dispatched (${line.dispatchedQuantity}) for ${line.material.name}`,
        'TRANSFER_RECEIPT_EXCEEDS_DISPATCHED',
        'items',
        { materialId: item.materialId, dispatched: line.dispatchedQuantity, received: item.receivedQuantity, damaged: item.damagedQuantity }
      );
    }
    const shortfall = dec(line.dispatchedQuantity).minus(accounted);
    if (shortfall.gt(0)) {
      shortfalls.push({
        materialId: item.materialId,
        dispatched: line.dispatchedQuantity.toString(),
        received: String(item.receivedQuantity),
        damaged: String(item.damagedQuantity),
        shortfall: shortfall.toString(),
      });
    }
  }

  const finalStatus = shortfalls.length ? 'RECEIVED_WITH_SHORTFALL' : 'RECEIVED';

  const received = await runTransaction(async (tx) => {
    const claimed = await tx.materialTransfer.updateMany({
      where: { id, status: { in: IN_TRANSIT_STATUSES } },
      data: { status: finalStatus, receiveDate: new Date(), receivedById: user.id },
    });
    if (claimed.count === 0) throw new ApiError(409, 'Transfer is no longer in transit', 'TRANSFER_NOT_IN_TRANSIT');

    for (const item of byMaterial(input.items)) {
      const line = lines.get(item.materialId)!;
      await tx.materialTransferItem.update({
        where: { id: line.id },
        data: { receivedQuantity: item.receivedQuantity, damagedQuantity: item.damagedQuantity },
      });
      if (item.receivedQuantity <= 0) continue;

      const key = { materialId: item.materialId, stockLocationId: transfer.toLocationId };
      const stock = await addStock(tx, key, transfer.toLocation.ventureId, item.receivedQuantity);
      await writeLedger(tx, {
        ...key,
        ventureId: transfer.toLocation.ventureId,
        transactionType: 'TRANSFER_IN',
        quantityIn: item.receivedQuantity,
        balanceAfter: stock.physicalQuantity,
        referenceType: 'TRANSFER',
        referenceId: id,
        performedById: user.id,
        remarks: item.damagedQuantity > 0 ? `${item.damagedQuantity} damaged in transit` : undefined,
      });
    }

    await recordAudit(tx, {
      userId: user.id,
      action: 'RECEIVE_TRANSFER',
      ventureId: transfer.toLocation.ventureId,
      details: { transferId: id, status: finalStatus, items: input.items, shortfalls },
    });
    return tx.materialTransfer.findUniqueOrThrow({ where: { id }, include: transferInclude });
  });

  return { transfer: received, shortfalls };
}

/** DRAFT or in-transit -> CANCELLED. Cancelling an in-transit transfer puts the stock back at the source. */
export async function cancelTransfer(user: Actor, id: string, reason: string) {
  const transfer = await getTransfer(user, id);
  if (!(await isVentureInScope(user, transfer.fromLocation.ventureId))) throw notFound('Transfer not found');
  const cancellable = ['DRAFT', ...IN_TRANSIT_STATUSES];
  if (!cancellable.includes(transfer.status)) {
    throw new ApiError(409, `Transfer is ${transfer.status} and can no longer be cancelled`, 'TRANSFER_NOT_CANCELLABLE');
  }

  return runTransaction(async (tx) => {
    // Claim from the exact status we saw, so a concurrent dispatch/receive makes this fail cleanly.
    const claimed = await tx.materialTransfer.updateMany({ where: { id, status: transfer.status }, data: { status: 'CANCELLED' } });
    if (claimed.count === 0) throw new ApiError(409, 'Transfer status changed, please reload', 'TRANSFER_NOT_CANCELLABLE');

    if (IN_TRANSIT_STATUSES.includes(transfer.status)) {
      for (const item of byMaterial(transfer.items)) {
        const key = { materialId: item.materialId, stockLocationId: transfer.fromLocationId };
        const stock = await addStock(tx, key, transfer.fromLocation.ventureId, item.dispatchedQuantity);
        await writeLedger(tx, {
          ...key,
          ventureId: transfer.fromLocation.ventureId,
          transactionType: 'TRANSFER_IN',
          quantityIn: item.dispatchedQuantity,
          balanceAfter: stock.physicalQuantity,
          referenceType: 'TRANSFER',
          referenceId: id,
          performedById: user.id,
          remarks: `Transfer cancelled, returned to source: ${reason}`,
        });
      }
    }

    await recordAudit(tx, {
      userId: user.id,
      action: 'CANCEL_TRANSFER',
      ventureId: transfer.ventureId,
      details: { transferId: id, previousStatus: transfer.status, reason },
    });
    return tx.materialTransfer.findUniqueOrThrow({ where: { id }, include: transferInclude });
  });
}

/** Quantities dispatched but not yet received, per material and destination (derived from the transfer ledger). */
export async function getInTransit(user: Actor) {
  const ventures = await ventureIdFilter(user);
  const items = await prisma.materialTransferItem.findMany({
    where: {
      transfer: {
        status: { in: IN_TRANSIT_STATUSES },
        ...(ventures ? { OR: [{ ventureId: ventures }, { toLocation: { ventureId: ventures } }] } : {}),
      },
    },
    include: { material: { select: { id: true, name: true, code: true } }, transfer: { select: { id: true, transferNumber: true, fromLocationId: true, toLocationId: true, dispatchDate: true } } },
  });

  const totals = new Map<string, { materialId: string; material: { name: string; code: string }; toLocationId: string; quantity: Prisma.Decimal; transfers: string[] }>();
  for (const item of items) {
    const key = `${item.materialId}:${item.transfer.toLocationId}`;
    const row = totals.get(key) ?? { materialId: item.materialId, material: item.material, toLocationId: item.transfer.toLocationId, quantity: dec(0), transfers: [] };
    row.quantity = row.quantity.plus(item.dispatchedQuantity);
    row.transfers.push(item.transfer.transferNumber);
    totals.set(key, row);
  }
  return [...totals.values()];
}

// ---------------------------------------------------------------------------
// Returns (unused material coming back from an issue)
// ---------------------------------------------------------------------------

const returnInclude = {
  items: { include: { material: true } },
  toLocation: true,
  sourceIssue: { select: { id: true, issueNumber: true } },
} satisfies Prisma.MaterialReturnInclude;

export async function listReturns(user: Actor, { sourceIssueId, skip = 0, take = 25 }: { sourceIssueId?: string; skip?: number; take?: number }) {
  const ventures = await ventureIdFilter(user);
  const where: Prisma.MaterialReturnWhereInput = {
    ...(sourceIssueId ? { sourceIssueId } : {}),
    ...(ventures ? { ventureId: ventures } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.materialReturn.findMany({ where, include: returnInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.materialReturn.count({ where }),
  ]);
  return { items, total };
}

export async function getReturn(user: Actor, id: string) {
  const ret = await prisma.materialReturn.findUnique({ where: { id }, include: returnInclude });
  if (!ret || !(await isVentureInScope(user, ret.ventureId))) throw notFound('Return not found');
  return ret;
}

async function replayReturn(input: ReturnCreateInput) {
  const existing = await prisma.materialReturn.findUnique({ where: { id: input.idempotencyKey }, include: returnInclude });
  if (!existing) return null;
  if (
    existing.sourceIssueId !== input.sourceIssueId ||
    !sameItems(
      existing.items.map((i) => ({ materialId: i.materialId, qty: i.quantity })),
      input.items.map((i) => ({ materialId: i.materialId, qty: i.quantity }))
    )
  ) {
    throw idempotencyConflict();
  }
  return { materialReturn: existing, replayed: true };
}

/**
 * Returns material against an issue. The total returned per material can never exceed what that
 * issue issued; the check runs inside the transaction with the issue row locked, so concurrent
 * returns against the same issue are serialised. GOOD units go back into available stock; DAMAGED
 * units are recorded on the return but not restocked.
 */
export async function createReturn(user: Actor, input: ReturnCreateInput) {
  const issue = await prisma.materialIssue.findUnique({ where: { id: input.sourceIssueId }, include: { items: true } });
  if (!issue || !(await isVentureInScope(user, issue.ventureId))) throw notFound('Material issue not found');

  // A retried request returns the original result instead of being re-validated against the new state.
  const prior = await replayReturn(input);
  if (prior) return prior;

  const location = await requireLocationInScope(user, input.toLocationId ?? issue.fromLocationId);
  if (location.ventureId !== issue.ventureId) {
    throw badRequest('Material must be returned to a location in the same venture as the issue', 'toLocationId');
  }

  const issued = new Map<string, Prisma.Decimal>();
  for (const i of issue.items) issued.set(i.materialId, dec(issued.get(i.materialId)).plus(i.issuedQuantity));
  const notIssued = input.items.find((i) => !issued.has(i.materialId));
  if (notIssued) throw badRequest('A returned material was not part of the source issue', 'items');

  const materials = await loadMaterials(prisma, input.items.map((i) => i.materialId), { mustBeActive: false });
  for (const item of input.items) assertUnitPrecision(materials.get(item.materialId)!, item.quantity, 'quantity');

  try {
    const ret = await runTransaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM material_issues WHERE id = ${issue.id} FOR UPDATE`;

      const prior = await tx.materialReturnItem.groupBy({
        by: ['materialId'],
        where: { materialReturn: { sourceIssueId: issue.id } },
        _sum: { quantity: true },
      });
      const alreadyReturned = new Map(prior.map((p) => [p.materialId, dec(p._sum.quantity)]));
      for (const item of input.items) {
        const already = alreadyReturned.get(item.materialId) ?? dec(0);
        const cap = issued.get(item.materialId)!;
        if (already.plus(item.quantity).gt(cap)) {
          throw new ApiError(409, `Return exceeds quantity issued for ${materials.get(item.materialId)!.name}`, 'RETURN_EXCEEDS_ISSUED', 'items', {
            materialId: item.materialId,
            issued: cap,
            alreadyReturned: already,
            requested: item.quantity,
            remaining: Prisma.Decimal.max(0, cap.minus(already)),
          });
        }
      }

      const created = await tx.materialReturn.create({
        data: {
          id: input.idempotencyKey,
          returnNumber: docNumber('RET'),
          ventureId: issue.ventureId,
          toLocationId: location.id,
          sourceIssueId: issue.id,
          reason: input.reason ?? null,
          receivedById: user.id,
          items: { create: input.items.map((i) => ({ materialId: i.materialId, quantity: i.quantity, condition: i.condition })) },
        },
      });

      for (const item of byMaterial(input.items)) {
        if (item.condition !== 'GOOD') continue;
        const key = { materialId: item.materialId, stockLocationId: location.id };
        const stock = await addStock(tx, key, issue.ventureId, item.quantity);
        await writeLedger(tx, {
          ...key,
          ventureId: issue.ventureId,
          transactionType: 'RETURN_IN',
          quantityIn: item.quantity,
          balanceAfter: stock.physicalQuantity,
          referenceType: 'RETURN',
          referenceId: created.id,
          performedById: user.id,
        });
      }

      await recordAudit(tx, {
        userId: user.id,
        action: 'CREATE_RETURN',
        ventureId: issue.ventureId,
        details: { returnId: created.id, sourceIssueId: issue.id, toLocationId: location.id, items: input.items },
      });
      return tx.materialReturn.findUniqueOrThrow({ where: { id: created.id }, include: returnInclude });
    });
    return { materialReturn: ret, replayed: false };
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    // A concurrent request with the same key won the insert.
    const replay = await replayReturn(input);
    if (!replay) throw e;
    return replay;
  }
}

// ---------------------------------------------------------------------------
// Stock adjustments (physical count). Append-only: corrections are new adjustments.
// ---------------------------------------------------------------------------

const adjustmentInclude = {
  items: { include: { material: true } },
  stockLocation: true,
  adjustedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.StockAdjustmentInclude;

export async function listAdjustments(user: Actor, { stockLocationId, skip = 0, take = 25 }: { stockLocationId?: string; skip?: number; take?: number }) {
  const ventures = await ventureIdFilter(user);
  const where: Prisma.StockAdjustmentWhereInput = {
    ...(stockLocationId ? { stockLocationId } : {}),
    ...(ventures ? { ventureId: ventures } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({ where, include: adjustmentInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.stockAdjustment.count({ where }),
  ]);
  return { items, total };
}

export async function getAdjustment(user: Actor, id: string) {
  const adjustment = await prisma.stockAdjustment.findUnique({ where: { id }, include: adjustmentInclude });
  if (!adjustment || !(await isVentureInScope(user, adjustment.ventureId))) throw notFound('Adjustment not found');
  return adjustment;
}

async function replayAdjustment(input: AdjustmentCreateInput) {
  const existing = await prisma.stockAdjustment.findUnique({ where: { id: input.idempotencyKey }, include: adjustmentInclude });
  if (!existing) return null;
  if (
    existing.stockLocationId !== input.stockLocationId ||
    !sameItems(
      existing.items.map((i) => ({ materialId: i.materialId, qty: i.physicalQuantity })),
      input.items.map((i) => ({ materialId: i.materialId, qty: i.physicalQuantity }))
    )
  ) {
    throw idempotencyConflict();
  }
  return { adjustment: existing, replayed: true };
}

/**
 * Records a physical count. The difference is computed against the system quantity read under a row
 * lock inside the transaction, and applied as a delta, so a concurrent issue/receipt is never lost.
 */
export async function createAdjustment(user: Actor, input: AdjustmentCreateInput) {
  const location = await requireLocationInScope(user, input.stockLocationId);
  // A retried request returns the original result instead of being re-validated against the new state.
  const prior = await replayAdjustment(input);
  if (prior) return prior;

  const materials = await loadMaterials(prisma, input.items.map((i) => i.materialId), { mustBeActive: false });
  for (const item of input.items) assertUnitPrecision(materials.get(item.materialId)!, item.physicalQuantity, 'physicalQuantity');

  try {
    const adjustment = await runTransaction(async (tx) => {
      const lines: { materialId: string; systemQuantity: Prisma.Decimal; physicalQuantity: Prisma.Decimal; adjustmentQuantity: Prisma.Decimal }[] = [];

      for (const item of byMaterial(input.items)) {
        const key = { materialId: item.materialId, stockLocationId: location.id };
        const stock = await lockStock(tx, key, location.ventureId);
        const counted = dec(item.physicalQuantity);
        const delta = counted.minus(stock.physicalQuantity);
        const name = materials.get(item.materialId)!.name;

        if (delta.isZero()) {
          throw new ApiError(409, `Physical count for ${name} equals the system quantity; nothing to adjust`, 'ADJUSTMENT_NO_CHANGE', 'items', {
            materialId: item.materialId,
            systemQuantity: stock.physicalQuantity,
          });
        }
        if (counted.lt(stock.reservedQuantity) || stock.availableQuantity.plus(delta).isNegative()) {
          throw new ApiError(409, `Physical count for ${name} is below the reserved quantity`, 'ADJUSTMENT_BELOW_RESERVED', 'items', {
            materialId: item.materialId,
            physicalQuantity: item.physicalQuantity,
            reservedQuantity: stock.reservedQuantity,
          });
        }

        const updated = await tx.materialStock.update({
          where: { materialId_stockLocationId: key },
          data: { physicalQuantity: { increment: delta }, availableQuantity: { increment: delta } },
        });
        await writeLedger(tx, {
          ...key,
          ventureId: location.ventureId,
          transactionType: delta.isPositive() ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          quantityIn: delta.isPositive() ? delta : 0,
          quantityOut: delta.isNegative() ? delta.negated() : 0,
          balanceAfter: updated.physicalQuantity,
          referenceType: 'ADJUSTMENT',
          referenceId: input.idempotencyKey,
          performedById: user.id,
          remarks: input.reason,
        });
        lines.push({ materialId: item.materialId, systemQuantity: stock.physicalQuantity, physicalQuantity: counted, adjustmentQuantity: delta });
      }

      const created = await tx.stockAdjustment.create({
        data: {
          id: input.idempotencyKey,
          adjustmentNumber: docNumber('ADJ'),
          ventureId: location.ventureId,
          stockLocationId: location.id,
          reason: input.reason,
          notes: input.notes ?? null,
          adjustedById: user.id,
          items: { create: lines },
        },
        include: adjustmentInclude,
      });

      await recordAudit(tx, {
        userId: user.id,
        action: 'CREATE_STOCK_ADJUSTMENT',
        ventureId: location.ventureId,
        details: { adjustmentId: created.id, stockLocationId: location.id, reason: input.reason, lines },
      });
      return created;
    });
    return { adjustment, replayed: false };
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    // A concurrent request with the same key won the insert.
    const replay = await replayAdjustment(input);
    if (!replay) throw e;
    return replay;
  }
}
