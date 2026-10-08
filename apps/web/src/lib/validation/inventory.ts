import { z } from 'zod';
import { optionalText, requiredId, requiredText } from './common';

// Upper bound on any single quantity; anything larger is a fat-finger, not real stock.
export const MAX_QUANTITY = 1_000_000_000;

const toNumber = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v);

/** A quantity that must be > 0 (issued, dispatched, returned). */
export const positiveQuantity = (field: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ required_error: `${field} is required`, invalid_type_error: `${field} must be a number` })
      .finite(`${field} must be a finite number`)
      .gt(0, `${field} must be greater than 0`)
      .max(MAX_QUANTITY, `${field} is unrealistically large`)
  );

/** A quantity that may be exactly 0 (a physical count of an empty shelf, damaged units on receipt). */
export const nonNegativeQuantity = (field: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ required_error: `${field} is required`, invalid_type_error: `${field} must be a number` })
      .finite(`${field} must be a finite number`)
      .min(0, `${field} cannot be negative`)
      .max(MAX_QUANTITY, `${field} is unrealistically large`)
  );

const idempotencyKey = z
  .string({ required_error: 'idempotencyKey is required' })
  .uuid('idempotencyKey must be a UUID');

const uniqueMaterials = <T extends { materialId: string }>(items: T[]) =>
  new Set(items.map((i) => i.materialId)).size === items.length;

const itemList = <T extends z.ZodTypeAny>(item: T) =>
  z
    .array(item, { required_error: 'items is required' })
    .min(1, 'At least one item is required')
    .max(200, 'Too many items')
    .refine(uniqueMaterials, 'Each material may appear only once');

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export const transferCreateSchema = z
  .object({
    fromLocationId: requiredId('fromLocationId'),
    toLocationId: requiredId('toLocationId'),
    idempotencyKey,
    items: itemList(z.object({ materialId: requiredId('materialId'), quantity: positiveQuantity('quantity') })),
  })
  .strict()
  .refine((d) => d.fromLocationId !== d.toLocationId, {
    message: 'Source and destination locations must differ',
    path: ['toLocationId'],
  });

export const transferReceiveSchema = z
  .object({
    items: itemList(
      z.object({
        materialId: requiredId('materialId'),
        receivedQuantity: nonNegativeQuantity('receivedQuantity'),
        damagedQuantity: nonNegativeQuantity('damagedQuantity').default(0),
      })
    ),
  })
  .strict();

export const transferCancelSchema = z.object({ reason: requiredText('reason', 1000) }).strict();

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

export const RETURN_CONDITIONS = ['GOOD', 'DAMAGED'] as const;

export const returnCreateSchema = z
  .object({
    sourceIssueId: requiredId('sourceIssueId'),
    // Defaults to the issue's source location.
    toLocationId: requiredId('toLocationId').optional(),
    reason: optionalText('reason', 1000),
    idempotencyKey,
    items: itemList(
      z.object({
        materialId: requiredId('materialId'),
        quantity: positiveQuantity('quantity'),
        condition: z
          .enum(RETURN_CONDITIONS, { errorMap: () => ({ message: `condition must be one of: ${RETURN_CONDITIONS.join(', ')}` }) })
          .default('GOOD'),
      })
    ),
  })
  .strict();

// ---------------------------------------------------------------------------
// Stock adjustments (physical count)
// ---------------------------------------------------------------------------

export const adjustmentCreateSchema = z
  .object({
    stockLocationId: requiredId('stockLocationId'),
    reason: requiredText('reason', 500),
    notes: optionalText('notes', 2000),
    idempotencyKey,
    items: itemList(
      z.object({ materialId: requiredId('materialId'), physicalQuantity: nonNegativeQuantity('physicalQuantity') })
    ),
  })
  .strict();

export type TransferCreateInput = z.output<typeof transferCreateSchema>;
export type TransferReceiveInput = z.output<typeof transferReceiveSchema>;
export type ReturnCreateInput = z.output<typeof returnCreateSchema>;
export type AdjustmentCreateInput = z.output<typeof adjustmentCreateSchema>;
