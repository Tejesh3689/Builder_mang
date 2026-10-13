import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { getAllRoles } from '@/services/role.service';
import { Shield, Plus, ArrowRight, UserCheck, Trash2 } from 'lucide-react';
import DeleteRoleButton from './DeleteRoleButton';

export default async function RolesPermissionsPage() {
  await requireAuth();

  const [userRoles, allRoles] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    }),
    getAllRoles(),
  ]);

  const roleCounts: Record<string, number> = {};
  userRoles.forEach((r) => {
    roleCounts[r.role] = r._count.role;
  });

  const roles = allRoles.map((r) => ({
    ...r,
    users: r.isCustom ? (roleCounts[r.baseRole] || 0) : (roleCounts[r.id] || 0),
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" /> Roles & Permissions
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure role permissions, access levels, base operational authorities, and assign users across functional areas.
          </p>
        </div>
        <Link
          href="/admin/roles/new"
          className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Role
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-zinc-900">{role.name}</h3>
                    {role.isCustom && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                        Custom Role
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <span className="text-zinc-400">Authority:</span>
                    <span className="font-semibold text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded">
                      {role.baseRole.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-amber-100 text-amber-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {role.users} {role.users === 1 ? 'User' : 'Users'}
                  </span>
                  {role.isCustom && <DeleteRoleButton roleId={role.id} roleName={role.name} />}
                </div>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed mb-4">{role.description}</p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                ID: {role.id}
              </span>
              <Link
                href={`/admin/roles/${role.id}/manage`}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 hover:translate-x-0.5 transition-transform"
              >
                Manage Permissions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
