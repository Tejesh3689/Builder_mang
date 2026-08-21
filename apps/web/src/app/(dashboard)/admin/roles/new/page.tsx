'use client';

import React from 'react';
import Link from 'next/link';

export default function NewRolePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/roles" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Create New Role</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Role Name</label>
            <input type="text" placeholder="e.g. Field Supervisor" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea placeholder="Briefly describe the responsibilities of this role..." rows={3} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"></textarea>
          </div>
          
          <div className="pt-4 border-t border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Initial Permissions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">View Projects</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Edit Projects</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Manage Inventory</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Manage Users</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/admin/roles" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel</Link>
            <button type="button" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Create Role</button>
          </div>
        </form>
      </div>
    </div>
  );
}
