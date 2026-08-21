'use client';

import React, { useState, useEffect } from 'react';
import { getLocalSupervisors, saveLocalSupervisors, addLocalSupervisor, SupervisorProfile } from '@/lib/mockDatabase';

export default function SupervisorsDirectoryPage() {
  const [supervisors, setSupervisors] = useState<SupervisorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [venture, setVenture] = useState('Green Valley Residency');
  const [site, setSite] = useState('GVR — Tower A');

  useEffect(() => {
    setSupervisors(getLocalSupervisors());
  }, []);

  const filteredSupervisors = supervisors.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newSup = addLocalSupervisor({
      name,
      phone,
      venture,
      site,
      employees: 0,
      dailyReports: 0,
      openTasks: 0,
      openIssues: 0,
    });

    setSupervisors([...supervisors, newSup]);
    setName('');
    setPhone('+91 ');
    setShowAddModal(false);
  };

  const getAvatarColor = (supName: string) => {
    const char = supName.charCodeAt(0) % 5;
    const colors = [
      'bg-amber-600/10 text-amber-700 border-amber-200/60',
      'bg-amber-500/10 text-amber-700 border-amber-200/60',
      'bg-zinc-100 text-zinc-700 border-zinc-200/60',
      'bg-amber-700/10 text-amber-800 border-amber-200/60',
      'bg-zinc-200 text-zinc-850 border-zinc-300/60',
    ];
    return colors[char];
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">Supervisors</h1>
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
            placeholder="Search supervisors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-hidden text-xs w-full text-zinc-800 placeholder-zinc-400"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          + Add Supervisor
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/20">
                <th className="py-3 px-6 font-semibold">Supervisor</th>
                <th className="py-3 px-6 font-semibold">Venture</th>
                <th className="py-3 px-6 font-semibold">Site Location</th>
                <th className="py-3 px-6 font-semibold text-center">Employees Managed</th>
                <th className="py-3 px-6 font-semibold text-center">Daily Reports</th>
                <th className="py-3 px-6 font-semibold text-center">Open Tasks</th>
                <th className="py-3 px-6 font-semibold text-center">Open Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredSupervisors.map((s) => {
                const initials = s.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
                return (
                  <tr key={s.id} className="hover:bg-zinc-50/20 transition-colors">
                    {/* Supervisor name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(s.name)}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{s.name}</div>
                          <div className="text-[10px] text-zinc-400">{s.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Venture */}
                    <td className="py-4 px-6 text-zinc-800 font-semibold">
                      {s.venture}
                    </td>

                    {/* Site */}
                    <td className="py-4 px-6 text-zinc-500 font-mono">
                      {s.site}
                    </td>

                    {/* Employees count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      {s.employees}
                    </td>

                    {/* Daily reports count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      {s.dailyReports}
                    </td>

                    {/* Open Tasks */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      {s.openTasks}
                    </td>

                    {/* Open issues count */}
                    <td className="py-4 px-6 text-center">
                      {s.openIssues > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200/50">
                          • {s.openIssues}
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

      {/* Modal: Add Supervisor */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Supervisor</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krishna Rao"
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
                <label className="block font-bold text-zinc-700 mb-1">Assigned Venture</label>
                <select
                  value={venture}
                  onChange={(e) => setVenture(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg bg-white"
                >
                  <option value="Green Valley Residency">Green Valley Residency</option>
                  <option value="Skyline Heights">Skyline Heights</option>
                  <option value="Riverfront Towers">Riverfront Towers</option>
                  <option value="Sunrise Villas">Sunrise Villas</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Site Location</label>
                <input
                  type="text"
                  placeholder="e.g. GVR — Tower A"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Save Supervisor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
