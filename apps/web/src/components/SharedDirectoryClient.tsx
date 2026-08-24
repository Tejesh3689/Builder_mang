'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface SharedDirectoryClientProps {
  title: string;
  subtitle: string;
  addLabel: string;
  roleFilterFn: (employee: any) => boolean;
  tableHeaders: React.ReactNode;
  renderRow: (employee: any, allEmployees: any[], getAvatarColor: (name: string) => string) => React.ReactNode;
  renderAddModal: (
    show: boolean,
    onClose: () => void,
    ventures: any[],
    onAddSuccess: () => void
  ) => React.ReactNode;
}

export default function SharedDirectoryClient({
  title,
  subtitle,
  addLabel,
  roleFilterFn,
  tableHeaders,
  renderRow,
  renderAddModal
}: SharedDirectoryClientProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
      console.error('Failed loading directory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = employees.filter((e) => {
    const isRoleMatch = roleFilterFn(e);
    const matchesSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return isRoleMatch && matchesSearch;
  });

  const getAvatarColor = (name: string) => {
    const char = name.charCodeAt(0) % 5;
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
        Loading {title}...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight">{title}</h1>
        <div className="text-xs text-zinc-500 font-medium">{subtitle}</div>
      </div>

      {/* Search & Actions Panel */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-xs w-full sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-hidden text-xs w-full text-zinc-800 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          {addLabel}
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              {tableHeaders}
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredEmployees.map((emp) => renderRow(emp, employees, getAvatarColor))}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-zinc-400 text-xs">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderAddModal(showAddModal, () => setShowAddModal(false), ventures, fetchData)}
    </div>
  );
}
