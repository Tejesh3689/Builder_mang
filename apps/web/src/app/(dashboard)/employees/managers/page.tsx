'use client';

import React, { useState } from 'react';
import SharedDirectoryClient from '@/components/SharedDirectoryClient';
import { X } from 'lucide-react';

export default function ManagersDirectoryPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [managerRole, setManagerRole] = useState('Project Manager');

  const handleAddSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
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
        email: email || `${firstName.toLowerCase()}@builder.com`,
        designation: managerRole,
        department: 'Management',
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
        setEmail('');
        setSelectedVentureId('');
        onSuccess();
      }
    } catch (err) {
      console.error('Failed adding manager:', err);
    }
  };

  const renderAddModal = (show: boolean, onClose: () => void, ventures: any[], onAddSuccess: () => void) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <form onSubmit={(e) => handleAddSubmit(e, () => { onClose(); onAddSuccess(); })} className="bg-white rounded-t-2xl sm:rounded-2xl border border-zinc-200 shadow-lg p-5 sm:p-6 w-full sm:max-w-md space-y-4 max-h-[90dvh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Manager Account</h3>
            <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Arjun Reddy"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-zinc-200 p-2 rounded-lg text-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Manager Role Type</label>
              <select
                value={managerRole}
                onChange={(e) => setManagerRole(e.target.value)}
                className="w-full border border-zinc-200 p-2 bg-zinc-50 rounded-lg text-black focus:outline-none"
              >
                <option value="Project Manager">Project Manager</option>
                <option value="Project Director">Project Director</option>
                <option value="Construction Manager">Construction Manager</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Purchase Manager">Purchase Manager</option>
              </select>
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
              <label className="block font-bold text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. arjun.reddy@naprocs.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-zinc-200 p-2 rounded-lg text-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-700 mb-1">Initial Project Assignment</label>
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
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg shadow-xs"
            >
              Save Manager
            </button>
          </div>
        </form>
      </div>
    );
  };

  const tableHeaders = (
    <tr className="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/20">
      <th className="py-3 px-6 font-semibold">Manager</th>
      <th className="py-3 px-6 font-semibold">Ventures Managed</th>
      <th className="py-3 px-6 font-semibold text-center">Supervisors</th>
      <th className="py-3 px-6 font-semibold text-center">Employees</th>
      <th className="py-3 px-6 font-semibold text-center">Open Issues</th>
      <th className="py-3 px-6 font-semibold text-center">Pending Requests</th>
    </tr>
  );

  const renderRow = (m: any, allEmployees: any[], getAvatarColor: (name: string) => string) => {
    const fullNameStr = `${m.firstName} ${m.lastName}`;
    const initials = fullNameStr.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    const activeVentures = m.assignments?.map((a: any) => a.venture?.name).filter(Boolean) || [];
    const activeVentureIds = m.assignments?.map((a: any) => a.ventureId) || [];

    const supervisorsCount = allEmployees.filter((other) => {
      const isSup = other.designation.toLowerCase().includes('supervisor');
      if (!isSup) return false;
      return other.assignments?.some((asgn: any) => activeVentureIds.includes(asgn.ventureId));
    }).length;

    const employeesCount = allEmployees.filter((other) => {
      const des = other.designation.toLowerCase();
      const isSpecial = des.includes('manager') || des.includes('pm') || des.includes('director');
      if (isSpecial) return false;
      return other.assignments?.some((asgn: any) => activeVentureIds.includes(asgn.ventureId));
    }).length;

    return (
      <tr key={m.id} className="hover:bg-zinc-50/20 transition-colors">
        <td className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(fullNameStr)}`}>
              {initials}
            </div>
            <div>
              <div className="font-bold text-zinc-900">{fullNameStr}</div>
              <div className="text-[10px] text-zinc-400">{m.email}</div>
            </div>
          </div>
        </td>
        <td className="py-4 px-6 text-zinc-700 font-medium">
          {activeVentures.join(', ') || 'No active ventures'}
        </td>
        <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
          {supervisorsCount}
        </td>
        <td className="py-4 px-6 text-center text-zinc-700 font-mono font-medium">
          {employeesCount}
        </td>
        <td className="py-4 px-6 text-center">
          <span className="text-zinc-450 font-mono">0</span>
        </td>
        <td className="py-4 px-6 text-center">
          <span className="text-zinc-450 font-mono">0</span>
        </td>
      </tr>
    );
  };

  const roleFilterFn = (e: any) => {
    const des = e.designation.toLowerCase();
    return des.includes('manager') || des.includes('pm') || des.includes('director');
  };

  return (
    <SharedDirectoryClient
      title="Managers"
      subtitle="Directory"
      addLabel="+ Add Manager"
      roleFilterFn={roleFilterFn}
      tableHeaders={tableHeaders}
      renderRow={renderRow}
      renderAddModal={renderAddModal}
    />
  );
}
