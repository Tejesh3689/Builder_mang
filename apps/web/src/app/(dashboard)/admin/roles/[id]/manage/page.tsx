'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Shield, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function ManageRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = (params?.id as string) || 'ROLE';

  const [roleData, setRoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Matrix permissions state
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    Ventures: { View: true, Create: roleId !== 'SUPERVISOR', Edit: roleId !== 'SUPERVISOR', Delete: roleId === 'ADMIN' },
    Inventory: { View: true, Create: true, Edit: roleId !== 'SUPERVISOR', Delete: roleId === 'ADMIN' },
    Workforce: { View: true, Create: roleId === 'ADMIN' || roleId === 'MANAGER', Edit: true, Delete: roleId === 'ADMIN' },
    Chat: { View: true, Create: true, Edit: true, Delete: roleId === 'ADMIN' },
    System: { View: roleId === 'ADMIN', Create: roleId === 'ADMIN', Edit: roleId === 'ADMIN', Delete: roleId === 'ADMIN' },
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchRole() {
      try {
        const res = await fetch(`/api/admin/roles/${roleId}`);
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setRoleData(data.data);
          if (data.data.matrix) {
            setPermissions(data.data.matrix);
          } else {
            // Apply sensible default matrix based on baseRole
            const base = data.data.baseRole || roleId;
            setPermissions({
              Ventures: { View: true, Create: base !== 'SUPERVISOR', Edit: base !== 'SUPERVISOR', Delete: base === 'ADMIN' },
              Inventory: { View: true, Create: true, Edit: base !== 'SUPERVISOR', Delete: base === 'ADMIN' },
              Workforce: { View: true, Create: base === 'ADMIN' || base === 'MANAGER', Edit: true, Delete: base === 'ADMIN' },
              Chat: { View: true, Create: true, Edit: true, Delete: base === 'ADMIN' },
              System: { View: base === 'ADMIN', Create: base === 'ADMIN', Edit: base === 'ADMIN', Delete: base === 'ADMIN' },
            });
          }
        }
      } catch (err) {
        console.error('Failed to load role details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRole();
    return () => {
      isMounted = false;
    };
  }, [roleId]);

  const displayName = roleData?.name || roleId.replace(/_/g, ' ');

  const toggle = (module: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matrix: permissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save permissions');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/admin/roles');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving role permissions');
    } finally {
      setSaving(false);
    }
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-600" /> Manage Role: {displayName}
              </h1>
              {roleData?.isCustom && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Granular access control matrix for role <span className="font-mono uppercase font-bold text-zinc-700">{roleId}</span>
              {roleData?.baseRole && (
                <span className="ml-2 font-mono text-zinc-400">
                  (Base Authority: <strong className="text-zinc-700">{roleData.baseRole}</strong>)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs self-start sm:self-auto shrink-0 transition-colors flex items-center gap-1.5"
        >
          {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Permissions updated successfully! Redirecting...</span>
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
