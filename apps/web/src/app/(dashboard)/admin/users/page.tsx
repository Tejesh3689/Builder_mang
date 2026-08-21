import React from 'react';
import Link from 'next/link';

const mockUsers = [
  { id: 'USR-001', name: 'Admin Manager', email: 'admin@builder.com', role: 'Super Admin', status: 'Active' },
  { id: 'USR-002', name: 'John Doe', email: 'john@builder.com', role: 'Project Manager', status: 'Active' },
  { id: 'USR-003', name: 'Jane Smith', email: 'jane@builder.com', role: 'Supervisor', status: 'Inactive' },
  { id: 'USR-004', name: 'Mike Johnson', email: 'mike@builder.com', role: 'Site Manager', status: 'Active' },
];

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
        <Link href="/admin/users/new" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start">Add User</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {mockUsers.map(user => (
                <tr key={user.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                    }`}>{user.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link href={`/admin/users/${user.id}/edit`} className="text-amber-600 hover:text-amber-800 font-semibold mr-3">Edit</Link>
                    <Link href={`/admin/users/${user.id}/delete`} className="text-red-600 hover:text-red-800 font-semibold">Delete</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
