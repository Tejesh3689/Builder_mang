import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import MaterialsListClient from './MaterialsListClient';

export const revalidate = 0;

export default async function MaterialsListPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';

  let materialsData: any[] = [];

  try {
    const materials = await prisma.material.findMany({
      include: {
        category: true,
        unitOfMeasure: true,
        stocks: {
          include: {
            stockLocation: true,
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    materialsData = materials.map((m: any) => {
      // Calculate totals
      let available = 0;
      let reserved = 0;
      let primaryLocation = 'Main Store';
      
      if (m.stocks && m.stocks.length > 0) {
        // Find the location with the most stock
        const sortedStocks = [...m.stocks].sort((a: any, b: any) => Number(b.availableQuantity) - Number(a.availableQuantity));
        available = m.stocks.reduce((sum: number, s: any) => sum + Number(s.availableQuantity || 0), 0);
        reserved = m.stocks.reduce((sum: number, s: any) => sum + Number(s.reservedQuantity || 0), 0);
        primaryLocation = sortedStocks[0].stockLocation?.name || 'Main Store';
      }

      const minLevel = Number(m.reorderLevel || 0);
      let status = 'Healthy';
      if (available === 0 && minLevel > 0) {
        status = 'Critical';
      } else if (available <= minLevel / 2) {
        status = 'Critical';
      } else if (available <= minLevel) {
        status = 'Low Stock';
      }

      // Format last movement
      let lastMovementStr = 'No movement';
      if (m.transactions && m.transactions.length > 0) {
        const lastTxDate = new Date(m.transactions[0].createdAt);
        const diffMs = new Date().getTime() - lastTxDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffHours < 1) {
          lastMovementStr = 'Just now';
        } else if (diffHours < 24) {
          lastMovementStr = `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
          lastMovementStr = 'Yesterday';
        } else {
          lastMovementStr = `${diffDays} days ago`;
        }
      }

      return {
        id: m.id,
        name: m.name,
        sku: m.skuCode || '-',
        category: m.category?.name || 'Uncategorized',
        unit: m.unitOfMeasure?.name || 'Unit',
        available: available,
        reserved: reserved,
        minLevel: minLevel,
        location: primaryLocation,
        status: status,
        lastMovement: lastMovementStr
      };
    });
  } catch (error) {
    console.error('Error fetching materials list:', error);
  }

  // Remove fallback dummy data to ensure DB truth

  return (
    <div className="w-full text-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-black tracking-tight flex items-center gap-2">
          Materials
        </h1>
        <p className="text-[13px] text-zinc-500 font-mono">Master list</p>
      </div>

      <MaterialsListClient initialData={materialsData} />
    </div>
  );
}
