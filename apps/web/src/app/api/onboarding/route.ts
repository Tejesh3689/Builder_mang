import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const onboardingCandidates = await prisma.employee.findMany({
      where: {
        NOT: {
          onboardingStage: 'Active',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: onboardingCandidates });
  } catch (error: any) {
    console.error('Failed to fetch onboarding pipeline candidates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
