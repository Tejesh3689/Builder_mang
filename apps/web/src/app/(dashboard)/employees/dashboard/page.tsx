'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalEmployees, EmployeeProfile } from '@/lib/mockDatabase';

export default function EmployeeDashboard() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);

  useEffect(() => {
    setEmployees(getLocalEmployees());
  }, []);

  // 1. Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active' && e.onboardingStage === 'Active').length;
  const onLeave = employees.filter((e) => e.status === 'On Leave').length;
  const onSite = employees.filter((e) => e.status === 'Active' && e.onboardingStage === 'Active' && e.currentProject !== 'Unassigned').length;
  const onboardingCount = employees.filter((e) => e.onboardingStage !== 'Active').length;
  const unassigned = employees.filter((e) => e.currentProject === 'Unassigned' && e.onboardingStage === 'Active').length;

  // Compliance issues count
  const complianceIssues = employees.reduce((acc, emp) => {
    const expiredCerts = emp.certifications.filter((c) => c.status === 'Expired' || c.status === 'Expiring Soon').length;
    const missingDocs = (emp.documents.length === 0 && emp.onboardingStage === 'Active') ? 1 : 0;
    return acc + expiredCerts + missingDocs;
  }, 0);

  // Workforce distribution by project
  const projectDistribution = employees.reduce((acc: Record<string, number>, emp) => {
    if (emp.onboardingStage === 'Active') {
      const proj = emp.currentProject;
      acc[proj] = (acc[proj] || 0) + 1;
    }
    return acc;
  }, {});

  // Workforce distribution by department
  const deptDistribution = employees.reduce((acc: Record<string, number>, emp) => {
    if (emp.onboardingStage === 'Active') {
      const dept = emp.department;
      acc[dept] = (acc[dept] || 0) + 1;
    }
    return acc;
  }, {});

  // Status distribution
  const statusDistribution = {
    Active: employees.filter((e) => e.status === 'Active' && e.onboardingStage === 'Active').length,
    'On Leave': employees.filter((e) => e.status === 'On Leave').length,
    Onboarding: employees.filter((e) => e.onboardingStage !== 'Active').length,
    Terminated: employees.filter((e) => e.status === 'Terminated').length,
  };

  // Expiring certifications list
  const expiringCertsList = employees.flatMap((emp) =>
    emp.certifications
      .filter((c) => c.status === 'Expired' || c.status === 'Expiring Soon')
      .map((c) => ({
        ...c,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeId: emp.id,
      }))
  );

  // Pending Onboarding list
  const pendingOnboardingList = employees.filter((e) => e.onboardingStage !== 'Active');

  // Recent Joiners list (joined recently or candidate)
  const recentJoiners = [...employees]
    .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate))
    .slice(0, 4);

  // Unassigned employees list
  const unassignedList = employees.filter((e) => e.currentProject === 'Unassigned' && e.onboardingStage === 'Active');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Workforce Analytics</h1>
          <p className="text-xs text-zinc-500 mt-1">Operational view of site personnel, safety compliance, and deployments</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/employees"
            className="px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
          >
            Employee Directory
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Headcount</div>
          <div className="text-2xl font-black text-black tracking-tight">{totalEmployees}</div>
          <div className="text-[9px] text-zinc-400">Master database size</div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Staff</div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{activeEmployees}</div>
          <div className="text-[9px] text-emerald-600">Verification complete</div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Present On Site</div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{onSite}</div>
          <div className="text-[9px] text-amber-600">Actively deployed</div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">On Leave</div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{onLeave}</div>
          <div className="text-[9px] text-amber-600">Out of operations</div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">In Onboarding</div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">{onboardingCount}</div>
          <div className="text-[9px] text-blue-500">Pipeline candidates</div>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unassigned</div>
          <div className="text-2xl font-black text-zinc-600 tracking-tight">{unassigned}</div>
          <div className="text-[9px] text-zinc-400">Awaiting project</div>
        </div>

        {/* Card 7 */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Compliance Alerts</div>
          <div className="text-2xl font-black text-red-600 tracking-tight">{complianceIssues}</div>
          <div className="text-[9px] text-red-500">Expired docs / certs</div>
        </div>
      </div>

      {/* Row 2: Distribution grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project distribution */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Project Headcounts</h3>
          <div className="space-y-3">
            {Object.entries(projectDistribution).map(([proj, count]) => (
              <div key={proj} className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-700 font-medium">
                  <span className="truncate max-w-[200px]">{proj}</span>
                  <span className="font-bold font-mono">{count}</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-zinc-800 h-full rounded-full"
                    style={{ width: `${(count / totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(projectDistribution).length === 0 && (
              <div className="text-center py-6 text-zinc-400 text-xs">No active allocations.</div>
            )}
          </div>
        </div>

        {/* Department distribution */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Department Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(deptDistribution).map(([dept, count]) => (
              <div key={dept} className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-700 font-medium">
                  <span>{dept}</span>
                  <span className="font-bold font-mono">{count}</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#d97706] h-full rounded-full"
                    style={{ width: `${(count / totalEmployees) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Status Distribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 text-center space-y-0.5">
              <div className="text-zinc-400 text-[10px]">Active Staff</div>
              <div className="text-lg font-bold text-emerald-600 font-mono">{statusDistribution.Active}</div>
            </div>
            <div className="p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 text-center space-y-0.5">
              <div className="text-zinc-400 text-[10px]">On Leave</div>
              <div className="text-lg font-bold text-amber-600 font-mono">{statusDistribution['On Leave']}</div>
            </div>
            <div className="p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 text-center space-y-0.5">
              <div className="text-zinc-400 text-[10px]">In Onboarding</div>
              <div className="text-lg font-bold text-blue-600 font-mono">{statusDistribution.Onboarding}</div>
            </div>
            <div className="p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 text-center space-y-0.5">
              <div className="text-zinc-400 text-[10px]">Terminated</div>
              <div className="text-lg font-bold text-zinc-500 font-mono">{statusDistribution.Terminated}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Actionable grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Certifications */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-red-600 uppercase tracking-wider font-mono">Expiring Certifications</h3>
          <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
            {expiringCertsList.map((c, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-zinc-900">{c.certification}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">
                    {c.employeeName} · Expiry: {c.expiryDate}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${c.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {c.status}
                </span>
              </div>
            ))}
            {expiringCertsList.length === 0 && (
              <div className="text-center py-8 text-zinc-400 text-xs">No certification alerts.</div>
            )}
          </div>
        </div>

        {/* Pending Onboarding */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider font-mono">Pending Onboarding</h3>
          <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
            {pendingOnboardingList.map((o) => (
              <div key={o.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-zinc-900">{o.firstName} {o.lastName}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">Role: {o.designation} · Stage: {o.onboardingStage}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {o.onboardingStatus}
                </span>
              </div>
            ))}
            {pendingOnboardingList.length === 0 && (
              <div className="text-center py-8 text-zinc-400 text-xs">No pending candidates.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Joiners & Unassigned list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Joiners */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider font-mono">Recent Joiners</h3>
          <div className="divide-y divide-zinc-100">
            {recentJoiners.map((rj) => (
              <div key={rj.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-zinc-900">{rj.firstName} {rj.lastName}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">Joined: {rj.joiningDate} · {rj.designation}</div>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{rj.employeeId}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unassigned Employees */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider font-mono">Employees Without Assignment</h3>
          <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto">
            {unassignedList.map((ua) => (
              <div key={ua.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-zinc-900">{ua.firstName} {ua.lastName}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">Designation: {ua.designation} · Dept: {ua.department}</div>
                </div>
                <Link
                  href={`/employees/${ua.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[11px] transition-colors"
                >
                  Assign Project
                </Link>
              </div>
            ))}
            {unassignedList.length === 0 && (
              <div className="text-center py-8 text-zinc-400 text-xs">All active employees allocated.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
