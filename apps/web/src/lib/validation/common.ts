import { z } from 'zod';

/**
 * Shared Zod building blocks. Conventions for every POST/PATCH body:
 *  - Strings are trimmed; whitespace-only required values are rejected.
 *  - Optional inputs treat '' / whitespace / null as "clear the value" (null);
 *    an absent key means "leave unchanged" (undefined).
 *  - Every string has a max length; numbers must be finite and range-checked.
 *  - Dates are parsed strictly — impossible calendar dates are rejected, never rolled over.
 *  - Error messages start with the field name so clients can show them directly.
 */

export const emptyToNull = (v: unknown) =>
  v === undefined ? undefined : v === null || (typeof v === 'string' && v.trim() === '') ? null : v;

export const requiredText = (field: string, max: number) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` })
    .trim()
    .min(1, `${field} must not be empty`)
    .max(max, `${field} must be at most ${max} characters`);

export const optionalText = (field: string, max: number) =>
  z.preprocess(
    emptyToNull,
    z
      .string({ invalid_type_error: `${field} must be a string` })
      .trim()
      .max(max, `${field} must be at most ${max} characters`)
      .nullable()
      .optional()
  );

export const optionalNumber = (field: string, min?: number, max?: number) => {
  let num = z.number({ invalid_type_error: `${field} must be a number` }).finite(`${field} must be a number`);
  if (min !== undefined) num = num.min(min, `${field} must be at least ${min}`);
  if (max !== undefined) num = num.max(max, `${field} must be at most ${max}`);
  return z.preprocess((v) => {
    const e = emptyToNull(v);
    if (typeof e === 'string') {
      const n = Number(e.trim());
      return Number.isNaN(n) ? e : n;
    }
    return e;
  }, num.nullable().optional());
};

/** A record id passed in a body. Empty -> null (clears the reference). */
export const optionalId = (field: string) =>
  z.preprocess(
    emptyToNull,
    z.string({ invalid_type_error: `${field} must be a string` }).trim().max(64, `${field} is invalid`).nullable().optional()
  );

export const requiredId = (field: string) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a string` })
    .trim()
    .min(1, `${field} is required`)
    .max(64, `${field} is invalid`);

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function calendarDate(y: number, m: number, d: number): Date | null {
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d); // not Date.UTC — that maps years 0-99 to 1900-1999
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

/** Strict YYYY-MM-DD -> Date at UTC midnight, or null if not a real calendar date. */
export function parseDateOnly(value: string): Date | null {
  const m = DATE_ONLY_RE.exec(value);
  return m ? calendarDate(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

/** YYYY-MM-DD or full ISO-8601 datetime. Date-only strings are pinned to UTC midnight. */
export function parseDateOrDateTime(value: string): Date | null {
  const m = ISO_DATE_RE.exec(value);
  if (!m) return null;
  const calendar = calendarDate(Number(m[1]), Number(m[2]), Number(m[3]));
  if (!calendar) return null;
  const parsed = value.length === 10 ? calendar : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formats a Date as its UTC calendar day (YYYY-MM-DD). */
export const toDateOnlyString = (d: Date) => d.toISOString().slice(0, 10);

/** Today's calendar date in the business time zone (IST), as a UTC-midnight Date. */
export function businessToday(now = new Date()): Date {
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  return calendarDate(ist.getUTCFullYear(), ist.getUTCMonth() + 1, ist.getUTCDate())!;
}

const dateField = (field: string, parse: (v: string) => Date | null, hint: string) =>
  z
    .string({ required_error: `${field} is required`, invalid_type_error: `${field} must be a date string (${hint})` })
    .trim()
    .transform((v, ctx) => {
      const d = parse(v);
      if (!d) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field} must be a valid date (${hint})` });
        return z.NEVER;
      }
      return d;
    });

/** Optional date accepting YYYY-MM-DD or ISO datetime. '' -> null. */
export const optionalDate = (field: string) =>
  z.preprocess(emptyToNull, dateField(field, parseDateOrDateTime, 'YYYY-MM-DD').nullable().optional());

/** Strict date-only (YYYY-MM-DD) for business dates with no time component. */
export const requiredDateOnly = (field: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    dateField(field, parseDateOnly, 'YYYY-MM-DD')
  );

export const optionalDateOnly = (field: string) =>
  z.preprocess(emptyToNull, dateField(field, parseDateOnly, 'YYYY-MM-DD').nullable().optional());

/** Restricts a date to a plausible business range. */
export const withinYears = (date: Date, minYear: number, maxYear: number) => {
  const y = date.getUTCFullYear();
  return y >= minYear && y <= maxYear;
};
