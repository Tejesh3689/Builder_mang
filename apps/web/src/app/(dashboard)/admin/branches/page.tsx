import React from 'react';
import Link from 'next/link';

const mockBranches = [
  { id: 'BR-01', name: 'Headquarters', location: 'New York, NY', manager: 'Admin Manager', contact: '+1 (555) 123-4567' },
  { id: 'BR-02', name: 'West Coast Office', location: 'Los Angeles, CA', manager: 'Sarah Smith', contact: '+1 (555) 987-6543' },
  { id: 'BR-03', name: 'Central Hub', location: 'Chicago, IL', manager: 'Michael Brown', contact: '+1 (555) 456-7890' },
];

export default function BranchesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Cat-C: header stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Branches / Locations</h1>
        <Link href="/admin/branches/new" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start">Add Branch</Link>
      </div>

      {/* Cat-B: overflow-x-auto wrapper added */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Branch Name</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Manager</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {mockBranches.map(branch => (
                <tr key={branch.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{branch.name}</td>
                  <td className="px-6 py-4">{branch.location}</td>
                  <td className="px-6 py-4">{branch.manager}</td>
                  <td className="px-6 py-4">{branch.contact}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/branches/${branch.id}`} className="text-amber-600 hover:text-amber-800 font-semibold">View</Link>
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
