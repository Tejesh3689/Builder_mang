'use client';

import React from 'react';
import DashboardStatCard from './DashboardStatCard';
import DashboardTableCard from './DashboardTableCard';
import DashboardActivityFeed from './DashboardActivityFeed';
import DashboardQuickActions from './DashboardQuickActions';

export default function SupervisorDashboard({
  stats,
  pendingLeaves,
  pendingFieldWork,
  teamActivities,
  quickActions,
  teamAttendance
}: {
  stats: any[];
  pendingLeaves: any[];
  pendingFieldWork: any[];
  teamActivities: any[];
  quickActions: any[];
  teamAttendance: any[];
}) {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Supervisor Dashboard</h1>
          <p className="text-xs text-zinc-500">Overview of your assigned team</p>
        </div>
      </div>

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardStatCard title="Team Overview" items={stats.slice(0, 3)} />
        <DashboardStatCard title="Attendance Exceptions" items={stats.slice(3, 6)} />
        <DashboardQuickActions title="Quick Actions" actions={quickActions} />
      </div>

      {/* Row 2: Pending Approvals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <DashboardTableCard 
          title="Pending Leave Approvals"
          viewAllLink="/leave"
          headers={['EMPLOYEE', 'TYPE', 'DATES', 'STATUS']}
        >
          {pendingLeaves.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 font-bold text-black">{r.emp}</td>
              <td className="py-3 text-zinc-600">{r.type}</td>
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
          title="Pending Field Work"
          viewAllLink="/field-work"
          headers={['EMPLOYEE', 'TASK', 'LOCATION', 'STATUS']}
        >
          {pendingFieldWork.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 font-bold text-black">{r.emp}</td>
              <td className="py-3 text-zinc-600">{r.task}</td>
              <td className="py-3 font-mono text-zinc-500">{r.loc}</td>
              <td className="py-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  • {r.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>
      </div>

      {/* Row 3: Team Activity & Attendance List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardActivityFeed 
          title="Team Activity" 
          subtitle="Recent updates from your team" 
          activities={teamActivities} 
        />

        <DashboardTableCard 
          title="Team Attendance Today"
          viewAllLink="/attendance"
          headers={['EMPLOYEE', 'ROLE', 'TIME IN', 'STATUS']}
          colSpanClass="lg:col-span-2"
        >
          {teamAttendance.map((emp, idx) => (
            <tr key={idx} className="hover:bg-zinc-50/80">
              <td className="py-3 font-bold text-black">{emp.name}</td>
              <td className="py-3 text-zinc-500 text-xs">{emp.role}</td>
              <td className="py-3 font-mono text-zinc-500">{emp.timeIn}</td>
              <td className="py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  emp.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                  emp.tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  emp.tone === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  • {emp.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>
      </div>
    </div>
  );
}
