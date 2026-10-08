import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
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
  // Optional server-side search so rows beyond the current page are findable.
  const search = new URL(req.url).searchParams.get('search')?.trim().slice(0, 100);
  const searchWhere: Prisma.EmployeeWhereInput = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { designation: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }
    : {};
  const where: Prisma.EmployeeWhereInput = { AND: [scopedWhere as Prisma.EmployeeWhereInput, searchWhere] };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true } },
        reportingManager: { select: { firstName: true, lastName: true } },
        assignments: { include: { venture: { select: { id: true, name: true, code: true } } } },
      },
    }),
    prisma.employee.count({ where }),
  ]);
  // `data` stays an array for existing callers; `total`/`skip`/`take` drive pagination.
  return NextResponse.json({ success: true, data: employees, total, skip, take });
}, { resource: 'employee', context: 'employees GET' });

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  assertPermission(user, 'employees:create'); // ADMIN only
  const input = await parseBody(req, employeeCreateSchema);
  const employee = await createEmployee(user, input);
  return created(employee);
}, { resource: 'employee', context: 'employees POST' });
