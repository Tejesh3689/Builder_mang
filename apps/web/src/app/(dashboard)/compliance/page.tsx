'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalEmployees, EmployeeProfile } from '@/lib/mockDatabase';

export default function CompliancePage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activeTab, setActiveTab] = useState('Certifications');

  useEffect(() => {
    setEmployees(getLocalEmployees());
  }, []);

  const activeStaff = employees.filter((e) => e.onboardingStage === 'Active');

  // 1. Calculations
  const allCerts = activeStaff.flatMap((emp) =>
    emp.certifications.map((c) => ({
      ...c,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      employeeId: emp.id
    }))
  );

  const expiredCerts = allCerts.filter((c) => c.status === 'Expired');
  const expiringSoonCerts = allCerts.filter((c) => c.status === 'Expiring Soon');

  // Missing documents: active employees with 0 documents
  const missingDocsStaff = activeStaff.filter((e) => e.documents.length === 0);

  // Pending safety induction: active employees with 0 safety training log items
  const pendingInductions = activeStaff.filter((e) => e.trainingSafety.length === 0);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Compliance Vault</h1>
          <p className="text-xs text-zinc-500 mt-1">Registry for licensing, compliance, and training safety records</p>
        </div>
      </div>

      {/* Stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Expired Certificates</div>
          <div className="text-2xl font-black text-red-600 tracking-tight">{expiredCerts.length} Issues</div>
          <div className="text-[10px] text-red-500">Requires renewal action</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Expiring Soon</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{expiringSoonCerts.length} Warning</div>
          <div className="text-[10px] text-amber-500">Expires in 30 days</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Missing Documents</div>
          <div className="text-2xl font-black text-zinc-700 tracking-tight">{missingDocsStaff.length} Employees</div>
          <div className="text-[10px] text-zinc-400">0 files uploaded</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Safety Training Pending</div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">{pendingInductions.length} Personnel</div>
          <div className="text-[10px] text-blue-500">Awaiting induction</div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto">
          {['Certifications', 'Missing Documents', 'Safety Training Log'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none shrink-0 ${
                activeTab === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-zinc-400 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="p-6">
          {activeTab === 'Certifications' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Professional Certifications</h3>

              <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2.5 px-4">Certification Title</th>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Verification ID</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {allCerts.map((c, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-zinc-900">{c.certification}</td>
                        <td className="py-3 px-4">{c.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{c.expiryDate}</td>
                        <td className="py-3 px-4 text-zinc-700 font-mono">{c.certificateNo}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            c.status === 'Valid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'Expired'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {allCerts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">No safety certifications found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Missing Documents' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Missing Required Documents</h3>
              <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Employee ID</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Missing Item</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {missingDocsStaff.map((emp) => (
                      <tr key={emp.id} className="hover:bg-zinc-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-zinc-900">{emp.firstName} {emp.lastName}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{emp.employeeId}</td>
                        <td className="py-3 px-4">{emp.designation}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">Aadhaar Card / Contract Copy</td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/employees/${emp.id}`} className="text-amber-700 font-bold hover:underline">Upload Vault</Link>
                        </td>
                      </tr>
                    ))}
                    {missingDocsStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">All active personnel have verified documents.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Safety Training Log' && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Safety Training Inductions</h3>
              <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Employee ID</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Induction Phase</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pendingInductions.map((emp) => (
                      <tr key={emp.id} className="hover:bg-zinc-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-zinc-900">{emp.firstName} {emp.lastName}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{emp.employeeId}</td>
                        <td className="py-3 px-4">{emp.designation}</td>
                        <td className="py-3 px-4 text-amber-600 font-medium">Pending Heights & Scaffold Safety</td>
                        <td className="py-3 px-4 text-center">
                          <Link href={`/employees/${emp.id}`} className="text-amber-700 font-bold hover:underline">Complete Induction</Link>
                        </td>
                      </tr>
                    ))}
                    {pendingInductions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">All active personnel have safety clearances.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
