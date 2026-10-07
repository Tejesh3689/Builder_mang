import type { EmployeeCertification, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { conflict } from '@/lib/http/errors';
import { diffFields, recordAudit } from '@/lib/audit';
import { businessToday } from '@/lib/validation/common';
import {
  DEFAULT_AUTHORITY,
  assertCertificationDates,
  certificationStatus,
  certificationCreateSchema,
  certificationUpdateSchema,
} from '@/lib/validation/certification';
import type { z } from 'zod';

type Tx = Prisma.TransactionClient;
type Actor = { id: string };

/**
 * Duplicate policy: one employee cannot hold two records with the same
 * certification name AND certificate number (case-insensitive). Renewals with a
 * new certificate number are separate records; correcting a record is a PATCH.
 * Backed by the (employeeId, certification, certificateNo) unique index.
 */
async function assertNotDuplicate(tx: Tx, employeeId: string, certification: string, certificateNo: string, excludeId?: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cert:${employeeId}`}))`;
  const clash = await tx.employeeCertification.findFirst({
    where: {
      employeeId,
      certification: { equals: certification, mode: 'insensitive' },
      certificateNo: { equals: certificateNo, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw conflict('This certificate is already recorded for the employee.');
}

export async function addCertification(actor: Actor, employeeId: string, input: z.output<typeof certificationCreateSchema>) {
  const today = businessToday();
  const issueDate = input.issueDate ?? today;
  assertCertificationDates(issueDate, input.expiryDate, today);

  return prisma.$transaction(async (tx) => {
    await assertNotDuplicate(tx, employeeId, input.certification, input.certificateNo);
    const cert = await tx.employeeCertification.create({
      data: {
        employeeId,
        certification: input.certification,
        certificateNo: input.certificateNo,
        issueDate,
        expiryDate: input.expiryDate,
        status: certificationStatus(input.expiryDate, today),
        authority: input.authority ?? DEFAULT_AUTHORITY,
      },
    });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'ADD_CERTIFICATION',
      details: { employeeId, certificationId: cert.id, certification: cert.certification },
    });
    return cert;
  });
}

export async function updateCertification(actor: Actor, existing: EmployeeCertification, input: z.output<typeof certificationUpdateSchema>) {
  const today = businessToday();
  const issueDate = input.issueDate ?? existing.issueDate;
  const expiryDate = input.expiryDate ?? existing.expiryDate;
  if (input.issueDate !== undefined || input.expiryDate !== undefined) assertCertificationDates(issueDate, expiryDate, today);

  return prisma.$transaction(async (tx) => {
    const certification = input.certification ?? existing.certification;
    const certificateNo = input.certificateNo ?? existing.certificateNo;
    if (input.certification !== undefined || input.certificateNo !== undefined) {
      await assertNotDuplicate(tx, existing.employeeId, certification, certificateNo, existing.id);
    }
    const data = {
      certification: input.certification,
      certificateNo: input.certificateNo,
      issueDate: input.issueDate ?? undefined,
      expiryDate: input.expiryDate ?? undefined,
      authority: input.authority === null ? DEFAULT_AUTHORITY : input.authority,
      status: certificationStatus(expiryDate, today),
    };
    const updated = await tx.employeeCertification.update({ where: { id: existing.id }, data });
    const changes = diffFields(existing as unknown as Record<string, unknown>, data, ['certification', 'certificateNo', 'issueDate', 'expiryDate', 'authority']);
    if (Object.keys(changes).length) {
      await recordAudit(tx, {
        userId: actor.id,
        action: 'UPDATE_CERTIFICATION',
        details: { employeeId: existing.employeeId, certificationId: existing.id, changes },
      });
    }
    return updated;
  });
}

export async function deleteCertification(actor: Actor, existing: EmployeeCertification) {
  await prisma.$transaction(async (tx) => {
    await tx.employeeCertification.delete({ where: { id: existing.id } });
    await recordAudit(tx, {
      userId: actor.id,
      action: 'DELETE_CERTIFICATION',
      details: { employeeId: existing.employeeId, certificationId: existing.id, certification: existing.certification },
    });
  });
}
