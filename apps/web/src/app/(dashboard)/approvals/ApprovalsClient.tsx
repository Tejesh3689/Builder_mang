'use client';

import React, { useState } from 'react';

interface ApprovalRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  managerName: string;
  type: 'Leave' | 'Field Work' | 'Other';
  date: string;
  summary: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedTime: string;
}

interface ApprovalsClientProps {
  userRole?: string;
  sessionName?: string;
}

export default function ApprovalsClient({ userRole = 'ADMIN', sessionName = '' }: ApprovalsClientProps) {
  const isSupervisor = userRole === 'SITE_ENGINEER';
  const isManager = userRole === 'PROJECT_MANAGER';
  
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Dummy data
  const [requests, setRequests] = useState<ApprovalRequest[]>([
    { id: 'REQ-01', employeeName: 'Krishna Rao', employeeId: 'EMP-1002', managerName: sessionName, type: 'Leave', date: '2026-08-12', summary: 'Sick leave for 2 days', status: 'Pending', submittedTime: '2 hours ago' },
    { id: 'REQ-02', employeeName: 'Anil Desai', employeeId: 'EMP-1003', managerName: sessionName, type: 'Field Work', date: '2026-08-14', summary: 'Site inspection at Skyline Heights', status: 'Pending', submittedTime: '4 hours ago' },
    { id: 'REQ-03', employeeName: 'Ravi Kumar', employeeId: 'EMP-1005', managerName: 'Another Manager', type: 'Leave', date: '2026-09-01', summary: 'Annual Leave (5 days)', status: 'Pending', submittedTime: '1 day ago' },
    { id: 'REQ-04', employeeName: 'Manoj Tiwari', employeeId: 'EMP-1010', managerName: sessionName, type: 'Other', date: '2026-08-10', summary: 'Expense claim for travel', status: 'Approved', submittedTime: '2 days ago' },
    { id: 'REQ-05', employeeName: 'Suresh Babu', employeeId: 'EMP-1012', managerName: sessionName, type: 'Field Work', date: '2026-08-11', summary: 'Vendor meeting at Whitefield', status: 'Pending', submittedTime: '3 days ago' },
  ]);

  // Modals
  const [viewModal, setViewModal] = useState<ApprovalRequest | null>(null);
  const [actionModal, setActionModal] = useState<{ req: ApprovalRequest, action: 'Approve' | 'Reject' } | null>(null);

  // Scope data for Supervisor / Manager
  const scopedRequests = requests.filter(r => {
    if (isSupervisor) return r.managerName === sessionName;
    if (isManager) return true; // Manager sees all for mock
    return true;
  });

  const filteredRequests = scopedRequests.filter(r => {
    if (activeCategory === 'All') return r.status === 'Pending'; // Show only pending by default for All
    if (activeCategory === 'Leave') return r.type === 'Leave' && r.status === 'Pending';
    if (activeCategory === 'Field Work') return r.type === 'Field Work' && r.status === 'Pending';
    if (activeCategory === 'Other') return r.type === 'Other' && r.status === 'Pending';
    return false;
  });

  const handleAction = () => {
    if (!actionModal) return;
    setRequests(prev => prev.map(r => {
      if (r.id === actionModal.req.id) {
        return { ...r, status: actionModal.action === 'Approve' ? 'Approved' : 'Rejected' };
      }
      return r;
    }));
    setActionModal(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Leave': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Field Work': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
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
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isSupervisor ? 'Team Approvals' : 'Global Approvals'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isSupervisor ? 'Review pending requests from your assigned crew' : 'Manage all organization-wide requests'}</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 overflow-x-auto bg-zinc-50/30">
          {['All', 'Leave', 'Field Work', 'Other'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none shrink-0 ${
                activeCategory === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-zinc-400 hover:text-black'
              }`}
            >
              {tab} Pending
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Pending {activeCategory === 'All' ? 'Requests' : activeCategory}</h3>
            
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400 text-xs">
                No pending requests found for this category.
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Request Type</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Summary</th>
                      <th className="py-2.5 px-4">Submitted</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-black">{req.employeeName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{req.employeeId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(req.type)}`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 font-medium">{req.date}</td>
                        <td className="py-3 px-4 text-zinc-600 truncate max-w-[250px]" title={req.summary}>{req.summary}</td>
                        <td className="py-3 px-4 text-zinc-500 text-[10px]">{req.submittedTime}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setViewModal(req)}
                              className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => setActionModal({ req, action: 'Approve' })}
                              className="px-3 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200/50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ req, action: 'Reject' })}
                              className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded transition-colors border border-red-200/50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg border border-zinc-200 p-6 max-w-sm w-full space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Review Request Details</h3>
            <div className="space-y-2 text-xs border border-zinc-200 rounded-lg p-3 bg-zinc-50">
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Employee:</span> <span className="text-black font-semibold">{viewModal.employeeName}</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Type:</span> <span className="text-black font-semibold">{viewModal.type}</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Date:</span> <span className="text-black font-semibold">{viewModal.date}</span></div>
              <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Status:</span> <span className="text-black font-semibold">{viewModal.status}</span></div>
              <div>
                <span className="text-zinc-500 font-bold block mb-1">Summary:</span>
                <p className="text-zinc-700 bg-white p-2 rounded border border-zinc-200">{viewModal.summary}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2 gap-2">
              <button onClick={() => setViewModal(null)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors shadow-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg border border-zinc-200 p-6 max-w-xs w-full space-y-4 text-center max-h-[90dvh] overflow-y-auto">
            <h3 className={`text-lg font-extrabold tracking-tight ${actionModal.action === 'Approve' ? 'text-emerald-700' : 'text-red-700'}`}>
              {actionModal.action} Request?
            </h3>
            <p className="text-xs text-zinc-600">
              Are you sure you want to {actionModal.action.toLowerCase()} the {actionModal.req.type.toLowerCase()} request for <span className="font-bold text-black">{actionModal.req.employeeName}</span>?
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
