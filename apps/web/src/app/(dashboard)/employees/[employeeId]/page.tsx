import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import EmployeeProfileClient from './EmployeeProfileClient';

export const revalidate = 0;

export default async function EmployeeDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'USER';

  return <EmployeeProfileClient employeeId={empId} userRole={userRole} />;
}

