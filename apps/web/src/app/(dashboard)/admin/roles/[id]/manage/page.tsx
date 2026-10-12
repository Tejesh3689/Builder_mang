'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Shield, Check } from 'lucide-react';

export default function ManageRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = (params?.id as string) || 'ROLE';

  const roleLabels: Record<string, string> = {
    ADMIN: 'System Administrator',
    MANAGER: 'Operations Manager',
    SITE_ENGINEER: 'Site Engineer',
    SUPERVISOR: 'Site Supervisor',
    PROCUREMENT_MANAGER: 'Procurement Manager',
  };

  const displayName = roleLabels[roleId.toUpperCase()] || roleId.replace(/_/g, ' ');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initial matrix permissions state
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    Ventures: { View: true, Create: roleId !== 'SUPERVISOR', Edit: roleId !== 'SUPERVISOR', Delete: roleId === 'ADMIN' },
    Inventory: { View: true, Create: true, Edit: roleId !== 'SUPERVISOR', Delete: roleId === 'ADMIN' },
    Workforce: { View: true, Create: roleId === 'ADMIN' || roleId === 'MANAGER', Edit: true, Delete: roleId === 'ADMIN' },
    Chat: { View: true, Create: true, Edit: true, Delete: roleId === 'ADMIN' },
    System: { View: roleId === 'ADMIN', Create: roleId === 'ADMIN', Edit: roleId === 'ADMIN', Delete: roleId === 'ADMIN' },
  });

  const toggle = (module: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        router.push('/admin/roles');
      }, 600);
    }, 400);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/roles"
            className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-600" /> Manage Role: {displayName}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Granular access control matrix for role <span className="font-mono uppercase font-bold text-zinc-700">{roleId}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs self-start sm:self-auto shrink-0 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" /> Permissions updated successfully!
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono">
            Permissions Matrix
          </h2>
          <span className="text-[11px] text-zinc-500 font-mono">5 Modules Configured</span>
        </div>

        <div className="divide-y divide-zinc-200">
          {Object.entries(permissions).map(([module, actions]) => (
            <div key={module} className="p-6">
              <h3 className="text-sm font-bold text-zinc-900 mb-3">{module} Module</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(actions).map(([action, enabled]) => (
                  <label
                    key={action}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      enabled
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggle(module, action)}
                      className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-zinc-800">{action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
