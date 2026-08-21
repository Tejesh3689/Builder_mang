'use client';

import React from 'react';
import Link from 'next/link';

export default function ViewBranchPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/branches" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Branch Details</h1>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Edit Details</button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Delete Branch</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Col: Info */}
        <div className="p-8 md:w-1/2 border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-900 mb-1">Headquarters</h2>
          <p className="text-zinc-500 mb-8">BR-01</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Location</p>
              <p className="text-zinc-600 mt-1">123 Business Avenue, Suite 400<br/>New York, NY 10001</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Contact Number</p>
              <p className="text-zinc-600 mt-1">+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* Right Col: Stats/Manager */}
        <div className="p-8 md:w-1/2 bg-zinc-50/50">
          <h3 className="text-lg font-bold text-zinc-900 mb-4">Branch Management</h3>
          
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
              AM
            </div>
            <div>
              <p className="font-bold text-zinc-900">Admin Manager</p>
              <p className="text-sm text-zinc-500">Branch Manager</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-zinc-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <p className="text-2xl font-bold text-zinc-900">24</p>
              <p className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wide">Employees</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
              <p className="text-2xl font-bold text-zinc-900">5</p>
              <p className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-wide">Active Projects</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
