import { z } from 'zod';
import { optionalDate, optionalId, optionalText, requiredId } from './common';

export const ACCESS_LEVELS = ['STANDARD', 'FULL_ACCESS', 'OPERATIONS', 'MATERIALS_ONLY', 'READ_ONLY'] as const;
export const ASSIGNMENT_STATUSES = ['ACTIVE', 'COMPLETED'] as const;

const accessLevel = z.enum(ACCESS_LEVELS, {
  errorMap: () => ({ message: `accessLevel must be one of: ${ACCESS_LEVELS.join(', ')}` }),
});

export const assignmentCreateSchema = z.object({
  ventureId: requiredId('ventureId'),
  roleAtSite: optionalText('roleAtSite', 100),
  accessLevel: accessLevel.default('STANDARD'),
  startDate: optionalDate('startDate'),
  // Legacy UI field name; both are accepted. '' / '—' mean "no change".
  reportingManagerId: optionalId('reportingManagerId'),
  reportingManager: z.preprocess((v) => (v === '—' ? undefined : v), optionalId('reportingManager')),
});

/** POST /api/ventures/:id/members — venture comes from the URL. */
export const memberCreateSchema = z.object({
  employeeId: requiredId('employeeId'),
  roleAtSite: optionalText('roleAtSite', 100),
  accessLevel: accessLevel.default('STANDARD'),
});

export const assignmentUpdateSchema = z.object({
  accessLevel: accessLevel.optional(),
  status: z.enum(ASSIGNMENT_STATUSES, {
    errorMap: () => ({ message: `status must be one of: ${ASSIGNMENT_STATUSES.join(', ')}` }),
  }).optional(),
  roleAtSite: optionalText('roleAtSite', 100),
  endDate: optionalDate('endDate'),
});

export type AssignmentUpdateInput = z.output<typeof assignmentUpdateSchema>;
