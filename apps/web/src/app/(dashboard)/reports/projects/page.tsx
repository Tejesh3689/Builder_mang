import React from 'react';
import Link from 'next/link';

const mockProjects = [
  { id: 'PRJ-101', name: 'Downtown Skyline', status: 'Active', budget: '$5M', spent: '$2.1M', completion: 45 },
  { id: 'PRJ-102', name: 'Riverside Complex', status: 'On Hold', budget: '$12M', spent: '$4.5M', completion: 38 },
  { id: 'PRJ-103', name: 'Sunnyvale Estates', status: 'Completed', budget: '$2.5M', spent: '$2.4M', completion: 100 },
  { id: 'PRJ-104', name: 'Metro Transit Hub', status: 'Active', budget: '$25M', spent: '$18M', completion: 72 },
];

export default function ProjectReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Project Reports</h1>
        <Link href="/reports/projects/export" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800">Export Report</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total Projects</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">24</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Active Budget</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">$44.5M</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Avg. Completion</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">64%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr>
              <th className="px-6 py-4 font-medium">Project ID</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Budget</th>
              <th className="px-6 py-4 font-medium">Spent</th>
              <th className="px-6 py-4 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-zinc-800">
            {mockProjects.map(p => (
              <tr key={p.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4 font-medium text-zinc-900">{p.id}</td>
                <td className="px-6 py-4">{p.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>{p.status}</span>
                </td>
                <td className="px-6 py-4">{p.budget}</td>
                <td className="px-6 py-4">{p.spent}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-zinc-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${p.completion}%` }}></div>
                    </div>
                    <span className="text-xs text-zinc-500 w-8">{p.completion}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
