import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertPermission, buildScopedWhere, requireAuth } from '@/lib/authorization';
import { apiHandler, created, ok } from '@/lib/http/handler';
import { parseBody } from '@/lib/http/request';
import { getPaginationParams } from '@/lib/pagination';
import { employeeCreateSchema } from '@/lib/validation/employee';
import { createEmployee } from '@/services/employee.service';

export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  const scopedWhere = await buildScopedWhere(user, 'employee');
  if ((scopedWhere as any).id === 'DENY_ALL') return ok([]);

  const { skip, take } = getPaginationParams(req);
  const employees = await prisma.employee.findMany({
    where: scopedWhere as Prisma.EmployeeWhereInput,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, role: true } },
      reportingManager: { select: { firstName: true, lastName: true } },
      assignments: { include: { venture: { select: { id: true, name: true, code: true } } } },
    },
  });
  return ok(employees);
}, { resource: 'employee', context: 'employees GET' });

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:create'); // ADMIN only
  const input = await parseBody(req, employeeCreateSchema);
  const employee = await createEmployee(user, input);
  return created(employee);
}, { resource: 'employee', context: 'employees POST' });
