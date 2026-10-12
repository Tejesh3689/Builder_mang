'use client';
<<<<<<< HEAD

import React, { useState, useEffect } from 'react';
import { Select, SelectOption } from '@/components/ui/Select';

=======

import React, { useState, useEffect } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

>>>>>>> 9ee82ba8af33e218ce4eed118ba4876ff1520296
import { EmployeeProfile } from '@/lib/types';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activeTab, setActiveTab] = useState('Employee');

  // Filter states
  const [projectFilter, setProjectFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    async function loadWorkforce() {
      try {
        const json = await api.get<{success: boolean, data: any[]}>('/api/employees');
        if (json.success && Array.isArray(json.data)) {
          const mapped: EmployeeProfile[] = json.data.map(item => {
            const activeAssignment = item.assignments?.find((a: any) => a.status === 'ACTIVE');
            return {
              id: item.id,
              employeeId: item.employeeId,
              firstName: item.firstName,
              lastName: item.lastName,
              phone: item.phone || '',
              email: item.email || '',
              designation: item.designation,
              department: item.department,
              status: item.status === 'ACTIVE' ? 'Active' : item.status === 'ON_LEAVE' ? 'On Leave' : 'Terminated',
              joiningDate: item.joiningDate || '',
              onboardingStage: item.onboardingStage || 'Active',
              onboardingStatus: item.onboardingStatus || 'Active',
              currentProject: activeAssignment?.venture?.name || 'Unassigned',
              currentSite: activeAssignment?.roleAtSite || '—',
              reportingManager: item.reportingManager ? `${item.reportingManager.firstName} ${item.reportingManager.lastName}` : '—',
              employmentType: item.employmentType || 'Permanent',
              attendanceRate: item.attendanceRate || '100%',
              performanceRating: item.performanceRating || 5.0,
              leaveBalancePaid: item.leaveBalancePaid ?? 12,
              leaveBalanceSick: item.leaveBalanceSick ?? 8,
              leaveBalanceCasual: item.leaveBalanceCasual ?? 10,
              skills: item.skills || [],
              certifications: item.certifications || [],
              documents: item.documents || [],
              trainingSafety: item.trainingSafety || [],
              assignmentHistory: [],
              activities: []
            };
          });
          setEmployees(mapped);
        }
      } catch (err) {
        console.error('Failed to load employees for reports page:', err);
      }
    }
    loadWorkforce();
  }, []);

  const activeStaff = employees.filter((e) => e.onboardingStage === 'Active');

  const filteredStaff = activeStaff.filter((e) => {
    const matchesProj = projectFilter === 'All' || e.currentProject === projectFilter;
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesProj && matchesDept;
  });

  const handleExport = (reportType: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'Employee') {
      headers = ['Employee ID', 'Name', 'Role', 'Department', 'Email', 'Joining Date', 'Status'];
      rows = filteredStaff.map((e) => [
        e.employeeId,
        `${e.firstName} ${e.lastName}`,
        e.designation,
        e.department,
        e.email,
        e.joiningDate,
        e.status
      ]);
    } else if (reportType === 'Workforce') {
      headers = ['Employee ID', 'Name', 'Role', 'Assigned Project', 'Site Location', 'Manager'];
      rows = filteredStaff.map((e) => [
        e.employeeId,
        `${e.firstName} ${e.lastName}`,
        e.designation,
        e.currentProject,
        e.currentSite,
        e.reportingManager
      ]);
    } else {
      headers = ['Employee ID', 'Name', 'Certification Title', 'Certificate No', 'Expiry Date', 'Status'];
      rows = filteredStaff.flatMap((e) =>
        e.certifications.map((c) => [
          e.employeeId,
          `${e.firstName} ${e.lastName}`,
          c.certification,
          c.certificateNo,
          c.expiryDate,
          c.status
        ])
      );
    }

