import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  
  if ((user as any).role !== 'ADMIN') {
    redirect('/unauthorized');
  }
  
  return <>{children}</>;
}
