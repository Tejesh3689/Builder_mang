import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export default async function AuditLogsPage() {
  await requireAuth();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      venture: true
    },
    take: 100 // Limit for performance
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
        <Link href="/admin/audit-logs/filter" className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 inline-block self-start opacity-50 cursor-not-allowed pointer-events-none">Filter Logs</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Action Performed</th>
                <th className="px-6 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{log.user?.name || 'System'}</td>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
