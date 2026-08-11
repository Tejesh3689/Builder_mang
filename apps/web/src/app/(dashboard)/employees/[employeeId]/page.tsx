import React from 'react';
import Link from 'next/link';

export default async function EmployeeDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/employees" className="text-xs text-indigo-400 hover:underline">← Back to Employees</Link>
        <div className="flex justify-between items-center mt-1">
          <h1 className="text-3xl font-bold tracking-tight">Employee Profile: {empId.toUpperCase()}</h1>
          <div className="flex space-x-2">
            <Link href={`/employees/${empId}/edit`} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
              Edit Profile
            </Link>
            <Link href={`/employees/${empId}/documents`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold border border-slate-700 transition-colors">
              Vault Documents
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-slate-400">Full Name</div>
            <div className="font-semibold text-slate-100 mt-1">John Doe</div>
          </div>
          <div>
            <div className="text-slate-400">Designation</div>
            <div className="font-semibold text-slate-100 mt-1">Site Engineer</div>
          </div>
          <div>
            <div className="text-slate-400">Department</div>
            <div className="font-semibold text-slate-100 mt-1">Operations</div>
          </div>
          <div>
            <div className="text-slate-400">Status</div>
            <div className="font-semibold text-emerald-400 mt-1">ACTIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
