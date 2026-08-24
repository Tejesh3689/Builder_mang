'use client';

import React from 'react';
import DashboardStatCard from './DashboardStatCard';
import DashboardTableCard from './DashboardTableCard';
import DashboardActivityFeed from './DashboardActivityFeed';
import DashboardQuickActions from './DashboardQuickActions';

export default function SupervisorDashboard() {
  const statItems = [
    { label: 'Total Team Members', count: 24, tone: { bg: 'bg-zinc-50 border-zinc-200', text: 'text-zinc-800', dot: 'bg-zinc-500' } },
    { label: 'Present Today', count: 18, tone: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' } },
    { label: 'Absent Today', count: 2, tone: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' } },
    { label: 'Late Today', count: 1, tone: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' } },
    { label: 'On Leave', count: 3, tone: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' } },
    { label: 'Field Work', count: 4, tone: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' } },
  ];

  const pendingLeaves = [
    { emp: 'Ravi Kumar', type: 'Sick Leave', dates: '12 Aug - 13 Aug', status: 'Pending' },
    { emp: 'Anil Desai', type: 'Casual Leave', dates: '15 Aug - 16 Aug', status: 'Pending' }
  ];

  const pendingFieldWork = [
    { emp: 'Suresh Babu', task: 'Site Inspection', loc: 'Skyline Heights', status: 'Pending' }
  ];

  const teamActivities = [
    { t: 'Ravi Kumar checked in at Green Valley Residency', ts: '10 min ago' },
    { t: 'Anil Desai submitted field report for Block A', ts: '1 hr ago' },
    { t: 'Suresh Babu marked absent', ts: '3 hr ago' }
  ];

  const quickActions = [
    { label: 'Mark Attendance', icon: 'check', href: '/attendance/mark', color: 'text-emerald-600' },
    { label: 'Assign Task', icon: 'file', href: '/field-work/assign', color: 'text-amber-600' },
    { label: 'Material Request', icon: 'package', href: '/materials/request', color: 'text-zinc-600' }
  ];

  const teamAttendance = [
    { name: 'Ravi Kumar', role: 'Electrician', timeIn: '08:00 AM', status: 'Present', tone: 'emerald' },
    { name: 'Anil Desai', role: 'Plumber', timeIn: '08:15 AM', status: 'Late', tone: 'amber' },
    { name: 'Suresh Babu', role: 'Mason', timeIn: '—', status: 'Absent', tone: 'red' },
    { name: 'Manoj Tiwari', role: 'Helper', timeIn: '—', status: 'On Leave', tone: 'blue' },
  ];

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardStatCard title="Team Overview" items={statItems.slice(0, 3)} />
        <DashboardStatCard title="Attendance Exceptions" items={statItems.slice(3, 6)} />
        <DashboardQuickActions title="Quick Actions" actions={quickActions} />
      </div>

      {/* Row 2: Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
