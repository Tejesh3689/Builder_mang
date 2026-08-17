import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        assignments: {
          include: {
            venture: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
