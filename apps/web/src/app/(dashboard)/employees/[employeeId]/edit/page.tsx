import React from 'react';
import EditEmployeeForm from './EditEmployeeForm';

export const revalidate = 0;

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  return <EditEmployeeForm employeeId={empId} />;
}
