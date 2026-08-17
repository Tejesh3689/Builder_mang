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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Venture Management</h1>
              <p className="text-xs text-slate-400">Central operational containers for construction projects, budgets, site teams, and logistics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Create Venture
          </button>

          <button className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Data
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ventures by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
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

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
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
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Venture Listing */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading operational ventures...</div>
      ) : ventures.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No ventures found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filter search criteria or create a new venture.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Venture & Code</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Manager</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Est. Budget</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ventures.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <Link href={`/ventures/${v.id}`} className="font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                          {v.name}
                        </Link>
                        <span className="text-[11px] font-mono text-indigo-400/80">{v.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{v.siteCity || v.regCity || 'Vijayawada'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800">
                        {v.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {v.projectManager ? `${v.projectManager.firstName} ${v.projectManager.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-white">{v.progressPercentage || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                            style={{ width: `${v.progressPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-200">
                      ₹{((v.estimatedBudget || 0) / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${v.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : v.status === 'PLANNING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                        ● {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/ventures/${v.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
                      >
                        Open Workspace <ArrowUpRight className="w-3.5 h-3.5" />
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
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">{v.code}</span>
                    <h3 className="text-base font-bold text-white hover:text-indigo-400 transition-colors">
                      <Link href={`/ventures/${v.id}`}>{v.name}</Link>
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                    {v.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{v.description || 'No description provided.'}</p>

                <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{v.siteCity || 'Vijayawada'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{v._count?.assignments || 12} Members</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-semibold text-white">{v.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                      style={{ width: `${v.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-900 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Est. Budget</span>
                  <span className="font-bold text-emerald-400">₹{((v.estimatedBudget || 0) / 10000000).toFixed(2)} Cr</span>
                </div>
                <Link
                  href={`/ventures/${v.id}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  Workspace <ArrowUpRight className="w-3.5 h-3.5" />
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

