import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const skills = await prisma.employeeSkill.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: skills });
  } catch (error: any) {
    console.error('Failed to fetch employee skills:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'ADMIN' && userRole !== 'PROJECT_MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or Project Manager access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { skill, category, proficiency, experienceYears } = body;

    if (!skill) {
      return NextResponse.json(
        { success: false, error: 'Skill name is required.' },
        { status: 400 }
      );
    }

    const newSkill = await prisma.employeeSkill.create({
      data: {
        employeeId: id,
        skill,
        category: category || 'Civil',
        proficiency: proficiency || 'Intermediate',
        experienceYears: experienceYears || 0,
      },
    });

    return NextResponse.json({ success: true, data: newSkill });
  } catch (error: any) {
    console.error('Failed to add employee skill:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