<<<<<<< HEAD
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Naprocs_BMS_${reportType}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
=======
    const bom = '\uFEFF';
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Naprocs_BMS_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
>>>>>>> 9ee82ba8af33e218ce4eed118ba4876ff1520296
  };

  const projectOptions = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.currentProject && e.currentProject !== 'Unassigned') set.add(e.currentProject);
    });
    return Array.from(set).sort();
  }, [employees]);

  const deptOptions = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const complianceRows = React.useMemo(() => {
    return filteredStaff.flatMap((e) =>
      (e.certifications || []).map((c) => ({
        ...c,
        employeeName: `${e.firstName} ${e.lastName}`
      }))
    );
  }, [filteredStaff]);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-zinc-500 mt-1">Export personnel registries, crew site allocations, and compliance audit spreadsheets</p>
        </div>
<<<<<<< HEAD
=======
        <button
          onClick={() => handleExport(activeTab)}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Generate Report
        </button>
>>>>>>> 9ee82ba8af33e218ce4eed118ba4876ff1520296
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Report Scope:</span>
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <SelectOption value="All">All Projects</SelectOption>
          {projectOptions.map(p => (
            <SelectOption key={p} value={p}>{p}</SelectOption>
          ))}
        </Select>

        <Select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <SelectOption value="All">All Departments</SelectOption>
          {deptOptions.map(d => (
            <SelectOption key={d} value={d}>{d}</SelectOption>
          ))}
        </Select>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto">
          {['Employee', 'Workforce', 'Compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none shrink-0 ${
                activeTab === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-zinc-400 hover:text-black'
              }`}
            >
              {tab} Report
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">
              Report Data Preview ({
                activeTab === 'Compliance' ? complianceRows.length : filteredStaff.length
              } rows)
            </h3>
            <button
              onClick={() => handleExport(activeTab)}
<<<<<<< HEAD
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Export CSV
=======
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Generate Report (CSV)
>>>>>>> 9ee82ba8af33e218ce4eed118ba4876ff1520296
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            {activeTab === 'Employee' && (
              <>
                {filteredStaff.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-4">Employee ID</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Joining Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredStaff.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-50/20">
                          <td className="py-3 px-4 font-mono text-zinc-500">{e.employeeId}</td>
                          <td className="py-3 px-4 font-bold text-zinc-950">{e.firstName} {e.lastName}</td>
                          <td className="py-3 px-4">{e.designation}</td>
                          <td className="py-3 px-4 text-zinc-500">{e.department}</td>
                          <td className="py-3 px-4 text-zinc-500">{e.email}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{e.joiningDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No employee records in database</p>
                    <p className="text-[11px] text-zinc-400">
                      {employees.length === 0
                        ? 'There are currently no active employees recorded in the system.'
                        : 'No employees match the selected project or department filter.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Workforce' && (
              <>
                {filteredStaff.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-4">Employee ID</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Project</th>
                        <th className="py-2.5 px-4">Site Location</th>
                        <th className="py-2.5 px-4">Reporting Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredStaff.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-50/20">
                          <td className="py-3 px-4 font-mono text-zinc-500">{e.employeeId}</td>
                          <td className="py-3 px-4 font-bold text-zinc-950">{e.firstName} {e.lastName}</td>
                          <td className="py-3 px-4">{e.designation}</td>
                          <td className="py-3 px-4 text-zinc-800 font-semibold">{e.currentProject}</td>
                          <td className="py-3 px-4 text-zinc-500">{e.currentSite}</td>
                          <td className="py-3 px-4 text-zinc-500">{e.reportingManager}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No workforce allocation records</p>
                    <p className="text-[11px] text-zinc-400">
                      {employees.length === 0
                        ? 'There are currently no employees allocated to active projects.'
                        : 'No project allocations match the selected filter criteria.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Compliance' && (
              <>
                {complianceRows.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-4">Employee</th>
                        <th className="py-2.5 px-4">Certification</th>
                        <th className="py-2.5 px-4">Certificate ID</th>
                        <th className="py-2.5 px-4">Expiry Date</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {complianceRows.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/20">
                          <td className="py-3 px-4 font-bold text-zinc-950">{c.employeeName}</td>
                          <td className="py-3 px-4 font-semibold text-zinc-800">{c.certification}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{c.certificateNo}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{c.expiryDate}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              c.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No compliance records in database</p>
                    <p className="text-[11px] text-zinc-400">
                      There are currently no compliance or certification certificates recorded for employees.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
