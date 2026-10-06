import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const auth_ventureId = await params.then(p => p.ventureId);
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ id: auth_ventureId }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    try {
      const setting = await prisma.ventureSetting.findUnique({
        where: { ventureId },
      });
      return NextResponse.json({ success: true, data: setting });
    } catch (dbError: any) {
      console.error('Database error in settings GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();

    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const auth_ventureId = await params.then(p => p.ventureId);
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ id: auth_ventureId }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;
    const body = await request.json();

    try {
      const updated = await prisma.ventureSetting.upsert({
        where: { ventureId },
        update: body,
        create: { ventureId, ...body },
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (dbError: any) {
      console.error('Database error in settings PATCH:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
