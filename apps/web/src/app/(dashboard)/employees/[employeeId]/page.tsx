import React from 'react';
import EmployeeProfileClient from './EmployeeProfileClient';

export const revalidate = 0;

export default async function EmployeeDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  return <EmployeeProfileClient employeeId={empId} />;
}
