import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ventureId: string }> }
) {
  try {
    const user = await requireAuth();
    const userRole = (user as any).role;

    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const auth_ventureId = await params.then(p => p.ventureId);
    const auth_existingVenture = await prisma.venture.findFirst({ where: { AND: [{ id: auth_ventureId }, scopedWhere] } });
    if (!auth_existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    const resolvedParams = await params;
    const { ventureId } = resolvedParams;

    // Filter by visibility (Root Cause 8)
    const visibilityFilter = ['ADMIN', 'MANAGER'].includes(userRole) 
      ? {} // Management roles see all
      : { visibility: 'ALL' }; // Others see only ALL

    try {
      const documents = await prisma.ventureDocument.findMany({
        where: { ventureId, ...visibilityFilter },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: documents });
    } catch (dbError: any) {
      console.error('Database error in documents GET:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
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
    // Accept visibility (Root Cause 8)
    const { title, category = 'OTHER', fileUrl = '/docs/sample.pdf', version = '1.0', visibility = 'ALL' } = await request.json();

    try {
      const created = await prisma.ventureDocument.create({
        data: {
          ventureId,
          title,
          category,
          fileUrl,
          fileType: 'application/pdf',
          fileSize: 1024000,
          version,
          visibility: ['ALL', 'MANAGEMENT'].includes(visibility) ? visibility : 'ALL'
        },
      });
      await logAudit((user as any).id, 'MANAGE_VENTURE_DOCUMENT', 'Action completed successfully', null);
      return NextResponse.json({ success: true, data: created });
    } catch (dbError: any) {
      console.error('Database error in documents POST:', dbError);
      return NextResponse.json({ success: false, error: dbError.message || 'Database error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
