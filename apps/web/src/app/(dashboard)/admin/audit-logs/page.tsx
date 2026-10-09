import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ date?: string, page?: string }> }) {
  await requireAuth();

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const dateStr = params.date;

  // Return 400 if date query param is present but not a valid date string
  if (dateStr && isNaN(new Date(dateStr).getTime())) {
    return new Response('Invalid date parameter', { status: 400 });
  }
  const skip = (page - 1) * 100;
  
  const where: any = {};
  if (dateStr && !isNaN(new Date(dateStr).getTime())) {
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23,59,59,999);
    where.createdAt = { gte: startOfDay, lte: endOfDay };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      venture: true
    },
    skip,
    take: 100 // Limit for performance
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
        <Link href="/admin/audit-logs/filter" className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 inline-block self-start">Filter Logs</Link>
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
                    {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
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
