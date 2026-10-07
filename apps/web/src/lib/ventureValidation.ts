import { z } from 'zod';
import { EmployeeStatus, Prisma, VentureStatus, VentureType } from '@prisma/client';
import type { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

// Forms submit '' for untouched inputs — treat that (and whitespace) as "not provided".
const emptyToNull = (v: unknown) =>
  v === undefined ? undefined : v === null || (typeof v === 'string' && v.trim() === '') ? null : v;

const optionalText = (field: string, max: number) =>
  z.preprocess(
    emptyToNull,
    z.string({ invalid_type_error: `${field} must be a string` })
      .trim()
      .max(max, `${field} must be at most ${max} characters`)
      .nullable()
      .optional()
  );

const optionalNumber = (field: string, min?: number, max?: number) => {
  let num = z.number({ invalid_type_error: `${field} must be a number` }).finite(`${field} must be a number`);
  if (min !== undefined) num = num.min(min, `${field} must be at least ${min}`);
  if (max !== undefined) num = num.max(max, `${field} must be at most ${max}`);
  return z.preprocess(
    (v) => {
      const e = emptyToNull(v);
      if (typeof e === 'string') {
        const n = Number(e.trim());
        return Number.isNaN(n) ? e : n;
      }
      return e;
    },
    num.nullable().optional()
  );
};

// Accepts YYYY-MM-DD or a full ISO-8601 datetime. Rejects impossible calendar
// dates (e.g. 2026-02-29) instead of letting JS silently roll them over.
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function parseStrictDate(value: string): Date | null {
  const m = ISO_DATE_RE.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(y, mo - 1, d); // not Date.UTC — that maps years 0-99 to 1900-1999
  if (calendar.getUTCFullYear() !== y || calendar.getUTCMonth() !== mo - 1 || calendar.getUTCDate() !== d) return null;
  // Date-only strings are pinned to UTC midnight so the calendar day never shifts.
  const parsed = value.length === 10 ? calendar : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const optionalDate = (field: string) =>
  z.preprocess(
    emptyToNull,
    z.string({ invalid_type_error: `${field} must be a date string (YYYY-MM-DD)` })
      .trim()
      .transform((v, ctx) => {
        const d = parseStrictDate(v);
        if (!d) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} must be a valid date (YYYY-MM-DD)` });
          return z.NEVER;
        }
        return d;
      })
      .nullable()
      .optional()
  );

const optionalId = (field: string) =>
  z.preprocess(
    emptyToNull,
    z.string({ invalid_type_error: `${field} must be a string` }).trim().max(64, `${field} is invalid`).nullable().optional()
  );

// ---------------------------------------------------------------------------
// Venture schemas
// ---------------------------------------------------------------------------

const NAME_MAX = 200;
const CODE_MAX = 50;

const name = z
  .string({ required_error: 'name is required', invalid_type_error: 'name must be a string' })
  .trim()
  .min(1, 'name must not be empty')
  .max(NAME_MAX, `name must be at most ${NAME_MAX} characters`);

const code = z
  .string({ required_error: 'code is required', invalid_type_error: 'code must be a string' })
  .trim()
  .min(1, 'code must not be empty')
  .max(CODE_MAX, `code must be at most ${CODE_MAX} characters`);

const sharedFields = {
  description: optionalText('description', 5000),
  regAddressLine1: optionalText('regAddressLine1', 300),
  regCity: optionalText('regCity', 100),
  regState: optionalText('regState', 100),
  regPincode: optionalText('regPincode', 20),
  regDistrict: optionalText('regDistrict', 100),
  siteAddressLine1: optionalText('siteAddressLine1', 300),
  siteCity: optionalText('siteCity', 100),
  siteState: optionalText('siteState', 100),
  sitePincode: optionalText('sitePincode', 20),
  siteDistrict: optionalText('siteDistrict', 100),
  latitude: optionalNumber('latitude', -90, 90),
  longitude: optionalNumber('longitude', -180, 180),
  planningStartDate: optionalDate('planningStartDate'),
  startDate: optionalDate('startDate'),
  expectedCompletionDate: optionalDate('expectedCompletionDate'),
  estimatedBudget: optionalNumber('estimatedBudget', 0),
  projectDirectorId: optionalId('projectDirectorId'),
  projectManagerId: optionalId('projectManagerId'),
  siteManagerId: optionalId('siteManagerId'),
};

export const ventureCreateSchema = z.object({
  name,
  code,
  type: z.nativeEnum(VentureType, { errorMap: () => ({ message: 'type is invalid' }) }).default(VentureType.RESIDENTIAL),
  status: z.nativeEnum(VentureStatus, { errorMap: () => ({ message: 'status is invalid' }) }).default(VentureStatus.ACTIVE),
  ...sharedFields,
});

// Only the scalar setting toggles may be changed — never a client-supplied nested write.
const settingsSchema = z
  .object({
    minStockThresholdDefault: z.number({ invalid_type_error: 'settings.minStockThresholdDefault must be a number' }).finite().min(0).optional(),
    requireMaterialApproval: z.boolean({ invalid_type_error: 'settings.requireMaterialApproval must be a boolean' }).optional(),
    allowEmployeeSelfAssignment: z.boolean({ invalid_type_error: 'settings.allowEmployeeSelfAssignment must be a boolean' }).optional(),
    allowFileUploadInChat: z.boolean({ invalid_type_error: 'settings.allowFileUploadInChat must be a boolean' }).optional(),
    notifyOnLowStock: z.boolean({ invalid_type_error: 'settings.notifyOnLowStock must be a boolean' }).optional(),
    notifyOnMaterialRequests: z.boolean({ invalid_type_error: 'settings.notifyOnMaterialRequests must be a boolean' }).optional(),
  })
  .strict();

// Every field optional; unknown keys are silently dropped (same allowlist behaviour as before).
export const ventureUpdateSchema = z.object({
  name: name.optional(),
  type: z.nativeEnum(VentureType, { errorMap: () => ({ message: 'type is invalid' }) }).optional(),
  status: z.nativeEnum(VentureStatus, { errorMap: () => ({ message: 'status is invalid' }) }).optional(),
  ...sharedFields,
  // Non-nullable column: a number is required if the key is present.
  progressPercentage: z
    .number({ required_error: 'progressPercentage must be a number', invalid_type_error: 'progressPercentage must be a number' })
    .finite('progressPercentage must be a number')
    .min(0, 'progressPercentage must be at least 0')
    .max(100, 'progressPercentage must be at most 100')
    .optional(),
  constructionManagerId: optionalId('constructionManagerId'),
  financeManagerId: optionalId('financeManagerId'),
  purchaseManagerId: optionalId('purchaseManagerId'),
  // Accept the legacy `{ upsert: { create, update } }` shape the UI sends, but only its scalar fields.
  settings: z
    .preprocess(
      (v: any) => (v && typeof v === 'object' && v.upsert ? { ...v.upsert.create, ...v.upsert.update } : v),
      settingsSchema
    )
    .optional(),
});

type VentureDates = {
  planningStartDate?: Date | null;
  startDate?: Date | null;
  expectedCompletionDate?: Date | null;
};

/** Returns an error message if the timeline is out of order, otherwise null. */
export function checkDateOrder({ planningStartDate, startDate, expectedCompletionDate }: VentureDates): string | null {
  if (planningStartDate && startDate && startDate < planningStartDate) {
    return 'startDate cannot be before planningStartDate';
  }
  if (startDate && expectedCompletionDate && expectedCompletionDate < startDate) {
    return 'expectedCompletionDate cannot be before startDate';
  }
  if (planningStartDate && expectedCompletionDate && expectedCompletionDate < planningStartDate) {
    return 'expectedCompletionDate cannot be before planningStartDate';
  }
  return null;
}

/** Coordinates are only meaningful as a pair — both set or both empty. */
export function checkCoordinatePair(latitude?: number | null, longitude?: number | null): string | null {
  const hasLat = latitude !== undefined && latitude !== null;
  const hasLng = longitude !== undefined && longitude !== null;
  return hasLat === hasLng ? null : 'latitude and longitude must be provided together';
}

export const LEADER_FIELDS = [
  'projectDirectorId', 'projectManagerId', 'siteManagerId',
  'constructionManagerId', 'financeManagerId', 'purchaseManagerId',
] as const;

/**
 * Leaders must be real, non-terminated employees with an active login — otherwise
 * the venture ends up with a leader who can never act in the role.
 * Returns an error message, or null if every provided leader is assignable.
 */
export async function checkLeaders(
  db: { employee: { findMany: typeof prisma.employee.findMany } },
  data: Partial<Record<(typeof LEADER_FIELDS)[number], string | null | undefined>>
): Promise<string | null> {
  const requested = LEADER_FIELDS.filter((f) => data[f]).map((f) => ({ field: f, id: data[f] as string }));
  if (requested.length === 0) return null;

  const employees = await db.employee.findMany({
    where: { id: { in: [...new Set(requested.map((r) => r.id))] } },
    select: { id: true, status: true, user: { select: { isActive: true } } },
  });
  const byId = new Map(employees.map((e) => [e.id, e]));

  for (const { field, id } of requested) {
    const emp = byId.get(id);
    if (!emp) return `${field}: employee does not exist`;
    if (emp.status === EmployeeStatus.TERMINATED) return `${field}: employee is terminated`;
    if (!emp.user) return `${field}: employee has no user account and cannot act as a leader`;
    if (!emp.user.isActive) return `${field}: employee's user account is inactive`;
  }
  return null;
}

export function validationErrorResponse(error: z.ZodError) {
  const issue = error.issues[0];
  return NextResponse.json(
    { success: false, error: issue?.message || 'Invalid request body', field: issue?.path.join('.') || undefined },
    { status: 400 }
  );
}

/**
 * Maps known Prisma errors to clean client responses. Never returns raw Prisma
 * messages, which leak internal query structure.
 */
export function dbErrorResponse(error: unknown, context: string) {
  console.error(`Database error in ${context}:`, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A venture with this code already exists.' }, { status: 409 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'One or more referenced records do not exist.' }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Venture not found' }, { status: 404 });
    }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ success: false, error: 'Invalid request data' }, { status: 400 });
  }
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
}
