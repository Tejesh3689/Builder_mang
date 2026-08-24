'use client';

import React from 'react';
import DashboardStatCard from './DashboardStatCard';
import DashboardTableCard from './DashboardTableCard';
import DashboardActivityFeed from './DashboardActivityFeed';
import DashboardQuickActions from './DashboardQuickActions';

export default function ManagerDashboard() {
  const statItems = [
    { label: 'Extended Team Size', count: 142, tone: { bg: 'bg-zinc-50 border-zinc-200', text: 'text-zinc-800', dot: 'bg-zinc-500' } },
    { label: 'Active Ventures', count: 4, tone: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' } },
    { label: 'Present Today', count: 128, tone: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' } },
    { label: 'Absent Today', count: 8, tone: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' } },
    { label: 'On Leave', count: 6, tone: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' } },
    { label: 'Material Alerts', count: 3, tone: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' } },
  ];

  const pendingRequests = [
    { type: 'Leave', req: 'Ravi Kumar (Sick)', dates: '12 Aug - 13 Aug', status: 'Pending' },
    { type: 'Material', req: 'Cement (200 Bags)', dates: '11 Aug', status: 'Pending' },
    { type: 'Expense', req: 'Travel Claim', dates: '10 Aug', status: 'Pending' }
  ];

  const ventureHealth = [
    { name: 'Green Valley Residency', health: 'On Track', progress: 68, tone: 'emerald' },
    { name: 'Skyline Heights', health: 'At Risk', progress: 42, tone: 'amber' },
    { name: 'Riverfront Towers', health: 'On Track', progress: 91, tone: 'emerald' },
  ];

  const extendedActivities = [
    { t: 'Supervisor Sharma approved 4 leave requests', ts: '15 min ago' },
    { t: 'Material request for Skyline Heights escalated', ts: '1 hr ago' },
    { t: 'Team attendance for Green Valley falls below 90%', ts: '3 hr ago' }
  ];

  const quickActions = [
    { label: 'Review Approvals', icon: 'check', href: '/approvals', color: 'text-emerald-600' },
    { label: 'Assign Supervisor', icon: 'users', href: '/employees/team', color: 'text-blue-600' },
    { label: 'Generate Reports', icon: 'file', href: '/reports/team', color: 'text-amber-600' }
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Manager Dashboard</h1>
          <p className="text-xs text-zinc-500">Overview of your extended teams and ventures</p>
        </div>
      </div>

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardStatCard title="Scope Overview" items={statItems.slice(0, 3)} />
        <DashboardStatCard title="Exceptions & Alerts" items={statItems.slice(3, 6)} />
        <DashboardQuickActions title="Manager Actions" actions={quickActions} />
      </div>

      {/* Row 2: Pending Approvals & Venture Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <DashboardTableCard 
          title="Action Required"
          viewAllLink="/approvals"
          headers={['TYPE', 'REQUEST', 'DATE', 'STATUS']}
        >
          {pendingRequests.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 font-bold text-black">{r.type}</td>
              <td className="py-3 text-zinc-600">{r.req}</td>
              <td className="py-3 font-mono text-zinc-500">{r.dates}</td>
              <td className="py-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  • {r.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>

        <DashboardTableCard 
          title="Venture Health Snapshot"
          viewAllLink="/ventures"
          headers={['VENTURE', 'HEALTH', 'PROGRESS']}
        >
          {ventureHealth.map((v, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 font-bold text-black">{v.name}</td>
              <td className="py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  v.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  • {v.health}
                </span>
              </td>
              <td className="py-3 text-zinc-600 font-mono">{v.progress}%</td>
            </tr>
          ))}
        </DashboardTableCard>
      </div>

      {/* Row 3: Extended Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardActivityFeed 
          title="Extended Team Activity" 
          subtitle="Updates across your hierarchy" 
          activities={extendedActivities} 
          colSpanClass="lg:col-span-3"
        />
      </div>
    </div>
  );
}
