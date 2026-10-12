import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { ArrowLeft } from 'lucide-react';
import MaterialRequestsClient from './MaterialRequestsClient';

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

  const requests = dbRequests.map((r: any) => ({
    id: r.id,
    reqNumber: r.requestNumber,
    ventureName: r.venture?.name || 'Unassigned Venture',
    items: r.items?.map((item: any) => `${item.material?.name} (${item.requestedQuantity} ${item.material?.unitOfMeasure?.name || 'units'})`).join(', ') || 'N/A',
    status: r.status,
    requestedBy: r.createdBy?.name || 'Site Staff',
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Materials
          </Link>
          <h1 className="text-xl font-extrabold text-black tracking-tight mt-1">Material Requests</h1>
          <p className="text-xs text-zinc-500">View, track, and manage requisition tickets submitted across all venture sites</p>
        </div>
      </div>

      <MaterialRequestsClient requests={requests} />
    </div>
  );
}
