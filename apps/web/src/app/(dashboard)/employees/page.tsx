import React from 'react';
import Link from 'next/link';

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
        <Link href="/employees/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
          + Add Employee
        </Link>
      </div>

      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
        <div className="divide-y divide-slate-800 text-sm">
          <div className="py-3 flex justify-between font-medium text-slate-400">
            <span>Name</span>
            <span>Employee ID</span>
            <span>Designation</span>
            <span>Assigned Venture</span>
          </div>
          <div className="py-4 flex justify-between items-center">
            <div>
              <Link href="/employees/emp-001" className="font-semibold text-indigo-400 hover:underline">John Doe</Link>
              <div className="text-xs text-slate-400">engineer@builder.com</div>
            </div>
            <span className="font-mono text-xs">EMP-001</span>
            <span>Site Engineer</span>
            <span>Venture Heights Phase 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
