import React from 'react';
import Link from 'next/link';

export default function VenturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Ventures</h1>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors">
          + New Venture
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4 hover-lift">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold">Venture Heights Phase 1</h3>
              <p className="text-xs text-slate-400">VEN-A • Downtown City Center</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">Active</span>
          </div>
          <div className="text-sm text-slate-300">
            Current assigned staff: 14 Employees
          </div>
          <div className="flex justify-between pt-4 border-t border-slate-800 text-xs">
            <Link href="/ventures/ven-a" className="text-indigo-400 hover:underline">View Site Details</Link>
            <Link href="/chat/ven-a" className="text-indigo-400 hover:underline">Join Chat Room</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
