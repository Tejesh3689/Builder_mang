'use client';

import React from 'react';
import Link from 'next/link';

export default function FilterAuditLogsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/audit-logs" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Filter Audit Logs</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Start Date</label>
              <input type="date" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">End Date</label>
              <input type="date" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Filter by User</label>
            <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option>All Users</option>
              <option>Admin Manager</option>
              <option>John Doe</option>
              <option>System</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Action Type</label>
            <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option>All Actions</option>
              <option>Logins</option>
              <option>Data Modifications</option>
              <option>Settings Changes</option>
              <option>System Events</option>
            </select>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/admin/audit-logs" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Clear Filters</Link>
            <button type="button" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Apply Filters</button>
          </div>
        </form>
      </div>
    </div>
  );
}
