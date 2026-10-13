'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Check, AlertCircle, Info } from 'lucide-react';
import { Select, SelectOption } from '@/components/ui/Select';

export default function NewRolePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState('');
  const [baseRole, setBaseRole] = useState<'MANAGER' | 'SUPERVISOR' | 'SITE_ENGINEER' | 'PROCUREMENT_MANAGER' | 'ADMIN'>('MANAGER');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([
    'view_projects',
    'view_inventory',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const availablePermissions = [
    { id: 'view_projects', label: 'View Ventures & Projects', category: 'Ventures' },
    { id: 'edit_projects', label: 'Edit & Create Ventures', category: 'Ventures' },
    { id: 'view_inventory', label: 'View Inventory & Stock', category: 'Inventory' },
    { id: 'manage_inventory', label: 'Manage Stock Movements & Requests', category: 'Inventory' },
    { id: 'manage_users', label: 'Manage System Users & Roles', category: 'System' },
    { id: 'view_reports', label: 'View Reports & Analytics', category: 'Analytics' },
    { id: 'approve_leaves', label: 'Approve Leave & Attendance', category: 'Workforce' },
    { id: 'audit_logs', label: 'Access System Audit Logs', category: 'System' },
  ];

  const baseRoleDescriptions: Record<string, string> = {
    MANAGER: 'Managerial authority: Oversees venture progress, approves material requisitions, manages documents and assignments.',
    SUPERVISOR: 'Ground supervisor: Directs labor force, marks daily attendance, logs site activities and registers daily progress.',
    SITE_ENGINEER: 'Technical site execution: Oversees construction tasks, materials utilization, and engineering logs.',
    PROCUREMENT_MANAGER: 'Purchasing & supply: Handles purchase requests, supplier orders, materials receiving and inventory transactions.',
    ADMIN: 'Full administrative authority: Complete governance over company settings, users, audit trails, and configurations.',
  };

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          baseRole,
          description: description.trim(),
          permissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create role');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/roles');
        router.refresh();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while creating the role');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/roles"
          className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" /> Create New Role
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Define an operational role with base authority classification and designated permissions.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Role created successfully! Redirecting...</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Role Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 font-mono">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Quality Assurance Manager, Senior Site Supervisor..."
              className="w-full px-4 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Base Role Classification */}
          <div>
            <label htmlFor="baseRole" className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 font-mono">
              Base Role / Authority Level *
            </label>
            <Select
              id="baseRole"
              value={baseRole}
              onChange={(e) => setBaseRole(e.target.value as any)}
              className="w-full px-4 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium text-zinc-900"
            >
              <SelectOption value="MANAGER">Operations Manager (Project & Requisitions Authority)</SelectOption>
              <SelectOption value="SUPERVISOR">Site Supervisor (Ground Workforce & Attendance)</SelectOption>
              <SelectOption value="SITE_ENGINEER">Site Engineer (Technical Execution & DPR)</SelectOption>
              <SelectOption value="PROCUREMENT_MANAGER">Procurement Manager (Purchasing & Material Stock)</SelectOption>
              <SelectOption value="ADMIN">System Administrator (Full Governance & Audit)</SelectOption>
            </Select>

            <div className="mt-2.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Access Scope: </span>
                {baseRoleDescriptions[baseRole]}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 font-mono">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the responsibilities, reporting hierarchy, and scope of this role..."
              className="w-full px-4 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Assigned Permissions */}
          <div className="pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                  Assigned Permissions
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Select specific operational capability flags for this role.</p>
              </div>
              <span className="text-xs text-zinc-500 font-mono font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                {permissions.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availablePermissions.map((perm) => {
                const checked = permissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      checked
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                        : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.id)}
                      className="mt-0.5 w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">{perm.label}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{perm.category}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link
              href="/admin/roles"
              className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              {submitting ? 'Creating Role...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
