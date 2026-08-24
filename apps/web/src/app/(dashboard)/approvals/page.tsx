import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ApprovalsClient from './ApprovalsClient';

export const revalidate = 0;

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const sessionName = session?.user?.name || '';

  return <ApprovalsClient userRole={userRole} sessionName={sessionName} />;
}
