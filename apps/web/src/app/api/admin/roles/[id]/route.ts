import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authorization';
import { getRoleById, updateRolePermissions, deleteCustomRole } from '@/services/role.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const actor = await requireAuth();
    if (actor.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const role = await getRoleById(resolvedParams.id);
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: role });
  } catch (err: any) {
    const status = err.statusCode || err.status || 500;
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const actor = await requireAuth();
    if (actor.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const updated = await updateRolePermissions(actor.id, resolvedParams.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.statusCode || err.status || 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to update role' }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const actor = await requireAuth();
    if (actor.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    await deleteCustomRole(actor.id, resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.statusCode || err.status || 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to delete role' }, { status });
  }
}
