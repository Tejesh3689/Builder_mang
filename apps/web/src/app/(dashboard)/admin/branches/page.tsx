import React from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/authorization';

export default async function BranchesPage() {
  await requireAuth();

  // Branch management is not yet supported in the database schema.
  const branches: any[] = [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Branches / Locations</h1>
        <Link href="/admin/branches/new" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start opacity-50 cursor-not-allowed pointer-events-none">Add Branch</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm p-12 text-center">
        <h3 className="text-lg font-medium text-zinc-900 mb-2">Branch Management</h3>
        <p className="text-zinc-500">Branch management functionality is coming soon.</p>
      </div>
    </div>
  );
}
