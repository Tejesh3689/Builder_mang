import { z } from 'zod';

export const IANA_TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

export const companySettingsBaseSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, 'Legal name must be between 2 and 120 characters')
    .max(120, 'Legal name must be between 2 and 120 characters'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be between 2 and 60 characters')
    .max(60, 'Display name must be between 2 and 60 characters'),
  supportEmail: z
    .string()
    .trim()
    .email('Invalid support email address'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian phone number')
    .optional()
    .or(z.literal(''))
    .nullable(),
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL (include https://)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  addressLine: z.string().trim().max(200).optional().or(z.literal('')).nullable(),
  city: z.string().trim().max(100).optional().or(z.literal('')).nullable(),
  state: z.string().trim().max(100).optional().or(z.literal('')).nullable(),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be 6 digits and cannot start with 0')
    .optional()
    .or(z.literal(''))
    .nullable(),
  currency: z.enum(['INR', 'USD', 'AED']),
  timezone: z.string().refine((val) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: val });
      return true;
    } catch {
      return false;
    }
  }, 'Timezone must be a valid IANA timezone'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
  weekStartsOn: z.enum(['MONDAY', 'SUNDAY']),
  shiftStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Shift start must be in HH:mm format'),
  shiftEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Shift end must be in HH:mm format'),
  lateGraceMinutes: z.coerce.number().int().min(0).max(120),
  weeklyOffDays: z.string().default('SUNDAY'),
  allowNegativeStock: z.boolean().default(false),
  requireMaterialRequestApproval: z.boolean().default(true),
  sessionTimeoutMinutes: z.coerce.number().int().min(15).max(1440),
  passwordMinLength: z.coerce.number().int().min(8).max(32),
  passwordRequireUppercase: z.boolean().default(true),
  passwordRequireNumber: z.boolean().default(true),
  passwordRequireSpecial: z.boolean().default(false),
});

export const companySettingsSchema = companySettingsBaseSchema.refine(
  (data) => {
    if (data.shiftStart && data.shiftEnd) {
      const [startH, startM] = data.shiftStart.split(':').map(Number);
      const [endH, endM] = data.shiftEnd.split(':').map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    }
    return true;
  },
  {
    message: 'Shift end time must be after shift start time',
    path: ['shiftEnd'],
  }
);

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export const companySettingsPatchSchema = companySettingsBaseSchema.partial().extend({
  version: z.number().int({ message: 'Concurrency version is required' }),
}).refine(
  (data) => {
    if (data.shiftStart && data.shiftEnd) {
      const [startH, startM] = data.shiftStart.split(':').map(Number);
      const [endH, endM] = data.shiftEnd.split(':').map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    }
    return true;
  },
  {
    message: 'Shift end time must be after shift start time',
    path: ['shiftEnd'],
  }
);

export type CompanySettingsPatchInput = z.infer<typeof companySettingsPatchSchema>;
