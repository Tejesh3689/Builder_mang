import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { category, proficiency, experienceYears, verificationStatus, verifiedBy } = body;

    const updated = await prisma.employeeSkill.update({
      where: { id },
      data: {
        category,
        proficiency,
        experienceYears,
        verificationStatus,
        verifiedBy,
        verificationDate: verificationStatus === 'Verified' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update employee skill:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.employeeSkill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Employee skill deleted successfully.' } });
  } catch (error: any) {
    console.error('Failed to delete employee skill:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
