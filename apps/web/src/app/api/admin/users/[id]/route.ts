import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { handleApiError, ApiError, parseJsonSafe } from '@/lib/api-errors';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    if ((actor as any).role !== 'ADMIN') throw new ApiError(403, 'Forbidden');
    
    const resolvedParams = await Promise.resolve(params);
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    
    if (!user) throw new ApiError(404, 'User not found');
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    if ((actor as any).role !== 'ADMIN') throw new ApiError(403, 'Forbidden');

    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;
    const body = await parseJsonSafe(req);

    const updateData: any = {};
    if (body.name !== undefined && typeof body.name === 'string') {
      const trimmed = body.name.trim();
      if (!trimmed) throw new ApiError(400, 'Name cannot be empty');
      updateData.name = trimmed;
    }

    if (body.email !== undefined && typeof body.email === 'string') {
      const emailTrimmed = body.email.trim().toLowerCase();
      if (!emailTrimmed) throw new ApiError(400, 'Email cannot be empty');
      updateData.email = emailTrimmed;
    }

    if (body.role !== undefined) {
      updateData.role = body.role;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }
    
    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No valid fields provided for update');
    }

    try {
      const updated = await prisma.user.update({
         where: { id: userId },
         data: updateData,
         select: { id: true, name: true, email: true, role: true, isActive: true }
      });
      return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ApiError(409, 'Email is already in use by another user');
      throw e;
    }
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth();
    if ((actor as any).role !== 'ADMIN') throw new ApiError(403, 'Forbidden');
    
    const resolvedParams = await Promise.resolve(params);
    await prisma.user.delete({
      where: { id: resolvedParams.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
