'use client';

import React, { useState, useEffect } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

import { api } from '@/lib/api';

interface AttendanceClientProps {
  userRole?: string;
  sessionName?: string;
}

export default function AttendanceClient({ userRole = 'ADMIN', sessionName = '' }: AttendanceClientProps) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [dateFilter, setDateFilter] = useState('Today');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await api.get<{success: boolean, data: any[]}>('/api/attendance');
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(a => ({
            id: a.id,
            employeeName: a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Unknown',
            date: new Date(a.date).toLocaleDateString('en-GB'),
            loginTime: a.loginTime ? new Date(a.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--',
            logoutTime: a.logoutTime ? new Date(a.logoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--',
            status: a.status === 'PRESENT' ? 'Present' : a.status === 'ABSENT' ? 'Absent' : a.status === 'LATE' ? 'Late' : 'On Leave',
            location: a.location || '--',
            hours: a.workingHours ? `${Math.floor(a.workingHours)}h ${Math.round((a.workingHours % 1) * 60)}m` : '--',
            managerName: a.employee?.reportingManager ? `${a.employee.reportingManager.firstName} ${a.employee.reportingManager.lastName}` : 'Direct Report'
          }));
          setAttendanceData(mapped);
        }
      } catch (err) {
        console.error('Failed to load attendance', err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, []);

  // Filter based on role handled by backend API scoping, so we can just use the returned data directly
  const scopedData = attendanceData;

  const columns = [
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'date', label: 'Date' },
    { key: 'loginTime', label: 'Login Time' },
    { key: 'logoutTime', label: 'Logout Time' },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Work Location' },
    { key: 'hours', label: 'Working Hours' }
  ];

  const renderStatus = (status: string) => {
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Absent') color = 'bg-red-50 text-red-700 border-red-200';
    if (status === 'Late') color = 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'On Leave') color = 'bg-blue-50 text-blue-700 border-blue-200';

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
        {status}
      </span>
    );
  };

  const renderRow = (row: any) => (
    <tr key={row.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 group">
      <td className="p-4 text-xs font-semibold text-black">{row.employeeName}</td>
      <td className="p-4 text-xs text-zinc-500 font-medium">{row.date}</td>
      <td className="p-4 text-xs text-zinc-600 font-mono">{row.loginTime}</td>
      <td className="p-4 text-xs text-zinc-600 font-mono">{row.logoutTime}</td>
      <td className="p-4 text-xs">{renderStatus(row.status)}</td>
      <td className="p-4 text-xs text-zinc-500">{row.location}</td>
      <td className="p-4 text-xs font-bold text-zinc-700">{row.hours}</td>
    </tr>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">{isManager ? 'Extended Team Attendance' : isSupervisor ? 'Team Attendance' : 'Global Attendance'}</h1>
          <p className="text-sm text-zinc-500 mt-1">{isManager ? 'Monitor daily attendance, logins, and field visits for your extended hierarchy.' : isSupervisor ? 'Monitor daily attendance, logins, and field visits for your crew.' : 'Monitor daily attendance, logins, and field visits organization-wide.'}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 overflow-x-auto bg-zinc-50/30">
          {['Overview', 'Present', 'Absent', 'Late', 'On Leave'].map((tab) => (
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">{activeTab} Records</h3>
              <Select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 bg-zinc-50 outline-none"
              >
                {['Today', 'Yesterday', 'This Week', 'This Month'].map(opt => (
                  <SelectOption key={opt} value={opt}>{opt}</SelectOption>
                ))}
              </Select>
            </div>
            
            <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                  <tr>
                    {columns.map((c, i) => (
                      <th key={i} className="py-2.5 px-4">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {scopedData.filter(d => activeTab === 'Overview' || activeTab === d.status).map(renderRow)}
                </tbody>
              </table>
              {scopedData.filter(d => activeTab === 'Overview' || activeTab === d.status).length === 0 && (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  No records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
