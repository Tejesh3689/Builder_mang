'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Dialog } from '@/components/ui/Dialog';
import { hasPermission } from '@/lib/permissions';
import { leaveDurationDays, toCalendarDate } from '@builder/validation';

type RequestType = 'Leave' | 'Materials';

interface ApprovalRequest {
  id: string;
  type: RequestType;
  employeeName: string;
  employeeId: string;
  date: string;
  summary: string;
  details: { label: string; value: string }[];
  submittedAt: string;
}

interface ApprovalsClientProps {
  userRole?: string;
  sessionName?: string;
}

const LEAVE_TYPE_LABEL: Record<string, string> = { SICK: 'Sick leave', CASUAL: 'Casual leave', PAID: 'Paid leave', UNPAID: 'Unpaid leave' };

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function fromLeave(l: any): ApprovalRequest {
  const days = leaveDurationDays(l.startDate, l.endDate);
  const start = toCalendarDate(l.startDate);
  const end = toCalendarDate(l.endDate);
  return {
    id: l.id,
    type: 'Leave',
    employeeName: l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unknown',
    employeeId: l.employee?.employeeId || '-',
    date: start,
    summary: `${LEAVE_TYPE_LABEL[l.type] ?? l.type} for ${days} day${days === 1 ? '' : 's'}`,
    details: [
      { label: 'Dates', value: start === end ? start : `${start} to ${end}` },
      { label: 'Reason', value: l.reason || '-' },
    ],
    submittedAt: l.createdAt,
  };
}

function fromMaterialRequest(r: any): ApprovalRequest {
  const items = (r.items ?? []).map((i: any) => `${i.material?.name ?? 'Material'}: ${i.requestedQuantity} ${i.material?.unitOfMeasure?.name ?? ''}`.trim());
  return {
    id: r.id,
    type: 'Materials',
    employeeName: r.createdBy?.name || 'Unknown',
    employeeId: r.requestNumber,
    date: r.requiredDate ? toCalendarDate(r.requiredDate) : '-',
    summary: `${r.priority && r.priority !== 'NORMAL' ? `${r.priority}: ` : ''}${items.join(', ')}`,
    details: [
      { label: 'Venture', value: r.venture?.name || '-' },
      { label: 'Items', value: items.join('; ') || '-' },
      { label: 'Required by', value: r.requiredDate ? toCalendarDate(r.requiredDate) : '-' },
      { label: 'Remarks', value: r.remarks || '-' },
    ],
    submittedAt: r.createdAt,
  };
}

