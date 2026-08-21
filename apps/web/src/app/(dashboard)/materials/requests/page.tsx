import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft, Clock, ShoppingBag } from 'lucide-react';

export const revalidate = 0;

export default async function MaterialRequestsPage() {
  let dbRequests: any[] = [];
  try {
    dbRequests = await prisma.materialRequest.findMany({
      include: {
        venture: true,
        createdBy: {
          select: { name: true }
        },
        items: {
          include: {
            material: {
              include: { unitOfMeasure: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Failed to load material requests:', err);
  }

  const requests = dbRequests.length > 0
    ? dbRequests.map((r: any) => ({
        id: r.id,
        reqNumber: r.requestNumber,
        ventureName: r.venture?.name || 'Green Heights',
        items: r.items?.map((item: any) => `${item.material?.name} (${item.requestedQuantity} ${item.material?.unitOfMeasure?.name})`).join(', ') || 'OPC Cement',
        status: r.status,
        requestedBy: r.createdBy?.name || 'Suresh PM',
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'
      }))
    : [
        { id: 'req-1', reqNumber: 'REQ-001', ventureName: 'Green Heights Luxury Apartments', items: 'OPC Cement 53 Grade (100 Bags)', status: 'PENDING_APPROVAL', requestedBy: 'Suresh PM', date: '20 Feb 2026' }
      ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ISSUED':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 w-full text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Materials
          </Link>
          <h1 className="text-lg font-extrabold text-black tracking-tight mt-1">Material Requests</h1>
          <p className="text-xs text-zinc-500">View and approve material requisition tickets from site operations teams</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Request Inbox</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                <th className="py-3 px-6 font-semibold">Request ID</th>
                <th className="py-3 px-6 font-semibold">Project Venture</th>
                <th className="py-3 px-6 font-semibold">Items Requested</th>
                <th className="py-3 px-6 font-semibold">Requested By</th>
                <th className="py-3 px-6 font-semibold">Date Submitted</th>
                <th className="py-3 px-6 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {requests.map((r: any) => (
                <tr key={r.id} className="hover:bg-zinc-50/20 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-black">{r.reqNumber}</td>
                  <td className="py-3.5 px-6 font-medium text-zinc-700">{r.ventureName}</td>
                  <td className="py-3.5 px-6 text-zinc-900 font-bold max-w-xs truncate">{r.items}</td>
                  <td className="py-3.5 px-6 text-zinc-500 font-medium">{r.requestedBy}</td>
                  <td className="py-3.5 px-6 text-zinc-400 font-mono text-[11px]">{r.date}</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400 text-xs">No pending or completed material request tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
