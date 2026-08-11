import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg">B</div>
            <span className="font-bold text-lg tracking-wide">Builder Portal</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white transition-all font-medium">
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/ventures" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white transition-all font-medium">
              <span>🏗️</span>
              <span>Ventures</span>
            </Link>
            <Link href="/materials" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white transition-all font-medium">
              <span>📦</span>
              <span>Materials</span>
            </Link>
            <Link href="/employees" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white transition-all font-medium">
              <span>👥</span>
              <span>Employees</span>
            </Link>
            <Link href="/chat" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-white transition-all font-medium">
              <span>💬</span>
              <span>Chat Rooms</span>
            </Link>
          </nav>
        </div>

        {/* Footer Profile info */}
        <div className="border-t border-slate-800 pt-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold">SA</div>
          <div>
            <div className="font-semibold text-sm">Super Admin</div>
            <div className="text-xs text-slate-400">admin@builder.com</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold">Workspace</h2>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 hover:bg-slate-700">Notifications</button>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white">Logout</Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
