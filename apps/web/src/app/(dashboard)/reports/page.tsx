'use client';

import React, { useState, useEffect } from 'react';
import { getLocalEmployees, EmployeeProfile } from '@/lib/mockDatabase';

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activeTab, setActiveTab] = useState('Employee');

  // Filter states
  const [projectFilter, setProjectFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  useEffect(() => {
    setEmployees(getLocalEmployees());
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
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-zinc-500 mt-1">Export personnel registries, crew site allocations, and compliance audit spreadsheets</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Report Scope:</span>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
        >
          <option value="All">All Projects</option>
          <option value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</option>
          <option value="Skyline Gated Villas">Skyline Gated Villas</option>
          <option value="Lake View Gated Community">Lake View Gated Community</option>
          <option value="Sunrise Villas">Sunrise Villas</option>
          <option value="Riverfront Towers">Riverfront Towers</option>
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
        >
          <option value="All">All Departments</option>
          <option value="Site Operations">Site Operations</option>
          <option value="Civil Engineering">Civil Engineering</option>
          <option value="Quality Assurance">Quality Assurance</option>
          <option value="Planning & Civil">Planning & Civil</option>
        </select>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto">
          {['Employee', 'Workforce', 'Compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-hidden shrink-0 ${
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
              Report Data Preview ({filteredStaff.length} rows)
            </h3>
            <button
              onClick={() => handleExport(activeTab)}
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            {activeTab === 'Employee' && (
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
            )}

            {activeTab === 'Workforce' && (
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
            )}

            {activeTab === 'Compliance' && (
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
                  {filteredStaff.flatMap((e) =>
                    e.certifications.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/20">
                        <td className="py-3 px-4 font-bold text-zinc-950">{e.firstName} {e.lastName}</td>
                        <td className="py-3 px-4 font-semibold text-zinc-800">{c.certification}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{c.certificateNo}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{c.expiryDate}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            c.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>{c.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
