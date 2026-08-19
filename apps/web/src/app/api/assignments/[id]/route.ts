import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { accessLevel, status, endDate } = body;

    const updated = await prisma.employeeVentureAssignment.update({
      where: { id },
      data: {
        accessLevel,
        status,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Failed to update assignment:', error);
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

    await prisma.employeeVentureAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Assignment deleted successfully.' } });
  } catch (error: any) {
    console.error('Failed to delete assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
