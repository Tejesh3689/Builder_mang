import React from 'react';
import Link from 'next/link';

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/employees" className="text-xs text-indigo-400 hover:underline">← Back to Employees</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Add Employee</h1>
      </div>

      <form className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">First Name</label>
            <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Last Name</label>
            <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Employee ID</label>
          <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" placeholder="EMP-003" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Designation</label>
          <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" placeholder="e.g. Site Engineer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Venture Assignment</label>
          <select className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white">
            <option>Venture Heights Phase 1</option>
            <option>Venture Greens Residency</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
          Add Profile
        </button>
      </form>
    </div>
  );
}
