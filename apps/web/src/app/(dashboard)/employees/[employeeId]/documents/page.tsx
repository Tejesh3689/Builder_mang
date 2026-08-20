import React from 'react';
import Link from 'next/link';

export default async function EmployeeDocumentsPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const resolvedParams = await params;
  const empId = resolvedParams?.employeeId || 'emp-001';
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href={`/employees/${empId}`} className="text-xs text-amber-700 hover:underline">← Back to Profile</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Document Vault: {empId.toUpperCase()}</h1>
      </div>

      <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-4">
        <h3 className="text-lg font-semibold">Uploaded Files</h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex justify-between items-center text-sm">
            <span>Identification_ID.pdf</span>
            <span className="text-xs text-amber-700 hover:underline cursor-pointer">Download</span>
          </div>
        </div>
      </div>
    </div>
  );
}
