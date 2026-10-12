'use client';

import React, { useState, useMemo } from 'react';
import { Select, SelectOption } from '@/components/ui/Select';

interface TeamReportsClientProps {
  userRole?: string;
  sessionName?: string;
  initialAttendance?: any[];
  initialLeaves?: any[];
  initialFieldWork?: any[];
  employees?: { id: string; name: string }[];
}

function isDateInRange(dateStr?: string, range?: string): boolean {
  if (!dateStr || !range || range === 'All Time') return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (range === 'Today') {
    return targetDay.getTime() === todayStart.getTime();
  }

  if (range === 'This Week') {
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }

  if (range === 'This Month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  if (range === 'Last Month') {
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
  }

  return true;
}

export default function TeamReportsClient({ 
  userRole = 'ADMIN', 
  sessionName = '',
  initialAttendance = [],
  initialLeaves = [],
  initialFieldWork = [],
  employees = []
}: TeamReportsClientProps) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  
  const [activeTab, setActiveTab] = useState<'Team Attendance' | 'Leave' | 'Field Work'>('Team Attendance');
  const [dateRange, setDateRange] = useState('All Time');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAttendance = useMemo(() => {
    return initialAttendance.filter(a => {
      const matchesEmp = employeeFilter === 'All' || a.employeeName === employeeFilter;
      const matchesStatus = statusFilter === 'All' || a.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = isDateInRange(a.date, dateRange);
      return matchesEmp && matchesStatus && matchesDate;
    });
  }, [initialAttendance, employeeFilter, statusFilter, dateRange]);

  const filteredLeave = useMemo(() => {
    return initialLeaves.filter(l => {
      const matchesEmp = employeeFilter === 'All' || l.employeeName === employeeFilter;
      const matchesStatus = statusFilter === 'All' || l.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = isDateInRange(l.startDate, dateRange);
      return matchesEmp && matchesStatus && matchesDate;
    });
  }, [initialLeaves, employeeFilter, statusFilter, dateRange]);

  const filteredFieldWork = useMemo(() => {
    return initialFieldWork.filter(f => {
      const matchesEmp = employeeFilter === 'All' || f.employeeName === employeeFilter;
      const matchesStatus = statusFilter === 'All' || f.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = isDateInRange(f.date, dateRange);
      return matchesEmp && matchesStatus && matchesDate;
    });
  }, [initialFieldWork, employeeFilter, statusFilter, dateRange]);

  // Dynamic KPI Metrics derived from real database data
  const totalAtt = filteredAttendance.length;
  const presentAtt = filteredAttendance.filter(a => a.status === 'Present' || a.status === 'Field Work' || a.status === 'Late').length;
  const avgAttendanceRate = totalAtt > 0 ? `${(Math.round((presentAtt / totalAtt) * 1000) / 10).toFixed(1)}%` : '0%';
  const attendanceSubtitle = totalAtt > 0 
    ? `${presentAtt} of ${totalAtt} logged present` 
    : 'No attendance records in database';

  const approvedLeaves = filteredLeave.filter(l => l.status === 'APPROVED' || l.status === 'Approved');
  const totalLeaveDays = approvedLeaves.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
  const leaveSubtitle = approvedLeaves.length > 0 
    ? `${approvedLeaves.length} approved request${approvedLeaves.length === 1 ? '' : 's'}` 
    : 'No approved leaves in database';

  const totalFieldHours = filteredFieldWork.reduce((sum, f) => sum + (Number(f.duration) || 0), 0);
  const fieldWorkSubtitle = filteredFieldWork.length > 0 
    ? `Across ${filteredFieldWork.length} field visit${filteredFieldWork.length === 1 ? '' : 's'}` 
    : 'No field work records in database';

  const teamCount = employeeFilter !== 'All' ? 1 : employees.length;
  const teamSubtitle = teamCount > 0 
    ? `${teamCount} active member${teamCount === 1 ? '' : 's'} in scope` 
    : 'No employees in database';

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

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const bom = '\uFEFF';
    const csvString = [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\r\n');
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Team_${activeTab.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isManager ? 'Extended Team Reports' : isSupervisor ? 'Team Reports' : 'Global Reports'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isManager ? 'Analytics and exported logs for your extended hierarchy' : isSupervisor ? 'Analytics and exported logs for your assigned crew' : 'View analytics for all teams'}</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Generate Report
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Avg Attendance Rate</div>
          <div className="text-2xl font-black text-zinc-800 tracking-tight">{avgAttendanceRate}</div>
          <div className="text-[10px] text-zinc-500 font-medium">{attendanceSubtitle}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Total Leave Taken</div>
          <div className="text-2xl font-black text-zinc-800 tracking-tight">{totalLeaveDays} <span className="text-sm font-semibold text-zinc-400">Days</span></div>
          <div className="text-[10px] text-zinc-500 font-medium">{leaveSubtitle}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Total Field Work</div>
          <div className="text-2xl font-black text-zinc-800 tracking-tight">{totalFieldHours} <span className="text-sm font-semibold text-zinc-400">Hours</span></div>
          <div className="text-[10px] text-zinc-500 font-medium">{fieldWorkSubtitle}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Active Personnel</div>
          <div className="text-2xl font-black text-zinc-800 tracking-tight">{teamCount}</div>
          <div className="text-[10px] text-zinc-500 font-medium">{teamSubtitle}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-wrap gap-3 items-center">
        {/* Date Range Selector */}
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 bg-white"
        >
          <SelectOption value="All Time">All Time</SelectOption>
          <SelectOption value="Today">Today</SelectOption>
          <SelectOption value="This Week">This Week</SelectOption>
          <SelectOption value="This Month">This Month</SelectOption>
          <SelectOption value="Last Month">Last Month</SelectOption>
        </Select>

        {/* Dynamic Personnel Selector */}
        <Select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 bg-white"
        >
          <SelectOption value="All">All Personnel ({employees.length})</SelectOption>
          {employees.map((emp) => (
            <SelectOption key={emp.id} value={emp.name}>{emp.name}</SelectOption>
          ))}
        </Select>

        {/* Dynamic Status Filter */}
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:border-zinc-400 bg-white"
        >
          <SelectOption value="All">All Statuses</SelectOption>
          {activeTab === 'Team Attendance' && (
            <>
              <SelectOption value="Present">Present</SelectOption>
              <SelectOption value="Absent">Absent</SelectOption>
              <SelectOption value="Late">Late</SelectOption>
              <SelectOption value="Field Work">Field Work</SelectOption>
              <SelectOption value="On Leave">On Leave</SelectOption>
            </>
          )}
          {activeTab === 'Leave' && (
            <>
              <SelectOption value="APPROVED">Approved</SelectOption>
              <SelectOption value="PENDING">Pending</SelectOption>
              <SelectOption value="REJECTED">Rejected</SelectOption>
              <SelectOption value="CANCELLED">Cancelled</SelectOption>
            </>
          )}
          {activeTab === 'Field Work' && (
            <>
              <SelectOption value="Approved">Approved</SelectOption>
              <SelectOption value="Completed">Completed</SelectOption>
            </>
          )}
        </Select>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto scrollbar-hide">
          {(['Team Attendance', 'Leave', 'Field Work'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setStatusFilter('All'); }}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none shrink-0 cursor-pointer ${
                activeTab === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-zinc-400 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">
              Report Data Preview ({
                activeTab === 'Team Attendance' ? filteredAttendance.length :
                activeTab === 'Leave' ? filteredLeave.length :
                filteredFieldWork.length
              } rows)
            </h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Generate Report (CSV)
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-hide border border-zinc-200 rounded-xl">
            {activeTab === 'Team Attendance' && (
              <>
                {filteredAttendance.length > 0 ? (
                  <table className="w-full text-left text-xs table-auto">
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
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No attendance records in database</p>
                    <p className="text-[11px] text-zinc-400">
                      {initialAttendance.length === 0
                        ? 'There are currently no attendance logs recorded in the system.'
                        : 'No attendance records match the selected filter criteria.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Leave' && (
              <>
                {filteredLeave.length > 0 ? (
                  <table className="w-full text-left text-xs table-auto">
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
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No leave requests in database</p>
                    <p className="text-[11px] text-zinc-400">
                      {initialLeaves.length === 0
                        ? 'There are currently no leave requests recorded in the system.'
                        : 'No leave requests match the selected filter criteria.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Field Work' && (
              <>
                {filteredFieldWork.length > 0 ? (
                  <table className="w-full text-left text-xs table-auto">
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
                ) : (
                  <div className="py-16 text-center bg-zinc-50/50 space-y-1">
                    <p className="text-xs font-bold text-zinc-700">No field work records in database</p>
                    <p className="text-[11px] text-zinc-400">
                      {initialFieldWork.length === 0
                        ? 'There are currently no field work entries recorded in the system.'
                        : 'No field work entries match the selected filter criteria.'}
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
