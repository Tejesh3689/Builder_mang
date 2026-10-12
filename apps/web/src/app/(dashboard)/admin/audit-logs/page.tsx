import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authorization';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ date?: string, page?: string }> }) {
  await requireAuth();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const pageSize = 25;
  const dateStr = params.date;

  if (dateStr && isNaN(new Date(dateStr).getTime())) {
    return <div className="p-6 text-red-600">Invalid date parameter</div>;
  }
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  if (dateStr && !isNaN(new Date(dateStr).getTime())) {
    const startOfDay = new Date(dateStr);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(dateStr);
    endOfDay.setUTCHours(23,59,59,999);
    where.createdAt = { gte: startOfDay, lte: endOfDay };
  }

  const [totalCount, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        venture: true
      },
      skip,
      take: pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : skip + 1;
  const endItem = Math.min(totalCount, skip + logs.length);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Audit Logs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Immutable record of system actions and permission activity</p>
        </div>
        <Link href="/admin/audit-logs/filter" className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold hover:bg-zinc-50 inline-block self-start shadow-2xs transition-colors">Filter Logs</Link>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">User</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Action Performed</th>
                <th className="px-6 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-3.5 whitespace-nowrap font-mono text-zinc-500">
                    {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </td>
                  <td className="px-6 py-3.5 font-bold text-zinc-900 whitespace-nowrap">{log.user?.name || 'System'}</td>
                  <td className="px-6 py-3.5 font-semibold text-zinc-800 whitespace-nowrap">{log.action}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-zinc-600 break-all">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalCount > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 bg-white border-t border-zinc-100 text-xs text-zinc-500 font-sans">
            <div className="font-mono text-[11px] text-zinc-500">
              Showing <span className="font-bold text-zinc-800">{startItem}</span>–<span className="font-bold text-zinc-800">{endItem}</span> of <span className="font-bold text-zinc-800">{totalCount}</span> logs
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/audit-logs?page=${page - 1}${dateStr ? `&date=${dateStr}` : ''}`}
                className={`p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-2xs ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <div className="px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200/60 font-mono text-[11px] font-bold text-zinc-800">
                {page} / {totalPages}
              </div>
              <Link
                href={`/admin/audit-logs?page=${page + 1}${dateStr ? `&date=${dateStr}` : ''}`}
                className={`p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-2xs ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
