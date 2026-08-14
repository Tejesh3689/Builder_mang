import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';

export const revalidate = 0;

export default async function EmployeesPage() {
  let dbEmployees: any[] = [];
  try {
    dbEmployees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        assignments: { include: { venture: true } },
      },
    });
  } catch (err) {
    console.error('Failed to fetch employees from DB:', err);
  }

  const employees = dbEmployees.length > 0
    ? dbEmployees.map((e: any) => ({
        id: e.id,
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        email: e.user?.email || '—',
        designation: e.designation,
        department: e.department,
        status: e.status,
        venture: e.assignments[0]?.venture?.name || '—',
      }))
    : [
        { id: 'EMP-1001', employeeId: 'EMP-1001', name: 'Krishna Rao', email: 'krishna.rao@naprocs-site.in', designation: 'Supervisor', department: 'Site Operations', status: 'ACTIVE', venture: 'Green Valley Residency' },
        { id: 'EMP-1002', employeeId: 'EMP-1002', name: 'Suresh Kumar', email: 'suresh.kumar@naprocs-site.in', designation: 'Supervisor', department: 'Site Operations', status: 'ACTIVE', venture: 'Skyline Heights' },
        { id: 'EMP-1003', employeeId: 'EMP-1003', name: 'Manoj Verma', email: 'manoj.verma@naprocs-site.in', designation: 'Supervisor', department: 'Site Operations', status: 'ACTIVE', venture: 'Riverfront Towers' },
        { id: 'EMP-1013', employeeId: 'EMP-1013', name: 'Anitha Reddy', email: 'anitha.reddy@naprocs-site.in', designation: 'Site Engineer', department: 'Engineering', status: 'ACTIVE', venture: 'Skyline Heights' },
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Employee Directory</h1>
          <p className="text-xs text-zinc-500 mt-1">Staff assignments, site roles, and contact credentials</p>
        </div>
        <Link
          href="/employees/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-md shadow-black/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span>Add Employee</span>
        </Link>
      </div>

      {/* Employees Table Card */}
      <div className="bg-white rounded-[24px] border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Active Personnel</h3>
          <span className="text-xs text-zinc-400 font-mono">{employees.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Employee</th>
                <th className="py-3 px-6 font-semibold">Employee ID</th>
                <th className="py-3 px-6 font-semibold">Designation</th>
                <th className="py-3 px-6 font-semibold">Department</th>
                <th className="py-3 px-6 font-semibold">Assigned Venture</th>
                <th className="py-3 px-6 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {employees.map((e: any) => (
                <tr key={e.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-black">{e.name}</div>
                    <div className="text-[11px] text-zinc-400">{e.email}</div>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-zinc-500">{e.employeeId}</td>
                  <td className="py-3.5 px-6 font-semibold text-black">{e.designation}</td>
                  <td className="py-3.5 px-6 text-zinc-500">{e.department}</td>
                  <td className="py-3.5 px-6 font-medium text-black">{e.venture}</td>
                  <td className="py-3.5 px-6">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

