'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Search, Filter, LayoutGrid, LayoutList,
  MapPin, Calendar, Users, TrendingUp, ShieldAlert, ArrowUpRight, FileSpreadsheet
} from 'lucide-react';
import { CreateVentureWizard } from '@/components/ventures/CreateVentureWizard';

export default function VenturesPage() {
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchVentures = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (typeFilter !== 'ALL') query.append('type', typeFilter);

      const res = await fetch(`/api/ventures?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVentures(data.data);
      }
    } catch (err) {
      console.error('Failed fetching ventures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentures();
  }, [search, statusFilter, typeFilter]);

  const handleVentureCreated = (newVenture: any) => {
    // Re-fetch full list from DB so relational data (manager, _count) is complete
    fetchVentures();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Venture Management</h1>
              <p className="text-xs text-zinc-500">Central operational containers for construction projects, budgets, site teams, and logistics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Create Venture
          </button>

          <button className="px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Data
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search ventures by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNING">Planning</option>
              <option value="DRAFT">Draft</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Venture Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="VILLA">Villa</option>
              <option value="APARTMENT">Apartment</option>
              <option value="PLOT_DEVELOPMENT">Plot Development</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-zinc-50 border border-zinc-200 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-black text-white' : 'text-zinc-400 hover:text-zinc-655 hover:bg-zinc-100'}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-black text-white' : 'text-zinc-400 hover:text-zinc-655 hover:bg-zinc-100'}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Venture Listing */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">Loading operational ventures...</div>
      ) : ventures.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white border border-zinc-200 space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800">No ventures found</h3>
          <p className="text-xs text-zinc-500">Try adjusting your filter search criteria or create a new venture.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50/50 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Venture & Code</th>
                  <th className="px-5 py-3.5 font-semibold">Location</th>
                  <th className="px-5 py-3.5 font-semibold">Type</th>
                  <th className="px-5 py-3.5 font-semibold">Manager</th>
                  <th className="px-5 py-3.5 font-semibold">Progress</th>
                  <th className="px-5 py-3.5 font-semibold">Est. Budget</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ventures.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-50/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <Link href={`/ventures/${v.id}`} className="font-bold text-zinc-900 hover:text-amber-700 transition-colors flex items-center gap-1.5">
                          {v.name}
                        </Link>
                        <span className="text-[11px] font-mono text-zinc-500">{v.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{v.siteCity || v.regCity || 'Vijayawada'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-50 text-zinc-600 border border-zinc-200">
                        {v.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {v.projectManager ? `${v.projectManager.firstName} ${v.projectManager.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-zinc-700">{v.progressPercentage || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${v.progressPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-zinc-800">
                      ₹{((v.estimatedBudget || 0) / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                          : v.status === 'ON_HOLD'
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        ● {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/ventures/${v.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-black text-xs font-semibold shadow-xs transition-colors"
                      >
                        Open Workspace <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ventures.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-xl bg-white border border-zinc-200 space-y-4 hover:border-amber-500/50 transition-all hover:shadow-md flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">{v.code}</span>
                    <h3 className="text-base font-bold text-zinc-900 hover:text-amber-700 transition-colors">
                      <Link href={`/ventures/${v.id}`}>{v.name}</Link>
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    v.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-200'
                  }`}>
                    {v.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2">{v.description || 'No description provided.'}</p>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-100 text-xs text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{v.siteCity || 'Vijayawada'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{v._count?.assignments || 12} Members</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Progress</span>
                    <span className="font-semibold text-zinc-700">{v.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{ width: `${v.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-450 block font-mono">Est. Budget</span>
                  <span className="font-bold text-zinc-800">₹{((v.estimatedBudget || 0) / 10000000).toFixed(2)} Cr</span>
                </div>
                <Link
                  href={`/ventures/${v.id}`}
                  className="px-3 py-1.5 rounded-xl bg-[#d97706] text-white hover:bg-amber-700 font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                >
                  Workspace <ArrowUpRight className="w-3.5 h-3.5 text-zinc-450" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Wizard */}
      <CreateVentureWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleVentureCreated}
      />
    </div>
  );
}

