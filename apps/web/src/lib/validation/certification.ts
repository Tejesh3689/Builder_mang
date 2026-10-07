import { z } from 'zod';
import { badRequest } from '@/lib/http/errors';
import { businessToday, optionalDateOnly, optionalText, requiredDateOnly, requiredText, withinYears } from './common';

export const CERT_MIN_YEAR = 1950;
export const CERT_MAX_YEAR = 2100;
export const EXPIRING_SOON_DAYS = 30;
export const DEFAULT_AUTHORITY = 'National Safety Agency';

export const certificationCreateSchema = z.object({
  certification: requiredText('certification', 150),
  certificateNo: requiredText('certificateNo', 100),
  issueDate: optionalDateOnly('issueDate'),
  expiryDate: requiredDateOnly('expiryDate'),
  authority: optionalText('authority', 150),
});

// `status` is derived from expiryDate and is never accepted from the client.
export const certificationUpdateSchema = z.object({
  certification: requiredText('certification', 150).optional(),
  certificateNo: requiredText('certificateNo', 100).optional(),
  // Both columns are required, so null is rejected rather than treated as "clear".
  issueDate: requiredDateOnly('issueDate').optional(),
  expiryDate: requiredDateOnly('expiryDate').optional(),
  authority: optionalText('authority', 150),
});

/**
 * Date rules (all on calendar dates, no time component):
 *  - issueDate is between 1950 and today (a certificate cannot be issued in the future)
 *  - expiryDate is between 1950 and 2100
 *  - issueDate <= expiryDate (same-day is allowed)
 */
export function assertCertificationDates(issueDate: Date, expiryDate: Date, today = businessToday()) {
  if (!withinYears(issueDate, CERT_MIN_YEAR, CERT_MAX_YEAR) || issueDate > today) {
    throw badRequest(`issueDate must be between ${CERT_MIN_YEAR}-01-01 and today`, 'issueDate');
  }
  if (!withinYears(expiryDate, CERT_MIN_YEAR, CERT_MAX_YEAR)) {
    throw badRequest(`expiryDate must be between ${CERT_MIN_YEAR} and ${CERT_MAX_YEAR}`, 'expiryDate');
  }
  if (issueDate > expiryDate) throw badRequest('issueDate cannot be after expiryDate', 'issueDate');
}

export type CertificationStatus = 'Valid' | 'Expiring Soon' | 'Expired';

/**
 * Status on date-only semantics: a certificate is valid THROUGH its expiry day.
 *   expiry <  today                 -> Expired
 *   today <= expiry <= today + 30d  -> Expiring Soon   (so "expires today" is Expiring Soon, not Expired)
 *   expiry >  today + 30d           -> Valid
 */
export function certificationStatus(expiryDate: Date, today = businessToday()): CertificationStatus {
  const day = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate()) - today.getTime()) / day);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= EXPIRING_SOON_DAYS) return 'Expiring Soon';
  return 'Valid';
}

/** Re-derives the stored status at read time so it never goes stale. */
export const withCurrentStatus = <T extends { expiryDate: Date; status: string }>(cert: T, today = businessToday()): T => ({
  ...cert,
  status: certificationStatus(cert.expiryDate, today),
});
