import React from 'react';
import Link from 'next/link';

const mockEmployees = [
  { id: 'E-001', name: 'John Doe', role: 'Site Manager', department: 'Operations', hours: 160, rating: 'Excellent' },
  { id: 'E-002', name: 'Sarah Smith', role: 'Civil Engineer', department: 'Engineering', hours: 172, rating: 'Good' },
  { id: 'E-003', name: 'Michael Brown', role: 'Safety Officer', department: 'Compliance', hours: 155, rating: 'Excellent' },
  { id: 'E-004', name: 'Emily Davis', role: 'Architect', department: 'Design', hours: 140, rating: 'Average' },
];

export default function EmployeeReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Employee Reports</h1>
        <Link href="/reports/employees/export" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Export Report</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
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
            {mockEmployees.map(e => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
