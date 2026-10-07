import { z } from 'zod';
import { EmployeeStatus } from '@prisma/client';
import {
  businessToday,
  emptyToNull,
  optionalDateOnly,
  optionalId,
  optionalText,
  requiredText,
  toDateOnlyString,
  withinYears,
} from './common';

/**
 * THE authoritative Employee input schema. Every route that writes employee
 * fields (create, update, admin user provisioning) validates through here.
 */

export const EMPLOYMENT_TYPES = ['Permanent', 'Full-Time Contractor', 'Daily Wage'] as const;
export const ONBOARDING_STAGES = [
  'Candidate', 'Documents', 'Verification', 'Safety Training', 'Site Orientation', 'Project Assignment', 'Active',
] as const;

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Normalises a phone number to E.164 ("+919845022341"). Bare 10-digit numbers
 * and 0-prefixed trunk numbers are treated as Indian. Indian numbers must be a
 * valid 10-digit mobile (starting 6-9). Returns null if the input is not a phone number.
 */
export function normalizePhone(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) return null;

  let digits = cleaned.replace(/^\+/, '');
  if (!cleaned.startsWith('+')) {
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
    else if (!(digits.length === 12 && digits.startsWith('91'))) return null;
  }

  if (digits.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digits) ? `+${digits}` : null;
  }
  return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? `+${digits}` : null;
}

const phone = z.preprocess(
  emptyToNull,
  z
    .string({ invalid_type_error: 'phone must be a string' })
    .max(30, 'phone is invalid')
    .transform((v, ctx) => {
      const normalized = normalizePhone(v);
      if (!normalized) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'phone must be a valid phone number (e.g. +91 98450 22341)' });
        return z.NEVER;
      }
      return normalized;
    })
    .nullable()
    .optional()
);

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const normalizeEmail = (v: string) => v.trim().toLowerCase();

const email = z.preprocess(
  emptyToNull,
  z
    .string({ invalid_type_error: 'email must be a string' })
    .trim()
    .toLowerCase()
    .max(254, 'email must be at most 254 characters')
    .email('email must be a valid email address')
    .nullable()
    .optional()
);

// ---------------------------------------------------------------------------
// Other fields
// ---------------------------------------------------------------------------

const joiningDate = optionalDateOnly('joiningDate').superRefine((d, ctx) => {
  if (!(d instanceof Date)) return; // null, or already rejected by the date parser
  const latest = new Date(businessToday().getTime() + 366 * 24 * 60 * 60 * 1000);
  if (!withinYears(d, 1950, 9999) || d > latest) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'joiningDate must be between 1950 and one year from today' });
  }
});

const employmentType = z.preprocess(
  emptyToNull,
  z.enum(EMPLOYMENT_TYPES, { errorMap: () => ({ message: `employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}` }) })
    .nullable()
    .optional()
);

const status = z.nativeEnum(EmployeeStatus, {
  errorMap: () => ({ message: `status must be one of: ${Object.values(EmployeeStatus).join(', ')}` }),
});

const onboardingStage = z.enum(ONBOARDING_STAGES, {
  errorMap: () => ({ message: `onboardingStage must be one of: ${ONBOARDING_STAGES.join(', ')}` }),
});
const onboardingStatus = requiredText('onboardingStatus', 50);

// lastName is optional (single-name workers); '' / whitespace -> ''.
const lastName = optionalText('lastName', 100).transform((v) => (v === undefined ? undefined : v ?? ''));

const fields = {
  firstName: requiredText('firstName', 100),
  lastName,
  email,
  phone,
  designation: requiredText('designation', 100),
  department: requiredText('department', 100),
  joiningDate,
  reportingManagerId: optionalId('reportingManagerId'),
  employmentType,
  onboardingStage,
  onboardingStatus,
};

export const employeeCreateSchema = z.object({
  ...fields,
  department: fields.department.default('Site Operations'),
  // A new employee starts ACTIVE or ON_LEAVE; termination is a lifecycle operation.
  status: z.enum([EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE], {
    errorMap: () => ({ message: 'status must be ACTIVE or ON_LEAVE for a new employee' }),
  }).default(EmployeeStatus.ACTIVE),
  onboardingStage: onboardingStage.default('Active'),
  onboardingStatus: onboardingStatus.default('Active'),
  // Optional initial venture assignment; the UI sends 'none' for "no assignment".
  ventureId: z.preprocess((v) => (v === 'none' ? null : v), optionalId('ventureId')),
});

export const employeeUpdateSchema = z.object({
  firstName: fields.firstName.optional(),
  lastName: fields.lastName,
  email: fields.email,
  phone: fields.phone,
  designation: fields.designation.optional(),
  department: fields.department.optional(),
  joiningDate: fields.joiningDate,
  reportingManagerId: fields.reportingManagerId,
  employmentType: fields.employmentType,
  status: status.optional(),
  onboardingStage: onboardingStage.optional(),
  onboardingStatus: onboardingStatus.optional(),
});

export const onboardingUpdateSchema = z.object({
  onboardingStage,
  onboardingStatus,
});

export type EmployeeCreateInput = z.output<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.output<typeof employeeUpdateSchema>;

/** Employee.joiningDate is stored as a YYYY-MM-DD string column. */
export const joiningDateColumn = (d: Date | null | undefined) =>
  d === undefined ? undefined : d === null ? null : toDateOnlyString(d);
