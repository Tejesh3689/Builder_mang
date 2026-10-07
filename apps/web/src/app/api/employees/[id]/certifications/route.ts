import { prisma } from '@/lib/db';
import { assertPermission, requireAuth } from '@/lib/authorization';
import { conflict } from '@/lib/http/errors';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { requireEmployeeInScope } from '@/lib/scope';
import { certificationCreateSchema, withCurrentStatus } from '@/lib/validation/certification';
import { addCertification } from '@/services/certification.service';

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireAuth();
  const employee = await requireEmployeeInScope(user, (await params).id);
  const certifications = await prisma.employeeCertification.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: 'desc' },
  });
  return ok(certifications.map((c) => withCurrentStatus(c)));
}, { resource: 'certification', context: 'certifications GET' });

export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireAuth();
  assertPermission(user, 'certifications:edit');
  const employee = await requireEmployeeInScope(user, (await params).id);
  if (employee.status === 'TERMINATED') throw conflict('Cannot add certifications to a terminated employee.');
  const input = await parseBody(req, certificationCreateSchema);
  const cert = await addCertification(user, employee.id, input);
  return created(cert);
}, { resource: 'certification', context: 'certifications POST' });
