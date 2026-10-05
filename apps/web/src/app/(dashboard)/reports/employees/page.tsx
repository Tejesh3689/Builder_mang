import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export default async function EmployeeReportsPage() {
  await requireAuth();

  const employeesData = await prisma.employee.findMany({
    orderBy: { firstName: 'asc' },
    select: {
      employeeId: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      performanceRating: true,
      attendance: true
    }
  });

  const employees = employeesData.map(e => {
    const presentDays = e.attendance.filter(a => a.status === 'PRESENT').length;
    // rough approximation for mock metric replacement
    const hours = presentDays * 8;
    
    let rating = 'Average';
    if (e.performanceRating && e.performanceRating >= 4.5) rating = 'Excellent';
    else if (e.performanceRating && e.performanceRating >= 3.5) rating = 'Good';

    return {
      id: e.employeeId,
      name: `${e.firstName} ${e.lastName}`.trim(),
      role: e.designation,
      department: e.department,
      hours,
      rating
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Employee Reports</h1>
        <Link href="/reports/employees/export" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start">Export Report</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Emp ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Hours Logged (Mtd)</th>
                <th className="px-6 py-4 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {employees.map(e => (
                <tr key={e.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{e.id}</td>
                  <td className="px-6 py-4">{e.name}</td>
                  <td className="px-6 py-4">{e.role}</td>
                  <td className="px-6 py-4">{e.department}</td>
                  <td className="px-6 py-4">{e.hours}h</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      e.rating === 'Excellent' ? 'bg-purple-100 text-purple-800' :
                      e.rating === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>{e.rating}</span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No employee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
