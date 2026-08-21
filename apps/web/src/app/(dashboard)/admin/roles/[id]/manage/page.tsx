'use client';

import React from 'react';
import Link from 'next/link';

export default function ManageRolePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/roles" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Manage Role: Project Manager</h1>
            <p className="text-sm text-zinc-500">Update permissions and access levels for this role.</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-sm font-semibold">Save Changes</button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <h2 className="font-bold text-zinc-900">Permissions Matrix</h2>
        </div>
        
        <div className="divide-y divide-zinc-200">
          {/* Module: Projects */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Projects Module</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">View</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Create</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Edit</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Delete</span>
              </label>
            </div>
          </div>

          {/* Module: Inventory */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Inventory Module</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">View</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Create</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Edit</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500" />
                <span className="text-sm font-medium text-zinc-700">Delete</span>
              </label>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
