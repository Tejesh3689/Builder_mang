import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function WorkforceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  
  if ((user as any).role !== 'ADMIN') {
    const { hasPermission } = await import('@/lib/permissions');
    // Workforce requires at least employees:view
    if (!hasPermission((user as any).role, 'employees:view')) {
      redirect('/unauthorized');
    }
  }
  
  return <>{children}</>;
}