export default function ApprovalsClient({ userRole = 'ADMIN' }: ApprovalsClientProps) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  // Mirrors the API: only ADMIN/MANAGER may decide leave; material approval needs materials:approve.
  const canDecideLeave = userRole === 'ADMIN' || isManager;
  const canSeeMaterials = hasPermission(userRole as any, 'materials:approve');

  const [activeCategory, setActiveCategory] = useState<'All' | RequestType>('All');
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewModal, setViewModal] = useState<ApprovalRequest | null>(null);
  const [actionModal, setActionModal] = useState<{ req: ApprovalRequest; action: 'Approve' | 'Reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const actingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [leaves, materials] = await Promise.all([
        api.get<any>('/api/leaves?status=PENDING&limit=100'),
        canSeeMaterials ? api.get<any>('/api/materials/requests?status=PENDING_APPROVAL&limit=100') : Promise.resolve({ data: [] }),
      ]);
      const leaveRows: any[] = Array.isArray(leaves) ? leaves : leaves?.data ?? [];
      const materialRows: any[] = materials?.data ?? [];
      setRequests(
        [...leaveRows.map(fromLeave), ...materialRows.map(fromMaterialRequest)].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
      );
    } catch (err: any) {
      if (err?.status !== 401) setLoadError(err?.message || 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  }, [canSeeMaterials]);

  useEffect(() => { load(); }, [load]);

  const filteredRequests = requests.filter(r => activeCategory === 'All' || r.type === activeCategory);
  const canAct = (r: ApprovalRequest) => (r.type === 'Leave' ? canDecideLeave : canSeeMaterials);
  const commentRequired = actionModal?.action === 'Reject' && actionModal.req.type === 'Materials';

  const openAction = (req: ApprovalRequest, action: 'Approve' | 'Reject') => {
    setComment('');
    setActionError(null);
    setActionModal({ req, action });
  };

  const handleAction = async () => {
    // The ref blocks a second click that lands before React re-renders with `acting`.
    if (!actionModal || actingRef.current) return;
    const { req, action } = actionModal;
    if (commentRequired && !comment.trim()) {
      setActionError('A reason is required to reject a material request.');
      return;
    }
    actingRef.current = true;
    setActing(true);
    setActionError(null);
    try {
      const verb = action === 'Approve' ? 'APPROVE' : 'REJECT';
      if (req.type === 'Leave') {
        await api.patch(`/api/leaves/${req.id}`, { action: verb });
      } else {
        await api.patch(`/api/materials/requests/${req.id}`, { action: verb, comments: comment.trim() || undefined });
      }
      setRequests(prev => prev.filter(r => r.id !== req.id));
      setActionModal(null);
    } catch (err: any) {
      if (err?.status === 409) {
        // Someone else already decided it: drop it from the inbox and say so.
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setActionError(`${err.message || 'This request was already handled.'} The list has been refreshed.`);
        load();
      } else if (err?.status !== 401) {
        setActionError(err?.message || `Failed to ${action.toLowerCase()} the request.`);
      }
    } finally {
      actingRef.current = false;
      setActing(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Leave': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Materials': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    }
  };

  const tabs: ('All' | RequestType)[] = canSeeMaterials ? ['All', 'Leave', 'Materials'] : ['All', 'Leave'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isManager ? 'Extended Team Approvals' : isSupervisor ? 'Team Approvals' : 'Global Approvals'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isManager ? 'Review pending requests from your extended hierarchy' : isSupervisor ? 'Review pending requests from your assigned crew' : 'Manage all organization-wide requests'}</p>
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded transition-colors disabled:opacity-50">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 overflow-x-auto bg-zinc-50/30">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-none shrink-0 ${
                activeCategory === tab
                  ? 'border-black text-black bg-white'
                  : 'border-transparent text-zinc-400 hover:text-black'
              }`}
            >
              {tab} Pending{!loading && ` (${tab === 'All' ? requests.length : requests.filter(r => r.type === tab).length})`}
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Pending {activeCategory === 'All' ? 'Requests' : activeCategory}</h3>

            {loadError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">{loadError}</div>
            )}

            {loading ? (
              <div className="text-center py-12 text-zinc-400 text-xs animate-pulse">Loading pending requests…</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-400 text-xs">
                No pending requests found for this category.
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                    <tr>
                      <th className="py-2.5 px-4">Requested By</th>
                      <th className="py-2.5 px-4">Request Type</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Summary</th>
                      <th className="py-2.5 px-4">Submitted</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredRequests.map(req => (
                      <tr key={`${req.type}-${req.id}`} className="hover:bg-zinc-50/50 transition-colors">
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
                        <td className="py-3 px-4 text-zinc-500 text-[10px]">{timeAgo(req.submittedAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setViewModal(req)}
                              className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                            >
                              Review
                            </button>
                            {canAct(req) && (
                              <>
                                <button
                                  onClick={() => openAction(req, 'Approve')}
                                  className="px-3 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors border border-emerald-200/50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openAction(req, 'Reject')}
                                  className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded transition-colors border border-red-200/50"
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
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <Dialog open onClose={() => setViewModal(null)} labelledBy="approval-view-title" className="w-full max-w-sm">
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg border border-zinc-200 p-6 max-w-sm w-full space-y-4 max-h-[90dvh] overflow-y-auto">
              <h3 id="approval-view-title" className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Review Request Details</h3>
              <div className="space-y-2 text-xs border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Requested by:</span> <span className="text-black font-semibold">{viewModal.employeeName}</span></div>
                <div className="flex justify-between border-b border-zinc-200 pb-2"><span className="text-zinc-500 font-bold">Type:</span> <span className="text-black font-semibold">{viewModal.type}</span></div>
                {viewModal.details.map(d => (
                  <div key={d.label} className="flex justify-between gap-4 border-b border-zinc-200 pb-2 last:border-0"><span className="text-zinc-500 font-bold shrink-0">{d.label}:</span> <span className="text-black font-semibold text-right break-words">{d.value}</span></div>
                ))}
              </div>
              <div className="flex justify-end pt-2 gap-2">
                <button onClick={() => setViewModal(null)} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors shadow-xs">Close</button>
              </div>
            </div>
        </Dialog>
      )}

      {/* Action Modal */}
      {actionModal && (
        <Dialog open onClose={() => { if (!acting) setActionModal(null); }} labelledBy="approval-action-title" className="w-full max-w-xs">
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-lg border border-zinc-200 p-6 max-w-xs w-full space-y-4 text-center max-h-[90dvh] overflow-y-auto">
              <h3 id="approval-action-title" className={`text-lg font-extrabold tracking-tight ${actionModal.action === 'Approve' ? 'text-emerald-700' : 'text-red-700'}`}>
                {actionModal.action} Request?
              </h3>
              <p className="text-xs text-zinc-600">
                Are you sure you want to {actionModal.action.toLowerCase()} the {actionModal.req.type.toLowerCase()} request from <span className="font-bold text-black">{actionModal.req.employeeName}</span>?
              </p>
              {actionModal.req.type === 'Materials' && (
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder={commentRequired ? 'Reason for rejection (required)' : 'Comment (optional)'}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-left focus:outline-none focus:ring-1 focus:ring-black"
                />
              )}
              {actionError && <div className="text-xs text-red-600 font-medium text-left">{actionError}</div>}
              <div className="flex justify-center gap-3 pt-2">
                <button onClick={() => setActionModal(null)} disabled={acting} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors shadow-xs text-xs disabled:opacity-50">Cancel</button>
                <button
                  onClick={handleAction}
                  disabled={acting}
                  className={`px-4 py-2 text-white font-bold rounded-lg transition-colors shadow-xs text-xs disabled:opacity-50 disabled:cursor-not-allowed ${actionModal.action === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {acting ? 'Saving…' : `Confirm ${actionModal.action}`}
                </button>
              </div>
            </div>
        </Dialog>
      )}
    </div>
  );
}
