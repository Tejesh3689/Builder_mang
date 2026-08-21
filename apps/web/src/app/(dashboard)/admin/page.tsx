import React from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      <p className="text-sm text-zinc-500">Configure roles, global system settings, and audit trails.</p>

      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
        <h3 className="text-lg font-semibold px-6 py-4">Role-Based Access Control (RBAC)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-t border-zinc-100 font-medium text-zinc-500">
                <th className="py-3 px-6 font-medium">Role</th>
                <th className="py-3 px-6 font-medium">Permitted Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="py-3.5 px-6 font-semibold text-amber-700 whitespace-nowrap">ADMIN</td>
                <td className="py-3.5 px-6">All operations (Full Access)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-amber-700 whitespace-nowrap">PROJECT_MANAGER</td>
                <td className="py-3.5 px-6">View Ventures, Approve Requests, Assign Employees</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-amber-700 whitespace-nowrap">SITE_ENGINEER</td>
                <td className="py-3.5 px-6">Request materials, view assigned ventures, site chat</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-amber-700 whitespace-nowrap">STORE_MANAGER</td>
                <td className="py-3.5 px-6">Receive stock, issue stock, ledger adjustments</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
