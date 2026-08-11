import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <div className="text-sm text-slate-400">Welcome back, Super Admin</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm hover-lift">
          <div className="text-slate-400 text-sm font-medium">Total Ventures</div>
          <div className="text-3xl font-bold mt-2">12</div>
        </div>
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm hover-lift">
          <div className="text-slate-400 text-sm font-medium">Active Employees</div>
          <div className="text-3xl font-bold mt-2">48</div>
        </div>
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm hover-lift">
          <div className="text-slate-400 text-sm font-medium">Pending Requests</div>
          <div className="text-3xl font-bold mt-2 text-yellow-500">6</div>
        </div>
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 shadow-sm hover-lift">
          <div className="text-slate-400 text-sm font-medium">Low Stock Items</div>
          <div className="text-3xl font-bold mt-2 text-red-500">2</div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Material Requests */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Recent Material Requests</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-sm">Req #1042 - Venture Heights</div>
                <div className="text-xs text-slate-400">Cement OPC - 150 Bags</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400">Pending</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <div className="font-semibold text-sm">Req #1041 - Venture Greens</div>
                <div className="text-xs text-slate-400">TMT Steel - 2000 Kg</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">Approved</span>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">System Activity Logs</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
              <span>Admin updated Cement stock on Venture A</span>
              <span>10 mins ago</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
              <span>John Doe joined Venture Heights Chat Room</span>
              <span>1 hour ago</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 pb-1">
              <span>Super Admin created employee EMP-003</span>
              <span>2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
