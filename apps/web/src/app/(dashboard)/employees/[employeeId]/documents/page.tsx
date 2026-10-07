import { redirect } from 'next/navigation';

// The document vault lives on the employee profile (real uploads + downloads).
export default async function EmployeeDocumentsPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  redirect(`/employees/${employeeId}`);
}
