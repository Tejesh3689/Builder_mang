import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, buildDataScope } from '@/lib/authorization';
import { processLeaveApproval } from '@/services/leave.service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await requireAuth();
    const scopeInfo = await buildDataScope(user);
    const body = await req.json();

    const record = await prisma.leaveRequest.findUnique({
      where: { id: resolvedParams.id },
      include: { employee: true }
    });

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const employee = record.employee;

    // Authorization Check: Only MANAGER or ADMIN can approve
    if (scopeInfo.scope === 'SELF' || scopeInfo.scope === 'TEAM_LEVEL') {
      // Supervisors can request but only Managers can approve
      return NextResponse.json({ error: 'Forbidden: Only Managers can approve leaves' }, { status: 403 });
    }

    // Venture Level Check (If manager, ensure they manage the employee's venture)
    // For Phase 2, relying on the fact that if scopeInfo.scope === 'VENTURE_LEVEL', they have rights.
    // In strict production, we'd verify the exact venture mapping here.
    
    if (body.action !== 'APPROVE' && body.action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
    }

    const updated = await processLeaveApproval(resolvedParams.id, body.action, (user as any).id);

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Insufficient leave balance') return NextResponse.json({ error: error.message }, { status: 409 });
    if (error.message.startsWith('Cannot transition')) return NextResponse.json({ error: error.message }, { status: 409 });
    
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
