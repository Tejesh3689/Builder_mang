'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function MaterialsListClient({ initialData }: { initialData: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const filteredData = initialData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Healthy':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Low Stock':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Critical':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch(status) {
      case 'Healthy':
        return 'bg-emerald-500';
      case 'Low Stock':
        return 'bg-amber-500';
      case 'Critical':
        return 'bg-red-500';
      default:
        return 'bg-zinc-400';
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search materials by name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          >
            <option>All Categories</option>
            <option>Cement</option>
            <option>Steel</option>
            <option>Sand</option>
            <option>Bricks</option>
            <option>Aggregate</option>
            <option>Paint</option>
            <option>Electrical</option>
            <option>Plumbing</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          >
            <option>All Status</option>
            <option>Healthy</option>
            <option>Low Stock</option>
            <option>Critical</option>
          </select>
        </div>
        <Link 
          href="/materials/new"
          className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white font-semibold text-[13px] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Material
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white border-b border-zinc-200 text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              <th className="px-5 py-3 font-semibold">Material</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Unit</th>
              <th className="px-5 py-3 font-semibold">Available</th>
              <th className="px-5 py-3 font-semibold">Reserved</th>
              <th className="px-5 py-3 font-semibold">Min Level</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-5 py-3 font-semibold text-center">Status</th>
              <th className="px-5 py-3 font-semibold">Last Movement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-[13px]">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors group">
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="font-extrabold text-zinc-900 group-hover:text-[#d97706] transition-colors">{item.name}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-500 font-mono text-[11px] font-medium tracking-wide">
                  {item.sku}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-700 font-medium">
                  {item.category}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-500">
                  {item.unit}
                </td>
                <td className="px-5 py-4 whitespace-nowrap font-bold text-zinc-900">
                  {item.available}
                </td>
                <td className="px-5 py-4 whitespace-nowrap font-bold text-zinc-700">
                  {item.reserved}
                </td>
                <td className="px-5 py-4 whitespace-nowrap font-bold text-zinc-700">
                  {item.minLevel}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-600 font-medium text-xs">
                  {item.location}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(item.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(item.status)}`}></span>
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-500 text-xs font-medium">
                  {item.lastMovement}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-zinc-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="text-sm font-semibold">No materials found.</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
