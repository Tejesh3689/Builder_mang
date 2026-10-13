import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getAllRoles, createCustomRole } from '@/services/role.service';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name must be at least 2 characters').max(60, 'Role name too long'),
  description: z.string().trim().max(300).optional(),
  baseRole: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Base Role must be one of: ADMIN, MANAGER, SITE_ENGINEER, SUPERVISOR, PROCUREMENT_MANAGER' })
  }),
  permissions: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const actor = await requireAuth();
    if (actor.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const roles = await getAllRoles();
    return NextResponse.json({ success: true, data: roles });
  } catch (err: any) {
    const status = err.statusCode || err.status || 500;
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuth();
    if (actor.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message || 'Validation failed',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const created = await createCustomRole(actor.id, parsed.data);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    const status = err.statusCode || err.status || 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to create role' }, { status });
  }
}
