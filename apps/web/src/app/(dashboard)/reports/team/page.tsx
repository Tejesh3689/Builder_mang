import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TeamReportsClient from './TeamReportsClient';

export const revalidate = 0;

export default async function TeamReportsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';
  const sessionName = session?.user?.name || '';

  return <TeamReportsClient userRole={userRole} sessionName={sessionName} />;
}
