import { prisma } from '@/lib/db';
import { recordAudit, diffFields } from '@/lib/audit';
import { CompanySettingsPatchInput } from '@/lib/validation/companySettings';

export const DEFAULT_COMPANY_SETTINGS = {
  id: 'default',
  version: 1,
  legalName: 'Builder Management Inc.',
  displayName: 'Builder Management',
  supportEmail: 'support@builder.com',
  phone: null,
  website: null,
  gstin: null,
  pan: null,
  addressLine: null,
  city: null,
  state: null,
  pincode: null,
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStartMonth: 4,
  weekStartsOn: 'MONDAY',
  shiftStart: '09:00',
  shiftEnd: '18:00',
  lateGraceMinutes: 15,
  weeklyOffDays: 'SUNDAY',
  allowNegativeStock: false,
  requireMaterialRequestApproval: true,
  sessionTimeoutMinutes: 480,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
};

export async function getCompanySettings() {
  const existing = await (prisma as any).companySettings.findUnique({
    where: { id: 'default' },
  });

  if (existing) {
    return existing;
  }

  return await (prisma as any).companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: DEFAULT_COMPANY_SETTINGS,
  });
}

export async function getPublicCompanySettings() {
  const settings = await getCompanySettings();
  const logo = await (prisma as any).companyLogo.findUnique({
    where: { id: 'default' },
    select: { id: true, updatedAt: true },
  });

  return {
    displayName: settings.displayName,
    legalName: settings.legalName,
    logoUrl: logo ? `/api/admin/settings/logo?v=${logo.updatedAt.getTime()}` : null,
    currency: settings.currency,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    fiscalYearStartMonth: settings.fiscalYearStartMonth,
    weekStartsOn: settings.weekStartsOn,
    shiftStart: settings.shiftStart,
    shiftEnd: settings.shiftEnd,
    lateGraceMinutes: settings.lateGraceMinutes,
  };
}

export async function updateCompanySettings(
  userId: string,
  input: CompanySettingsPatchInput
) {
  const { version, ...patch } = input;

  return await prisma.$transaction(async (tx) => {
    const current = await (tx as any).companySettings.findUnique({
      where: { id: 'default' },
    });

    if (!current) {
      await (tx as any).companySettings.create({
        data: DEFAULT_COMPANY_SETTINGS,
      });
    }

    const target = current || DEFAULT_COMPANY_SETTINGS;

    if (target.version !== version) {
      const err: any = new Error('Settings were changed by someone else. Reload.');
      err.statusCode = 409;
      err.code = 'VERSION_CONFLICT';
      throw err;
    }

    const changedFields = diffFields(
      target,
      patch,
      Object.keys(patch) as any
    );

    const updated = await (tx as any).companySettings.update({
      where: { id: 'default' },
      data: {
        ...patch,
        version: { increment: 1 },
        updatedById: userId,
      },
    });

    if (Object.keys(changedFields).length > 0) {
      await recordAudit(tx, {
        userId,
        action: 'UPDATE_COMPANY_SETTINGS',
        details: {
          previousVersion: target.version,
          newVersion: updated.version,
          changes: changedFields,
        },
      });
    }

    return updated;
  });
}
