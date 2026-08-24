'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Building2, Phone } from 'lucide-react';

export default function SupervisorsDirectoryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [siteText, setSiteText] = useState('Site A');

  const fetchData = async () => {
    try {
      const [empRes, venRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/ventures')
      ]);
      const empData = await empRes.json();
      const venData = await venRes.json();
      if (empData.success) setEmployees(empData.data);
      if (venData.success) setVentures(venData.data);
    } catch (err) {
      console.error('Failed loading supervisors data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const supervisors = employees.filter((e) => {
    const isSup = e.designation.toLowerCase().includes('supervisor');
    const matchesSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return isSup && matchesSearch;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        firstName,
        lastName,
        phone,
        email: `${firstName.toLowerCase()}.supervisor@builder.com`,
        designation: 'Supervisor',
        department: 'Site Operations',
        status: 'ACTIVE',
        onboardingStage: 'Active',
        onboardingStatus: 'Active',
        joiningDate: new Date().toISOString().split('T')[0],
        ventureId: selectedVentureId || 'none'
      };

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFullName('');
        setPhone('+91 ');
        setSelectedVentureId('');
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed adding supervisor:', err);
    }
  };

  const getAvatarColor = (supName: string) => {
    const char = supName.charCodeAt(0) % 5;
    const colors = [
      'bg-amber-600/10 text-amber-700 border-amber-200/60',
      'bg-amber-500/10 text-amber-700 border-amber-200/60',
      'bg-zinc-100 text-zinc-700 border-zinc-200/60',
      'bg-amber-700/10 text-amber-800 border-amber-200/60',
      'bg-zinc-200 text-zinc-800 border-zinc-300/60',
    ];
    return colors[char];
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Loading Supervisors Directory...
      </div>
    );
  }

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
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search supervisors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-hidden text-xs w-full text-zinc-800 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          + Add Supervisor
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
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
              {supervisors.map((s) => {
                const fullNameStr = `${s.firstName} ${s.lastName}`;
                const initials = fullNameStr.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

                const activeAssignment = s.assignments?.find((a: any) => a.status === 'ACTIVE');
                const ventureName = activeAssignment?.venture?.name || 'Unassigned';
                const siteName = activeAssignment?.roleAtSite || '—';

                return (
                  <tr key={s.id} className="hover:bg-zinc-50/20 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(fullNameStr)}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{fullNameStr}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{s.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Venture */}
                    <td className="py-4 px-6 text-zinc-700 font-medium">
                      {ventureName}
                    </td>

                    {/* Site */}
                    <td className="py-4 px-6 text-zinc-500">
                      {siteName}
                    </td>

                    {/* Employees count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      4
                    </td>

                    {/* Daily reports count */}
                    <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
                      12
                    </td>

                    {/* Open tasks */}
                    <td className="py-4 px-6 text-center">
                      <span className="text-zinc-400 font-mono">0</span>
                    </td>

                    {/* Open issues */}
                    <td className="py-4 px-6 text-center">
                      <span className="text-zinc-400 font-mono">0</span>
                    </td>
                  </tr>
                );
              })}

              {supervisors.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-400 text-xs">No supervisor accounts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supervisor */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-t-2xl sm:rounded-2xl border border-zinc-200 shadow-lg p-5 sm:p-6 w-full sm:max-w-md space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Supervisor Account</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg text-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg text-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Assigned Project</label>
                <select
                  value={selectedVentureId}
                  onChange={(e) => setSelectedVentureId(e.target.value)}
                  className="w-full border border-zinc-200 p-2 bg-zinc-50 rounded-lg text-black focus:outline-none"
                >
                  <option value="">None (Unassigned)</option>
                  {ventures.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg shadow-xs"
              >
                Save Supervisor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
