import React from 'react';
import Link from 'next/link';

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href={`/employees/${empId}`} className="text-xs text-indigo-400 hover:underline">← Back to Profile</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Edit Employee: {empId.toUpperCase()}</h1>
      </div>

      <form className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Designation</label>
          <input type="text" className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" defaultValue="Site Engineer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Status</label>
          <select className="mt-1 block w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white" defaultValue="ACTIVE">
            <option>ACTIVE</option>
            <option>ON_LEAVE</option>
            <option>TERMINATED</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
          Update Profile
        </button>
      </form>
    </div>
  );
}
