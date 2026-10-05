import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export default async function RolesPermissionsPage() {
  await requireAuth();

  const userRoles = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  });

  const roles = userRoles.map(r => ({
    id: r.role,
    name: r.role.replace('_', ' '),
    users: r._count.role,
    description: `System role for ${r.role.toLowerCase().replace('_', ' ')}s.`
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Roles & Permissions</h1>
        <Link href="/admin/roles/new" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start opacity-50 cursor-not-allowed pointer-events-none">Create Role</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 capitalize">{role.name.toLowerCase()}</h3>
                <p className="text-sm text-zinc-500 mt-1">{role.description}</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{role.users} Users</span>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-600">Permissions are hardcoded by role</span>
              <span className="text-sm font-semibold text-zinc-400">Manage</span>
            </div>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 bg-white border border-zinc-200 rounded-xl">
            No roles found.
          </div>
        )}
      </div>
    </div>
  );
}
