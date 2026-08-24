'use client';

import React from 'react';
import Link from 'next/link';
import DashboardStatCard from './DashboardStatCard';
import DashboardTableCard from './DashboardTableCard';
import DashboardActivityFeed from './DashboardActivityFeed';

export default function AdminDashboard({ 
  activeVentures, 
  pendingRequests, 
  inventoryAlerts, 
  siteActivities 
}: { 
  activeVentures: any[]; 
  pendingRequests: any[]; 
  inventoryAlerts: any[]; 
  siteActivities: any[]; 
}) {
  const statusToneMap: Record<string, { bg: string; text: string; dot: string }> = {
    'on-track': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    'at-risk': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    'delayed': { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
    'completed': { bg: 'bg-zinc-100 border-zinc-200', text: 'text-zinc-700', dot: 'bg-zinc-500' },
  };

  const statItems = [
    { label: 'On Track', statusKey: 'on-track' },
    { label: 'At Risk', statusKey: 'at-risk' },
    { label: 'Delayed', statusKey: 'delayed' },
    { label: 'Completed', statusKey: 'completed' },
  ].map((st) => ({
    label: st.label,
    count: activeVentures.filter((v) => v.status === st.statusKey).length,
    tone: statusToneMap[st.statusKey]
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Dashboard</h1>
          <p className="text-xs text-zinc-500">Overview across all ventures</p>
        </div>
      </div>

      {/* Row 1: Venture Progress + Venture Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Venture Progress Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-black">Completion by venture</h2>
            </div>
            <Link href="/ventures" className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-4">
            {activeVentures.map((v) => (
              <div key={v.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-black">{v.name}</span>
                  <span className="font-mono text-zinc-500">{v.progress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      v.status === 'delayed' ? 'bg-red-500' : 'bg-amber-600'
                    }`}
                    style={{ width: `${v.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venture Status Counts Card */}
        <DashboardStatCard title="Venture Status" items={statItems} />
      </div>

      {/* Row 2: Pending Approvals + Material Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <DashboardTableCard 
          title="Pending Approvals" 
          subtitle={`${pendingRequests.length} material requests awaiting decision`}
          viewAllLink="/materials/requests"
          headers={['REQUEST', 'VENTURE', 'REQUESTED BY', 'TYPE', 'DATE', 'PRIORITY', 'STATUS']}
          colSpanClass="lg:col-span-2"
        >
          {pendingRequests.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 font-mono font-medium text-zinc-500">{r.id}</td>
              <td className="py-3 font-bold text-black">{r.company}</td>
              <td className="py-3 text-zinc-600">{r.requestedBy}</td>
              <td className="py-3 text-zinc-600">{r.material}</td>
              <td className="py-3 font-mono text-zinc-500">{r.date}</td>
              <td className="py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  r.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  • {r.priority}
                </span>
              </td>
              <td className="py-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  • {r.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>

        {/* Material Consumption Progress */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-black mb-0.5">Material Consumption</h2>
            <p className="text-xs text-zinc-500 mb-4">This week, by category</p>
            <div className="space-y-3.5">
              {[
                { label: 'Cement', pct: '78%', color: 'bg-amber-600' },
                { label: 'Steel', pct: '54%', color: 'bg-zinc-600' },
                { label: 'Sand', pct: '40%', color: 'bg-emerald-700' },
                { label: 'Bricks', pct: '61%', color: 'bg-amber-800' },
                { label: 'Other', pct: '22%', color: 'bg-zinc-400' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-black">
                    <span>{item.label}</span>
                    <span className="font-mono text-zinc-500">{item.pct}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: item.pct }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Site Activity Timeline + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardActivityFeed 
          title="Site Activity" 
          subtitle="Across all ventures" 
          activities={siteActivities} 
          colSpanClass="lg:col-span-2"
        />

        {/* Inventory Alerts Card */}
        <DashboardTableCard 
          title="Inventory Alerts"
          viewAllLink="/materials/alerts"
          headers={['MATERIAL', 'LOCATION', 'STATUS']}
        >
          {inventoryAlerts.map((alt, idx) => (
            <tr key={idx}>
              <td className="py-3 font-bold text-black">{alt.name}</td>
              <td className="py-3 text-zinc-500 font-mono text-[11px]">{alt.location}</td>
              <td className="py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  alt.tone === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  • {alt.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>
      </div>
    </div>
  );
}
