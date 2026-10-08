import React from 'react';
import { requireAuth } from '@/lib/authorization';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  
  if ((user as any).role !== 'ADMIN') {
    const { hasPermission } = await import('@/lib/permissions');
    // Onboarding requires employees:edit
    if (!hasPermission((user as any).role, 'employees:edit')) {
      redirect('/unauthorized');
    }
  }
  
  return <>{children}</>;
}
