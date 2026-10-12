import React from 'react';
import prisma from '@/lib/db';
import MaterialTransactionsClient from './MaterialTransactionsClient';

export const revalidate = 0;

export default async function MaterialTransactionsPage() {
  let dbTransactions: any[] = [];
  try {
    dbTransactions = await prisma.materialTransaction.findMany({
      include: {
        material: {
          include: { unitOfMeasure: true }
        },
        venture: true,
        performedBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Failed to load transaction ledger logs:', err);
  }

  const transactions = dbTransactions.map((tx: any) => ({
    id: tx.id,
    txNumber: tx.transactionNumber,
    type: tx.transactionType,
    materialName: tx.material?.name || 'Cement',
    uom: tx.material?.unitOfMeasure?.name || 'Bags',
    ventureName: tx.venture?.name || 'Green Heights',
    quantity: tx.quantityIn > 0 ? `+${tx.quantityIn}` : `-${tx.quantityOut}`,
    date: tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Just now',
    performedBy: tx.performedBy?.name || 'System'
  }));

  return <MaterialTransactionsClient transactions={transactions} />;
}
