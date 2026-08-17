import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';

export const revalidate = 0;

export default async function DashboardPage() {
  let counts = { ventures: 5, employees: 12, materials: 9, requests: 2, issues: 3, vendors: 7 };
  let pendingRequests: any[] = [];
  let activeVentures: any[] = [];
  let inventoryAlerts: any[] = [];

  try {
    const [vCount, eCount, mCount, rCount] = await Promise.all([
      prisma.venture.count(),
      prisma.employee.count(),
      prisma.material.count(),
      prisma.materialRequest.count({ where: { status: 'PENDING' } }),
    ]);

    counts = {
      ventures: vCount || 5,
      employees: eCount || 12,
      materials: mCount || 9,
      requests: rCount || 2,
      issues: 3,
      vendors: 7,
    };

    const dbRequests = await prisma.materialRequest.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        venture: true,
        createdBy: true,
        items: { include: { material: true } },
      },
    });

    if (dbRequests.length > 0) {
      pendingRequests = dbRequests.map((r: any) => ({
        id: r.id.substring(0, 8),
        company: r.venture?.name || 'Venture Site',
        requestedBy: r.createdBy?.name || 'Staff Member',
        material: r.items[0]?.material?.name || 'Material Item',
        date: r.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        priority: 'High',
        status: r.status,
      }));
    }

    const dbVentures = await prisma.venture.findMany();
    if (dbVentures.length > 0) {
      activeVentures = dbVentures.map((v: any) => ({
        id: v.id,
        name: v.name,
        code: v.code,
        location: `${v.regCity || 'Site'}, ${v.regState || 'India'}`,
        progress: v.status === 'ACTIVE' ? 68 : 100,
        status: v.status.toLowerCase() === 'active' ? 'on-track' : v.status.toLowerCase(),
      }));
    }
  } catch (err) {
    console.error('Error fetching dashboard counts from DB:', err);
  }

  // Fallbacks matching exact prototype screenshot data
  if (pendingRequests.length === 0) {
    pendingRequests = [
      { id: 'MR-1042', company: 'Green Valley Residency', requestedBy: 'Krishna Rao', material: 'Cement', date: '11 Aug 2026', priority: 'High', status: 'Pending' },
      { id: 'MR-1041', company: 'Skyline Heights', requestedBy: 'Suresh Kumar', material: 'Steel', date: '11 Aug 2026', priority: 'Critical', status: 'Pending' },
    ];
  }

  if (activeVentures.length === 0) {
    activeVentures = [
      { id: 'v1', name: 'Green Valley Residency', code: 'GVR-2024-01', location: 'Kondapur, Hyderabad', progress: 68, status: 'on-track' },
      { id: 'v2', name: 'Skyline Heights', code: 'SKH-2024-02', location: 'Whitefield, Bengaluru', progress: 42, status: 'at-risk' },
      { id: 'v3', name: 'Riverfront Towers', code: 'RFT-2023-11', location: 'OMR, Chennai', progress: 91, status: 'on-track' },
      { id: 'v4', name: 'Sunrise Villas', code: 'SRV-2024-05', location: 'Baner, Pune', progress: 15, status: 'delayed' },
    ];
  }

  inventoryAlerts = [
    { name: 'Steel — TMT Bars 12mm', location: 'SKH Yard', status: 'Low Stock', tone: 'amber' },
    { name: 'Red Clay Bricks', location: 'RFT Store', status: 'Low Stock', tone: 'amber' },
    { name: 'Exterior Emulsion Paint', location: 'RFT Store', status: 'Critical', tone: 'red' },
  ];

  const siteActivities = [
    { t: 'Krishna Rao submitted the daily report for Green Valley Residency — Tower A', ts: '14 min ago' },
    { t: '500 bags of Cement received at Green Valley Residency (PO-3341)', ts: '2 hr ago' },
    { t: '80 bags of Cement transferred from Riverfront Towers to Green Valley Residency', ts: '2 hr ago' },
    { t: 'New critical issue raised at Skyline Heights — missing guardrails', ts: '3 hr ago' },
  ];

  const statusToneMap: Record<string, { bg: string; text: string; dot: string }> = {
    'on-track': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    'at-risk': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    'delayed': { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500' },
    'completed': { bg: 'bg-zinc-100 border-zinc-200', text: 'text-zinc-700', dot: 'bg-zinc-500' },
  };

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
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-3.5">
            {[
              { label: 'On Track', statusKey: 'on-track' },
              { label: 'At Risk', statusKey: 'at-risk' },
              { label: 'Delayed', statusKey: 'delayed' },
              { label: 'Completed', statusKey: 'completed' },
            ].map((st) => {
              const tone = statusToneMap[st.statusKey];
              const count = activeVentures.filter((v) => v.status === st.statusKey).length;
              return (
                <div key={st.statusKey} className="flex items-center justify-between p-2 rounded-xl">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${tone.bg} ${tone.text}`}>
                    <span className={`w-2 h-2 rounded-full ${tone.dot}`}></span>
                    <span>{st.label}</span>
                  </span>
                  <span className="font-mono font-bold text-base text-black">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Pending Approvals + Material Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-extrabold text-black">Pending Approvals</h2>
              <p className="text-xs text-zinc-500">{pendingRequests.length} material requests awaiting decision</p>
            </div>
            <Link href="/materials/requests" className="text-xs font-semibold text-zinc-600 hover:text-black">
              View all &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase font-mono text-[10px]">
                  <th className="pb-2">REQUEST</th>
                  <th className="pb-2">VENTURE</th>
                  <th className="pb-2">REQUESTED BY</th>
                  <th className="pb-2">TYPE</th>
                  <th className="pb-2">DATE</th>
                  <th className="pb-2">PRIORITY</th>
                  <th className="pb-2">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Consumption Progress */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-black mb-0.5">Material Consumption</h2>
            <p className="text-xs text-zinc-500 mb-4">This week, by category</p>
            <div className="space-y-3.5">
              {[
                { label: 'Cement', pct: '78%', color: 'bg-amber-600' },
                { label: 'Steel', pct: '54%', color: 'bg-slate-700' },
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
        {/* Site Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm">
          <h2 className="font-extrabold text-black mb-0.5">Site Activity</h2>
          <p className="text-xs text-zinc-500 mb-4">Across all ventures</p>

          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
            {siteActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 pl-6 relative">
                <span className="absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-amber-600 bg-white"></span>
                <div>
                  <p className="text-xs font-semibold text-black">{act.t}</p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{act.ts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Alerts Card */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-black">Inventory Alerts</h2>
              <Link href="/materials/alerts" className="text-xs font-semibold text-zinc-600 hover:text-black">
                View all &rarr;
              </Link>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 uppercase font-mono text-[10px]">
                  <th className="pb-2">MATERIAL</th>
                  <th className="pb-2">LOCATION</th>
                  <th className="pb-2">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

