import { mock } from 'node:test';
import { randomUUID } from 'node:crypto';
import { UserRole, type Prisma } from '@prisma/client';

/**
 * Only the session lookup is mocked; everything after it (requireAuth's DB
 * re-validation, permissions, scope, validation, services, Postgres) is real.
 */
const state: { userId: string | null } = { userId: null };
mock.module('next-auth', {
  // @ts-ignore
  exports: {
    getServerSession: async () => (state.userId ? { user: { id: state.userId } } : null),
  },
});

export const actAs = (userId: string | null) => {
  state.userId = userId;
};

export const { prisma } = await import('@/lib/db');

const uniq = () => randomUUID().slice(0, 8);

export async function makeUser(role: UserRole, opts: { isActive?: boolean; withEmployee?: boolean } = {}) {
  const id = uniq();
  return prisma.user.create({
    data: {
      email: `${role.toLowerCase()}-${id}@test.local`,
      name: `${role} ${id}`,
      passwordHash: 'x',
      role,
      isActive: opts.isActive ?? true,
      ...(opts.withEmployee === false
        ? {}
        : { employee: { create: { employeeId: `T-${id}`, firstName: role, lastName: id, designation: 'x', department: 'y' } } }),
    },
    include: { employee: true },
  });
}

export async function makeEmployee(data: Partial<Prisma.EmployeeUncheckedCreateInput> = {}) {
  const id = uniq();
  return prisma.employee.create({
    data: { employeeId: `T-${id}`, firstName: 'Emp', lastName: id, designation: 'Mason', department: 'Ops', ...data },
  });
}

export async function makeVenture(data: Partial<Prisma.VentureUncheckedCreateInput> = {}) {
  const id = uniq();
  return prisma.venture.create({ data: { name: `Venture ${id}`, code: `V-${id}`, ...data } });
}

export async function assign(employeeId: string, ventureId: string, status = 'ACTIVE') {
  return prisma.employeeVentureAssignment.create({ data: { employeeId, ventureId, status } });
}

// ---------------------------------------------------------------------------
// Calling route handlers
// ---------------------------------------------------------------------------

type Handler = (req: Request, ctx: any) => Promise<Response>;

export async function call(
  handler: Handler,
  opts: { method?: string; params?: Record<string, string>; body?: unknown; rawBody?: BodyInit; headers?: Record<string, string>; url?: string } = {}
) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  let body: BodyInit | undefined = opts.rawBody;
  if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['content-type'] ??= 'application/json';
  }
  const req = new Request(opts.url ?? 'http://localhost/api/test', { method: opts.method ?? 'GET', body, headers });
  const res = await handler(req, { params: Promise.resolve(opts.params ?? {}) });
  const text = await res.clone().text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* binary download */
  }
  return { status: res.status, json, res };
}
