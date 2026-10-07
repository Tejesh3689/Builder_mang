import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { notFound } from '@/lib/http/errors';
import { apiHandler, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { certificationUpdateSchema, withCurrentStatus } from '@/lib/validation/certification';
import { deleteCertification, updateCertification } from '@/services/certification.service';

type Ctx = { params: Promise<{ id: string }> };

async function loadInScope(user: Awaited<ReturnType<typeof requireAuth>>, id: string) {
  const cert = await prisma.employeeCertification.findUnique({ where: { id } });
  if (!cert) throw notFound('Certification not found');
  await requireEmployeeInScope(user, cert.employeeId).catch(() => {
    throw notFound('Certification not found');
  });
  return cert;
}

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'certifications:edit');
  const cert = await loadInScope(user, (await params).id);
  const input = await parseBody(req, certificationUpdateSchema);
  const updated = await updateCertification(user, cert, input);
  return ok(withCurrentStatus(updated));
}, { resource: 'certification', context: 'certification PATCH' });

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'certifications:edit');
  const cert = await loadInScope(user, (await params).id);
  await deleteCertification(user, cert);
  return ok({ message: 'Certification deleted successfully.' });
}, { resource: 'certification', context: 'certification DELETE' });
