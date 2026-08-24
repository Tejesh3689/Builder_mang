'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  managerName: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface LeaveClientProps {
  userRole?: string;
  sessionName?: string;
}

export default function LeaveClient({ userRole = 'ADMIN', sessionName = '' }: LeaveClientProps) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  
  const [activeTab, setActiveTab] = useState('Pending');
  
  // Dummy data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 'L-1', employeeName: 'Krishna Rao', employeeId: 'EMP-1002', managerName: sessionName, type: 'Sick Leave', startDate: '2026-08-12', endDate: '2026-08-13', duration: 2, reason: 'Viral fever', status: 'Pending' },
    { id: 'L-2', employeeName: 'Anil Desai', employeeId: 'EMP-1003', managerName: sessionName, type: 'Casual Leave', startDate: '2026-08-15', endDate: '2026-08-16', duration: 2, reason: 'Personal work', status: 'Pending' },
    { id: 'L-3', employeeName: 'Ravi Kumar', employeeId: 'EMP-1005', managerName: 'Another Manager', type: 'Annual Leave', startDate: '2026-09-01', endDate: '2026-09-05', duration: 5, reason: 'Family vacation', status: 'Pending' },
    { id: 'L-4', employeeName: 'Manoj Tiwari', employeeId: 'EMP-1010', managerName: sessionName, type: 'Sick Leave', startDate: '2026-08-01', endDate: '2026-08-02', duration: 2, reason: 'Headache', status: 'Approved' },
    { id: 'L-5', employeeName: 'Suresh Babu', employeeId: 'EMP-1012', managerName: sessionName, type: 'Casual Leave', startDate: '2026-08-10', endDate: '2026-08-10', duration: 1, reason: 'Bank work', status: 'Rejected' },
  ]);

  // Modals
  const [viewModal, setViewModal] = useState<LeaveRequest | null>(null);
  const [actionModal, setActionModal] = useState<{ leave: LeaveRequest, action: 'Approve' | 'Reject' } | null>(null);

  // Scope data for Supervisor / Manager
  const scopedLeaves = leaves.filter(l => {
    if (isSupervisor) return l.managerName === sessionName;
    if (isManager) return true; // Manager sees extended hierarchy (mocked as true for this component)
    return true;
  });

  const filteredLeaves = scopedLeaves.filter(l => l.status === activeTab);

  const handleAction = () => {
    if (!actionModal) return;
    setLeaves(prev => prev.map(l => {
      if (l.id === actionModal.leave.id) {
        return { ...l, status: actionModal.action === 'Approve' ? 'Approved' : 'Rejected' };
      }
      return l;
    }));
    setActionModal(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isSupervisor ? 'Team Leave Management' : 'Global Leave Management'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isSupervisor ? 'Manage leave requests for your assigned crew' : 'Manage and configure leave policies organization-wide'}</p>
        </div>
        {!isSupervisor && (
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors">
              Leave Policies
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 overflow-x-auto bg-zinc-50/30">
          {['Pending', 'Approved', 'Rejected', 'Team Leave Calendar'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-hidden shrink-0 ${
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
          {activeTab !== 'Team Leave Calendar' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">{activeTab} Requests</h3>
              
              {filteredLeaves.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400 text-xs">
                  No {activeTab.toLowerCase()} leave requests found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                      <tr>
                        <th className="py-2.5 px-4">Employee</th>
                        <th className="py-2.5 px-4">Leave Type</th>
                        <th className="py-2.5 px-4">Duration</th>
                        <th className="py-2.5 px-4">Reason</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredLeaves.map(leave => (
                        <tr key={leave.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-black">{leave.employeeName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{leave.employeeId}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-700">{leave.type}</td>
                          <td className="py-3 px-4 text-zinc-600">
                            <div>{leave.duration} Days</div>
                            <div className="text-[10px]">{leave.startDate} to {leave.endDate}</div>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 truncate max-w-[200px]" title={leave.reason}>{leave.reason}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewModal(leave)}
                                className="px-2 py-1 text-xs font-semibold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                              >
                                View
                              </button>
                              {leave.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => setActionModal({ leave, action: 'Approve' })}
                                    className="px-2 py-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200/50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setActionModal({ leave, action: 'Reject' })}
                                    className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded transition-colors border border-red-200/50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400 text-xs font-mono">
              [Team Leave Calendar View Implementation Placeholder]
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-zinc-200 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Leave Request Details</h3>
            <div className="space-y-2 text-xs border border-zinc-200 rounded-lg p-3 bg-zinc-50">
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Employee:</span> <span className="text-black font-semibold">{viewModal.employeeName}</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Leave Type:</span> <span className="text-black font-semibold">{viewModal.type}</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Dates:</span> <span className="text-black font-semibold">{viewModal.startDate} to {viewModal.endDate} ({viewModal.duration} days)</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Status:</span> <span className="text-black font-semibold">{viewModal.status}</span></div>
              <div>
                <span className="text-zinc-500 font-bold block mb-1">Reason:</span>
                <p className="text-zinc-700 bg-white p-2 rounded border border-zinc-200">{viewModal.reason}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewModal(null)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors shadow-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-zinc-200 p-6 max-w-xs w-full space-y-4 text-center">
            <h3 className={`text-lg font-extrabold tracking-tight ${actionModal.action === 'Approve' ? 'text-emerald-700' : 'text-red-700'}`}>
              {actionModal.action} Request?
            </h3>
            <p className="text-xs text-zinc-600">
              Are you sure you want to {actionModal.action.toLowerCase()} the leave request for <span className="font-bold text-black">{actionModal.leave.employeeName}</span>?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors shadow-xs text-xs">Cancel</button>
              <button onClick={handleAction} className={`px-4 py-2 text-white font-bold rounded-lg transition-colors shadow-xs text-xs ${actionModal.action === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
