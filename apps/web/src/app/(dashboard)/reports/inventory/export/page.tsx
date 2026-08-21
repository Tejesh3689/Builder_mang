'use client';

import React from 'react';
import Link from 'next/link';

export default function ExportInventoryReportPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports/inventory" className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
          <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Export Inventory Report</h1>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Category Filter</label>
            <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option>All Categories</option>
              <option>Materials</option>
              <option>Equipment</option>
              <option>Fuel</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Format</label>
            <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option>Excel Spreadsheet (.xlsx)</option>
              <option>CSV Data (.csv)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Link href="/reports/inventory" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-200">Cancel</Link>
            <button type="button" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Generate Export</button>
          </div>
        </form>
      </div>
    </div>
  );
}
