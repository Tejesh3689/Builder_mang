'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardStatCard from './DashboardStatCard';
import DashboardTableCard from './DashboardTableCard';
import DashboardActivityFeed from './DashboardActivityFeed';
import { Pagination } from '@/components/ui/Pagination';

export default function AdminDashboard({ 
  activeVentures, 
  pendingRequests,
  pendingCount,
  inventoryAlerts,
  siteActivities,
  materialConsumption
}: {
  activeVentures: any[];
  pendingRequests: any[];
  /** True number of requests in PENDING_APPROVAL (the table shows only the latest few). */
  pendingCount: number;
  inventoryAlerts: any[];
  siteActivities: any[]; 
  materialConsumption?: { label: string; pct: string; color: string }[];
}) {
  const [pendingPage, setPendingPage] = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const pageSize = 5;

  const paginatedPending = pendingRequests.slice((pendingPage - 1) * pageSize, pendingPage * pageSize);
  const paginatedAlerts = inventoryAlerts.slice((alertsPage - 1) * pageSize, alertsPage * pageSize);

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

  const handleExport = () => {
    const csvRows = [
      ['ID', 'Name', 'Code', 'Location', 'Progress', 'Status'],
      ...activeVentures.map(v => [
        v.id, v.name, v.code, `"${v.location}"`, `${v.progress}%`, v.status
      ])
    ];
    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventures-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Dashboard</h1>
          <p className="text-xs text-zinc-500">Overview across all ventures</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors">
          Export Data
        </button>
      </div>

      {/* Row 1: Venture Progress + Venture Status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Venture Progress Card */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-black">Completion by venture</h2>
            </div>
            <Link href="/ventures" className="text-xs font-semibold text-zinc-600 hover:text-black flex items-center gap-1">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-4">
            {activeVentures.slice(0, 4).map((v) => (
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
            {activeVentures.length === 0 && (
              <p className="text-xs text-zinc-400 py-4 text-center">No ventures found.</p>
            )}
          </div>
        </div>

        {/* Venture Status Counts Card */}
        <DashboardStatCard title="Venture Status" items={statItems} />
      </div>

      {/* Row 2: Pending Approvals + Material Consumption */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <DashboardTableCard 
          title="Pending Approvals" 
          subtitle={`${pendingCount} material request${pendingCount === 1 ? '' : 's'} awaiting decision`}
          viewAllLink="/materials/requests"
          headers={['REQUEST', 'VENTURE', 'REQUESTED BY', 'TYPE', 'DATE', 'PRIORITY', 'STATUS']}
          colSpanClass="sm:col-span-2 lg:col-span-2"
          footer={
            pendingRequests.length > pageSize ? (
              <Pagination
                currentPage={pendingPage}
                totalItems={pendingRequests.length}
                pageSize={pageSize}
                onPageChange={setPendingPage}
              />
            ) : null
          }
        >
          {paginatedPending.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-zinc-400">No material requests are waiting for a decision.</td></tr>
          )}
          {paginatedPending.map((r, i) => (
            <tr key={i} className="hover:bg-zinc-50/80">
              <td className="py-3 pr-2 sm:pr-2.5 font-mono font-medium text-[11px] text-zinc-700 whitespace-nowrap">
                <span className="max-w-[105px] truncate block" title={r.id}>{r.id}</span>
              </td>
              <td className="py-3 pr-2 sm:pr-2.5 font-bold text-black text-xs">
                <span className="max-w-[115px] xl:max-w-[140px] truncate block" title={r.company}>{r.company}</span>
              </td>
              <td className="py-3 pr-2 sm:pr-2.5 text-zinc-700 text-xs">
                <span className="max-w-[85px] xl:max-w-[105px] truncate block" title={r.requestedBy}>{r.requestedBy}</span>
              </td>
              <td className="py-3 pr-2 sm:pr-2.5 text-zinc-600 text-xs">
                <span className="max-w-[95px] xl:max-w-[125px] truncate block" title={r.material}>{r.material}</span>
              </td>
              <td className="py-3 pr-2 sm:pr-2.5 whitespace-nowrap font-mono text-zinc-500 text-[11px]">{r.date}</td>
              <td className="py-3 pr-2 sm:pr-2.5 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  r.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {r.priority}
                </span>
              </td>
              <td className="py-3 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {r.status}
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
              {(materialConsumption && materialConsumption.length > 0 ? materialConsumption : []).map((item, idx) => (
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

      {/* Row 3: Inventory Alerts + Site Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {/* Inventory Alerts Card */}
        <DashboardTableCard 
          title="Inventory Alerts"
          viewAllLink="/materials/alerts"
          headers={['MATERIAL', 'LOCATION', 'STATUS']}
          colSpanClass="sm:col-span-2 lg:col-span-2"
          footer={
            inventoryAlerts.length > pageSize ? (
              <Pagination
                currentPage={alertsPage}
                totalItems={inventoryAlerts.length}
                pageSize={pageSize}
                onPageChange={setAlertsPage}
              />
            ) : null
          }
        >
          {paginatedAlerts.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-zinc-400">All stock is above its reorder level.</td></tr>
          )}
          {paginatedAlerts.map((alt, idx) => (
            <tr key={idx}>
              <td className="py-3.5 pr-4 font-bold text-black max-w-[200px] truncate">{alt.name}</td>
              <td className="py-3.5 pr-4 text-zinc-500 font-mono text-[11px] whitespace-nowrap">{alt.location}</td>
              <td className="py-3.5 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  alt.tone === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {alt.status}
                </span>
              </td>
            </tr>
          ))}
        </DashboardTableCard>

        {/* Site Activity Card */}
        <DashboardActivityFeed 
          title="Site Activity" 
          subtitle="Across all ventures" 
          activities={siteActivities} 
        />
      </div>
    </div>
  );
}
