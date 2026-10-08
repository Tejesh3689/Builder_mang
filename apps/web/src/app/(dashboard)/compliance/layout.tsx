import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function ComplianceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  
  if ((user as any).role !== 'ADMIN') {
    const { hasPermission } = await import('@/lib/permissions');
    if (!hasPermission((user as any).role, 'compliance:view')) {
      redirect('/unauthorized');
    }
  }
  
  return <>{children}</>;
}
