import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
