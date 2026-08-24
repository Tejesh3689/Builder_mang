import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LeaveClient from './LeaveClient';

export const revalidate = 0;

export default async function LeavePage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const sessionName = session?.user?.name || '';

  return <LeaveClient userRole={userRole} sessionName={sessionName} />;
}
