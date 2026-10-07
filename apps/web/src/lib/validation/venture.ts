import { z } from 'zod';
import { VentureStatus, VentureType } from '@prisma/client';
import { badRequest } from '@/lib/http/errors';
import { optionalDate, optionalId, optionalNumber, optionalText, requiredText } from './common';

const name = requiredText('name', 200);
const code = requiredText('code', 50);
const type = z.nativeEnum(VentureType, { errorMap: () => ({ message: 'type is invalid' }) });
const status = z.nativeEnum(VentureStatus, { errorMap: () => ({ message: 'status is invalid' }) });

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
  type: type.default(VentureType.RESIDENTIAL),
  status: status.default(VentureStatus.ACTIVE),
  ...sharedFields,
});

// Only the scalar setting toggles may be changed — never a client-supplied nested write.
export const ventureSettingsSchema = z
  .object({
    minStockThresholdDefault: z
      .number({ invalid_type_error: 'settings.minStockThresholdDefault must be a number' })
      .finite()
      .min(0, 'settings.minStockThresholdDefault must be at least 0')
      .optional(),
    requireMaterialApproval: z.boolean({ invalid_type_error: 'settings.requireMaterialApproval must be a boolean' }).optional(),
    allowEmployeeSelfAssignment: z.boolean({ invalid_type_error: 'settings.allowEmployeeSelfAssignment must be a boolean' }).optional(),
    allowFileUploadInChat: z.boolean({ invalid_type_error: 'settings.allowFileUploadInChat must be a boolean' }).optional(),
    notifyOnLowStock: z.boolean({ invalid_type_error: 'settings.notifyOnLowStock must be a boolean' }).optional(),
    notifyOnMaterialRequests: z.boolean({ invalid_type_error: 'settings.notifyOnMaterialRequests must be a boolean' }).optional(),
  })
  .strict();

// Every field optional; unknown keys are dropped (allowlist).
export const ventureUpdateSchema = z.object({
  name: name.optional(),
  type: type.optional(),
  status: status.optional(),
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
      ventureSettingsSchema
    )
    .optional(),
});

export type VentureCreateInput = z.output<typeof ventureCreateSchema>;
export type VentureUpdateInput = z.output<typeof ventureUpdateSchema>;

export const LEADER_FIELDS = [
  'projectDirectorId', 'projectManagerId', 'siteManagerId',
  'constructionManagerId', 'financeManagerId', 'purchaseManagerId',
] as const;

/** Fields whose changes are recorded with old/new values in the audit log. */
export const AUDITED_VENTURE_FIELDS = [
  ...LEADER_FIELDS,
  'estimatedBudget', 'status', 'name', 'type',
  'planningStartDate', 'startDate', 'expectedCompletionDate', 'progressPercentage',
] as const;

/** Throws 400 if the timeline is out of order. */
export function assertDateOrder(d: { planningStartDate?: Date | null; startDate?: Date | null; expectedCompletionDate?: Date | null }) {
  if (d.planningStartDate && d.startDate && d.startDate < d.planningStartDate) {
    throw badRequest('startDate cannot be before planningStartDate', 'startDate');
  }
  if (d.startDate && d.expectedCompletionDate && d.expectedCompletionDate < d.startDate) {
    throw badRequest('expectedCompletionDate cannot be before startDate', 'expectedCompletionDate');
  }
  if (d.planningStartDate && d.expectedCompletionDate && d.expectedCompletionDate < d.planningStartDate) {
    throw badRequest('expectedCompletionDate cannot be before planningStartDate', 'expectedCompletionDate');
  }
}

/** Coordinates are only meaningful as a pair — both set or both empty. */
export function assertCoordinatePair(latitude?: number | null, longitude?: number | null) {
  const hasLat = latitude !== undefined && latitude !== null;
  const hasLng = longitude !== undefined && longitude !== null;
  if (hasLat !== hasLng) throw badRequest('latitude and longitude must be provided together', hasLat ? 'longitude' : 'latitude');
}
