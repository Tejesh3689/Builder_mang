'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function UsersTableClient({ users }: { users: UserItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-2xs w-full sm:max-w-md focus-within:ring-1 focus-within:ring-zinc-400 focus-within:border-zinc-400 transition-all">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs w-full text-zinc-800 placeholder-zinc-400"
          />
        </div>
        <Link
          href="/admin/users/new"
          className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add User
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {paginated.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-zinc-900 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-3.5 text-zinc-600 whitespace-nowrap font-mono">{user.email}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[11px] font-semibold">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="text-amber-700 hover:text-amber-800 font-semibold mr-4 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/users/${user.id}/delete`}
                      className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    No users matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
