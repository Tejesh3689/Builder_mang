import React from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      <p className="text-sm text-slate-400">Configure roles, global system settings, and audit trails.</p>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h3 className="text-lg font-semibold">Role-Based Access Control (RBAC)</h3>
        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between font-medium text-slate-400">
            <span>Role</span>
            <span>Permitted Actions</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span className="font-semibold text-indigo-400">ADMIN</span>
            <span>All operations (Full Access)</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span className="font-semibold text-indigo-400">PROJECT_MANAGER</span>
            <span>View Ventures, Approve Requests, Assign Employees</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span className="font-semibold text-indigo-400">SITE_ENGINEER</span>
            <span>Request materials, view assigned ventures, site chat</span>
          </div>
          <div className="py-3.5 flex justify-between">
            <span className="font-semibold text-indigo-400">STORE_MANAGER</span>
            <span>Receive stock, issue stock, ledger adjustments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
