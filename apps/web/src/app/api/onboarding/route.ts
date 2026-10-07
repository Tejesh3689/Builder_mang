import { requireAuth } from '@/lib/authorization';
import { logAudit } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const userRole = (user as any).role;
    if (userRole !== 'ADMIN' && !hasPermission(userRole, 'employees:view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const onboardingCandidates = await prisma.employee.findMany({
      where: {
        NOT: {
          onboardingStage: 'Active',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await logAudit((user as any).id, 'CREATE_ONBOARDING_CANDIDATE', 'Action completed successfully', null);
    return NextResponse.json({ success: true, data: onboardingCandidates });
  } catch (error: any) {
    console.error('Failed to fetch onboarding pipeline candidates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
