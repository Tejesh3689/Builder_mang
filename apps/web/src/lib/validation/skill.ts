import { z } from 'zod';
import { requiredText } from './common';

export const PROFICIENCIES = ['Beginner', 'Intermediate', 'Expert'] as const;
export const VERIFICATION_STATUSES = ['Pending', 'Verified', 'Rejected'] as const;

export const skillFields = {
  category: requiredText('category', 50),
  proficiency: z.enum(PROFICIENCIES, { errorMap: () => ({ message: `proficiency must be one of: ${PROFICIENCIES.join(', ')}` }) }),
  experienceYears: z
    .number({ invalid_type_error: 'experienceYears must be a number' })
    .int('experienceYears must be a whole number')
    .min(0, 'experienceYears must be at least 0')
    .max(60, 'experienceYears must be at most 60'),
  verificationStatus: z.enum(VERIFICATION_STATUSES, {
    errorMap: () => ({ message: `verificationStatus must be one of: ${VERIFICATION_STATUSES.join(', ')}` }),
  }),
};

// verifiedBy / verificationDate are set by the server from the acting user, never by the client.
export const skillUpdateSchema = z.object({
  category: skillFields.category.optional(),
  proficiency: skillFields.proficiency.optional(),
  experienceYears: skillFields.experienceYears.optional(),
  verificationStatus: skillFields.verificationStatus.optional(),
});
