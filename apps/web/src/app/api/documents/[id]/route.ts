import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.employeeDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { message: 'Document deleted successfully from vault.' } });
  } catch (error: any) {
    console.error('Failed to delete document:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
