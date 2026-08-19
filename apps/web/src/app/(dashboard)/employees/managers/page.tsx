'use client';

import React, { useState, useEffect } from 'react';
import { getLocalManagers, saveLocalManagers, addLocalManager, ManagerProfile } from '@/lib/mockDatabase';

export default function ManagersDirectoryPage() {
  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [venturesInput, setVenturesInput] = useState('');

  useEffect(() => {
    setManagers(getLocalManagers());
  }, []);

  const filteredManagers = managers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const ventures = venturesInput
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const newMgr = addLocalManager({
      name,
      phone,
      email,
      ventures,
      supervisors: 0,
      employeeCount: 0,
      openIssues: 0,
      pendingRequests: 0,
    });

    setManagers([...managers, newMgr]);
    setName('');
    setPhone('+91 ');
    setEmail('');
    setVenturesInput('');
    setShowAddModal(false);
  };

  const getAvatarColor = (mgrName: string) => {
    const char = mgrName.charCodeAt(0) % 5;
    const colors = [
      'bg-red-500/10 text-red-700 border-red-200/60',
      'bg-amber-500/10 text-amber-700 border-amber-200/60',
      'bg-emerald-500/10 text-emerald-700 border-emerald-200/60',
      'bg-blue-500/10 text-blue-700 border-blue-200/60',
      'bg-purple-500/10 text-purple-700 border-purple-200/60',
    ];
    return colors[char];
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">Managers</h1>
        <div className="text-xs text-zinc-500 font-medium">Directory</div>
      </div>

      {/* Search & Actions Panel */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-xs w-full sm:max-w-md">
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-hidden text-xs w-full text-zinc-800 placeholder-zinc-400"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          + Add Manager
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/20">
                <th className="py-3 px-6 font-semibold">Manager</th>
                <th className="py-3 px-6 font-semibold">Ventures Managed</th>
                <th className="py-3 px-6 font-semibold text-center">Supervisors</th>
                <th className="py-3 px-6 font-semibold text-center">Employees</th>
                <th className="py-3 px-6 font-semibold text-center">Open Issues</th>
                <th className="py-3 px-6 font-semibold text-center">Pending Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredManagers.map((m) => {
                const initials = m.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
                return (
                  <tr key={m.id} className="hover:bg-zinc-50/20 transition-colors">
                    {/* Manager name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(m.name)}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{m.name}</div>
                          <div className="text-[10px] text-zinc-400">{m.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Ventures managed */}
                    <td className="py-4 px-6 text-zinc-700 font-medium">
                      {m.ventures.join(', ') || 'No active ventures'}
                    </td>

                    {/* Supervisors count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      {m.supervisors}
                    </td>

                    {/* Employees count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      {m.employeeCount}
                    </td>

                    {/* Open issues count */}
                    <td className="py-4 px-6 text-center">
                      {m.openIssues > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/50">
                          • {m.openIssues}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">0</span>
                      )}
                    </td>

                    {/* Pending requests count */}
                    <td className="py-4 px-6 text-center">
                      {m.pendingRequests > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                          • {m.pendingRequests}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Manager */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Manager</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="e.g. arjun.reddy@naprocs.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Assigned Ventures (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Green Valley Residency, Skyline Heights"
                  value={venturesInput}
                  onChange={(e) => setVenturesInput(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Save Manager</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
