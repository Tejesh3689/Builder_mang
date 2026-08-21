import React from 'react';
import Link from 'next/link';

const mockLogs = [
  { id: 'LOG-900', time: '10:32 AM', user: 'Admin Manager', action: 'Updated System Settings', ip: '192.168.1.10' },
  { id: 'LOG-899', time: '09:15 AM', user: 'John Doe', action: 'Approved Project Budget - PRJ-101', ip: '10.0.0.54' },
  { id: 'LOG-898', time: 'Yesterday', user: 'System', action: 'Automated Database Backup', ip: 'localhost' },
  { id: 'LOG-897', time: 'Yesterday', user: 'Sarah Smith', action: 'Logged in', ip: '172.16.0.4' },
];

export default function AuditLogsPage() {
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
                <th className="px-6 py-4 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {mockLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-500">{log.time}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{log.user}</td>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
