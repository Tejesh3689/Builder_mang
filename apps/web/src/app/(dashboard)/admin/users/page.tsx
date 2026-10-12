import React from 'react';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import UsersTableClient from './UsersTableClient';

export default async function UsersPage() {
  const userAuth = await requireAuth();
  
  if ((userAuth as any).role !== 'ADMIN') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-zinc-600">You must be an administrator to view this page.</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">Users</h1>
        <p className="text-xs text-zinc-500 font-medium">Manage corporate and site staff access credentials</p>
      </div>

      <UsersTableClient users={users} />
    </div>
  );
}
