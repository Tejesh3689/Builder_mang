import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';

export const revalidate = 0;

export default async function VenturesPage() {
  let dbVentures: any[] = [];
  try {
    dbVentures = await prisma.venture.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: true,
        stocks: true,
      },
    });
  } catch (error) {
    console.error('Failed to load ventures from DB:', error);
  }

  // Fallback to sample list if DB is empty
  const ventures = dbVentures.length > 0
    ? dbVentures.map((v: any) => ({
        id: v.id,
        name: v.name,
        code: v.code,
        location: v.location,
        status: v.status,
        teamCount: v.assignments?.length || 0,
      }))
    : [
        { id: 'V-01', name: 'Green Valley Residency', code: 'GVR-2024-01', location: 'Kondapur, Hyderabad', status: 'ACTIVE', teamCount: 24 },
        { id: 'V-02', name: 'Skyline Heights', code: 'SKH-2024-02', location: 'Whitefield, Bengaluru', status: 'ACTIVE', teamCount: 31 },
        { id: 'V-03', name: 'Riverfront Towers', code: 'RFT-2023-11', location: 'OMR, Chennai', status: 'ACTIVE', teamCount: 19 },
        { id: 'V-04', name: 'Sunrise Villas', code: 'SRV-2024-05', location: 'Baner, Pune', status: 'PLANNING', teamCount: 12 },
      ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Construction Ventures</h1>
          <p className="text-xs text-zinc-500 mt-1">Managed sites, location assignments, and live progress</p>
        </div>
        <Link
          href="/ventures/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-md shadow-black/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span>Create Venture</span>
        </Link>
      </div>

      {/* Ventures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ventures.map((v: any) => (
          <div key={v.id} className="bg-white p-6 rounded-[24px] border border-zinc-200/80 shadow-sm hover:border-black/30 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-extrabold text-base text-black tracking-tight">{v.name}</h3>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5">{v.code} · {v.location}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  v.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}>
                  {v.status}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                Assigned Team: <strong className="font-semibold text-black">{v.teamCount} Employees</strong>
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <Link href={`/ventures/${v.id}`} className="font-bold text-black hover:underline flex items-center gap-1">
                <span>View Workspace</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </Link>
              <Link href={`/chat`} className="text-zinc-500 hover:text-black transition-colors font-medium">
                Venture Chat →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

