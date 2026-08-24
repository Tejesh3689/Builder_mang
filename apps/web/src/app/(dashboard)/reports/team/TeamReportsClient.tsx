'use client';

import React, { useState } from 'react';

interface TeamReportsClientProps {
  userRole?: string;
  sessionName?: string;
}

export default function TeamReportsClient({ userRole = 'ADMIN', sessionName = '' }: TeamReportsClientProps) {
  const isSupervisor = userRole === 'SITE_ENGINEER';
  const isManager = userRole === 'PROJECT_MANAGER';
  
  const [activeTab, setActiveTab] = useState('Team Attendance');
  const [dateRange, setDateRange] = useState('This Month');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Dummy data tailored for reports
  const mockAttendance = [
    { id: 'ATT-1', date: '2026-08-20', employeeName: 'Krishna Rao', status: 'Present', login: '08:00 AM', logout: '05:00 PM', hours: 9, site: 'Site A' },
    { id: 'ATT-2', date: '2026-08-20', employeeName: 'Anil Desai', status: 'Present', login: '08:15 AM', logout: '05:00 PM', hours: 8.75, site: 'Site B' },
    { id: 'ATT-3', date: '2026-08-20', employeeName: 'Ravi Kumar', status: 'Absent', login: '-', logout: '-', hours: 0, site: '-' },
  ];

  const mockLeave = [
    { id: 'LEV-1', employeeName: 'Manoj Tiwari', type: 'Sick Leave', startDate: '2026-08-10', endDate: '2026-08-11', duration: 2, status: 'Approved' },
    { id: 'LEV-2', employeeName: 'Suresh Babu', type: 'Casual Leave', startDate: '2026-08-15', endDate: '2026-08-15', duration: 1, status: 'Approved' },
  ];

  const mockFieldWork = [
    { id: 'FW-1', date: '2026-08-18', employeeName: 'Krishna Rao', client: 'Alpha Corp', location: 'Whitefield', duration: 4, status: 'Completed' },
    { id: 'FW-2', date: '2026-08-19', employeeName: 'Anil Desai', client: 'Beta LLC', location: 'Electronic City', duration: 6, status: 'Completed' },
  ];

  const getFilteredData = (data: any[]) => {
    return data.filter(d => {
      if (isSupervisor && d.managerName && d.managerName !== sessionName) return false;
      const matchesEmp = employeeFilter === 'All' || d.employeeName === employeeFilter;
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesEmp && matchesStatus;
    });
  };

  const filteredAttendance = getFilteredData(mockAttendance);
  const filteredLeave = getFilteredData(mockLeave);
  const filteredFieldWork = getFilteredData(mockFieldWork);

  const handleExport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === 'Team Attendance') {
      headers = ['Date', 'Employee', 'Status', 'Login', 'Logout', 'Hours', 'Site'];
      rows = filteredAttendance.map(a => [a.date, a.employeeName, a.status, a.login, a.logout, a.hours.toString(), a.site]);
    } else if (activeTab === 'Leave') {
      headers = ['Employee', 'Type', 'Start Date', 'End Date', 'Duration', 'Status'];
      rows = filteredLeave.map(l => [l.employeeName, l.type, l.startDate, l.endDate, l.duration.toString(), l.status]);
    } else {
      headers = ['Date', 'Employee', 'Client', 'Location', 'Duration', 'Status'];
      rows = filteredFieldWork.map(f => [f.date, f.employeeName, f.client, f.location, f.duration.toString(), f.status]);
    }

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Team_${activeTab.replace(' ', '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isSupervisor ? 'Team Reports' : 'Global Reports'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isSupervisor ? 'Analytics and exported logs for your assigned crew' : 'View analytics for all teams'}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Avg Attendance Rate</div>
          <div className="text-2xl font-black text-zinc-800 tracking-tight">92.4%</div>
          <div className="text-[10px] text-emerald-500 font-bold">+2.1% from last month</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Total Leave Days</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">14</div>
          <div className="text-[10px] text-zinc-500">Approved this period</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Field Work Hours</div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">128h</div>
          <div className="text-[10px] text-zinc-500">Across 3 active sites</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Team Productivity</div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">88%</div>
          <div className="text-[10px] text-purple-500 font-bold">On target</div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Filters:</span>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
          <option value="This Month">This Month</option>
          <option value="Last Month">Last Month</option>
        </select>

        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="All">All Employees</option>
          <option value="Krishna Rao">Krishna Rao</option>
          <option value="Anil Desai">Anil Desai</option>
          <option value="Ravi Kumar">Ravi Kumar</option>
          <option value="Manoj Tiwari">Manoj Tiwari</option>
          <option value="Suresh Babu">Suresh Babu</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto">
          {['Team Attendance', 'Leave', 'Field Work'].map((tab) => (
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
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">
              Report Data Preview
            </h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            {activeTab === 'Team Attendance' && (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Login</th>
                    <th className="py-2.5 px-4">Logout</th>
                    <th className="py-2.5 px-4">Hours</th>
                    <th className="py-2.5 px-4">Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredAttendance.map(a => (
                    <tr key={a.id} className="hover:bg-zinc-50/20">
                      <td className="py-3 px-4 font-medium text-zinc-600">{a.date}</td>
                      <td className="py-3 px-4 font-bold text-black">{a.employeeName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono">{a.login}</td>
                      <td className="py-3 px-4 text-zinc-500 font-mono">{a.logout}</td>
                      <td className="py-3 px-4 font-bold text-zinc-700">{a.hours}h</td>
                      <td className="py-3 px-4 text-zinc-500">{a.site}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'Leave' && (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Leave Type</th>
                    <th className="py-2.5 px-4">Start Date</th>
                    <th className="py-2.5 px-4">End Date</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredLeave.map(l => (
                    <tr key={l.id} className="hover:bg-zinc-50/20">
                      <td className="py-3 px-4 font-bold text-black">{l.employeeName}</td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">{l.type}</td>
                      <td className="py-3 px-4 font-medium text-zinc-600">{l.startDate}</td>
                      <td className="py-3 px-4 font-medium text-zinc-600">{l.endDate}</td>
                      <td className="py-3 px-4 font-bold text-zinc-700">{l.duration} Days</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'Field Work' && (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Client/Project</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredFieldWork.map(f => (
                    <tr key={f.id} className="hover:bg-zinc-50/20">
                      <td className="py-3 px-4 font-medium text-zinc-600">{f.date}</td>
                      <td className="py-3 px-4 font-bold text-black">{f.employeeName}</td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">{f.client}</td>
                      <td className="py-3 px-4 text-zinc-600">{f.location}</td>
                      <td className="py-3 px-4 font-bold text-zinc-700">{f.duration}h</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {((activeTab === 'Team Attendance' && filteredAttendance.length === 0) || 
              (activeTab === 'Leave' && filteredLeave.length === 0) || 
              (activeTab === 'Field Work' && filteredFieldWork.length === 0)) && (
              <div className="text-center py-12 text-zinc-400 text-xs bg-zinc-50/50">
                No report data found matching filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
