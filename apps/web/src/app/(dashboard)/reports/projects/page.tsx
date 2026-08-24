import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProjectReportsPage() {
  const projects = await prisma.venture.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const totalProjects = projects.length;
  
  const activeBudget = projects
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);

  const avgCompletion = totalProjects > 0
    ? projects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / totalProjects
    : 0;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Project Reports</h1>
        <Link href="/reports/projects/export" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start">Export Report</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total Projects</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{totalProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Active Budget</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{formatCurrency(activeBudget)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Avg. Completion</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{Math.round(avgCompletion)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Project Code</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Budget</th>
                <th className="px-6 py-4 font-medium">Spent</th>
                <th className="px-6 py-4 font-medium">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{p.code}</td>
                  <td className="px-6 py-4">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                      p.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4">{formatCurrency(p.estimatedBudget || 0)}</td>
                  <td className="px-6 py-4">{formatCurrency((p.estimatedBudget || 0) * 0.4)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 min-w-[140px]">
                      <div className="w-full bg-zinc-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${p.progressPercentage || 0}%` }}></div>
                      </div>
                      <span className="text-xs text-zinc-500 w-8">{p.progressPercentage || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No projects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
