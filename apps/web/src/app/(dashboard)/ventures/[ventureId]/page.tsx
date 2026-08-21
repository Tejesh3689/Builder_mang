'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Building2, ArrowLeft, MapPin, Calendar, Users, Package, FileText, MessageSquare, 
  Settings, Activity, AlertTriangle, CheckCircle2, Clock, ShieldCheck, Plus, Upload, 
  Send, Lock, ChevronRight, BarChart3, Bell, Edit3, Trash2, Archive, Download, UserPlus
} from 'lucide-react';

export default function VentureDetailPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const resolvedParams = use(params);
  const { ventureId } = resolvedParams;

  const [venture, setVenture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'info' | 'team' | 'operations' | 'documents' | 'communication' | 'activity' | 'settings'>('overview');
  const [opsSubTab, setOpsSubTab] = useState<'materials' | 'employees'>('materials');

  // Form & Action states inside tabs
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 1, sender: 'Suresh Verma (PM)', content: 'Tower B slab casting scheduled for Thursday 8:00 AM.', time: '10:42 AM' },
    { id: 2, sender: 'Ajay Rao (Lead Engineer)', content: 'Cement stock verified (420 bags). Ready for batching.', time: '10:18 AM' },
  ]);

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('DRAWINGS');

  const fetchVentureDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}`);
      const data = await res.json();
      if (data.success) {
        setVenture(data.data);
      }
    } catch (err) {
      console.error('Error fetching venture detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentureDetail();
  }, [ventureId]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'You (Current User)', content: newChatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setNewChatMessage('');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Loading Venture Command Center...
      </div>
    );
  }

  if (!venture) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-black">Venture Not Found</h2>
        <Link href="/ventures" className="text-xs text-amber-700 hover:underline">← Back to Ventures List</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/ventures" className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors border border-zinc-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-700 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-200">{venture.code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                venture.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400'
              }`}>
                ● {venture.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-black tracking-tight mt-0.5">{venture.name}</h1>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('operations')}
            className="px-3.5 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-xs transition-colors"
          >
            <Package className="w-3.5 h-3.5" /> Material Request
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-700" /> Assign Employee
          </button>
          <button 
            onClick={() => setActiveTab('communication')}
            className="px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Open Chat
          </button>
        </div>
      </div>

      {/* Main KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Progress</span>
          <div className="text-xl font-extrabold text-black">{venture.progressPercentage || 68}%</div>
          <div className="w-full h-1.5 rounded-full bg-zinc-50 overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full" style={{ width: `${venture.progressPercentage || 68}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Assigned Staff</span>
          <div className="text-xl font-extrabold text-black">{venture.assignments?.length || 42}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Active on Site</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Material Items</span>
          <div className="text-xl font-extrabold text-black">{venture.stocks?.length || 128}</div>
          <span className="text-[10px] text-amber-700 font-semibold">Inventory Tracked</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Pending Requests</span>
          <div className="text-xl font-extrabold text-amber-400">14</div>
          <span className="text-[10px] text-amber-400/80">Needs Approval</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Total Budget</span>
          <div className="text-xl font-extrabold text-emerald-400">₹{((venture.estimatedBudget || 82000000) / 10000000).toFixed(2)} Cr</div>
          <span className="text-[10px] text-zinc-400">Sanctioned</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">Budget Utilization</span>
          <div className="text-xl font-extrabold text-black">64%</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Within Target</span>
        </div>
      </div>

      {/* Project Health Bar */}
      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-black uppercase tracking-wider">Project Health Command Matrix:</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Schedule: <strong className="text-emerald-400">On Track</strong>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Budget: <strong className="text-amber-400">Attention Required</strong>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Materials: <strong className="text-emerald-400">Healthy</strong>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Issues: <strong className="text-rose-400">3 Critical</strong>
          </span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-zinc-200 flex gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview', icon: Building2 },
          { key: 'info', label: 'Project Information', icon: MapPin },
          { key: 'team', label: 'Team & Permissions', icon: Users },
          { key: 'operations', label: 'Operations (Materials/Staff)', icon: Package },
          { key: 'documents', label: 'Documents', icon: FileText },
          { key: 'communication', label: 'Communication (Chat)', icon: MessageSquare },
          { key: 'activity', label: 'Activity Log', icon: Activity },
          { key: 'settings', label: 'Settings', icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'border-[#d97706] text-amber-700 bg-amber-500/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="pt-2">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Site Details Card */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-700" /> Operational Summary
                </h3>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {venture.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Venture Type</span>
                    <span className="font-semibold text-black">{venture.type}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Site Location</span>
                    <span className="font-semibold text-black">{venture.siteCity || venture.regCity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Target Completion</span>
                    <span className="font-semibold text-emerald-400">Dec 2027</span>
                  </div>
                </div>
              </div>

              {/* Scoped Material Highlights */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-black flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-700" /> Scoped Material Inventory
                  </h3>
                  <button onClick={() => setActiveTab('operations')} className="text-xs text-amber-700 hover:underline font-semibold">
                    View All Materials →
                  </button>
                </div>

                <div className="divide-y divide-zinc-100">
                  {(venture.stocks || []).map((s: any) => (
                    <div key={s.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-black block">{s.material?.name || 'OPC Cement 53 Grade'}</span>
                        <span className="text-[11px] text-zinc-500">{s.material?.category?.name || 'Structural'} • Code: {s.material?.code}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-700 text-sm block">{s.quantity} {s.material?.unitOfMeasure?.name || 'Bags'}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">● Healthy Stock</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Feed */}
            <div className="space-y-6">
              {/* Site Announcements Feed */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3.5">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" /> Site Announcements
                </h3>
                <div className="space-y-3">
                  {(venture.announcements || []).map((a: any) => (
                    <div key={a.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-800">{a.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{a.priority}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-normal">{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline Snapshot */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-3.5">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-700" /> Recent Site Activity
                </h3>
                <div className="space-y-3 border-l-2 border-zinc-200 pl-3">
                  {(venture.auditLogs || []).map((log: any) => (
                    <div key={log.id} className="text-xs space-y-0.5">
                      <span className="text-zinc-500 text-[10px] font-mono block">{log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:42 AM'}</span>
                      <p className="text-zinc-800 font-medium">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROJECT INFORMATION TAB */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Basic Info & Leadership Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registered vs Construction Site Addresses */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
                <h3 className="text-sm font-bold text-black flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Physical & Registered Addresses
                </h3>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Registered Office Address</span>
                  <p className="text-xs text-zinc-800">{venture.regAddressLine1 || 'Plot 45, Commercial Complex'}, {venture.regCity || 'Vijayawada'}, {venture.regState || 'Andhra Pradesh'} - {venture.regPincode || '520008'}</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Construction Site Physical Address</span>
                  <p className="text-xs text-zinc-800">{venture.siteAddressLine1 || 'Benz Circle, NH-16'}, {venture.siteCity || 'Vijayawada'}, {venture.siteState || 'Andhra Pradesh'} - {venture.sitePincode || '520010'}</p>
                  <p className="text-[11px] text-zinc-500 pt-1 font-mono">Geo: Lat {venture.latitude || 16.5062}, Lng {venture.longitude || 80.648}</p>
                </div>
              </div>

              {/* Leadership Directory */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
                <h3 className="text-sm font-bold text-black flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-700" /> Project Leadership Directory
                </h3>
                <div className="divide-y divide-zinc-100 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-zinc-500">Project Director</span>
                    <span className="font-bold text-black">{venture.projectDirector ? `${venture.projectDirector.firstName} ${venture.projectDirector.lastName}` : 'Rajesh Kumar (#EMP-001)'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-zinc-500">Project Manager</span>
                    <span className="font-bold text-black">{venture.projectManager ? `${venture.projectManager.firstName} ${venture.projectManager.lastName}` : 'Suresh Verma (#EMP-002)'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-zinc-500">Lead Site Engineer</span>
                    <span className="font-bold text-black">{venture.siteManager ? `${venture.siteManager.firstName} ${venture.siteManager.lastName}` : 'Ajay Rao (#EMP-003)'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-zinc-500">Store / Materials Manager</span>
                    <span className="font-bold text-black">{venture.purchaseManager ? `${venture.purchaseManager.firstName} ${venture.purchaseManager.lastName}` : 'Vikram Singh (#EMP-004)'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TEAM & PERMISSIONS TAB */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-black">Assigned Venture Employees</h3>
                  <p className="text-xs text-zinc-500">A user's venture assignment determines what project data they can access.</p>
                </div>
                <button className="px-3.5 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Assign New Employee
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-700">
                  <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Role at Site</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Venture Access Level</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(venture.assignments || []).map((asgn: any) => (
                      <tr key={asgn.id} className="hover:bg-zinc-50/20">
                        <td className="px-4 py-3 font-bold text-black">
                          {asgn.employee?.firstName} {asgn.employee?.lastName}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{asgn.roleAtSite || 'Site Staff'}</td>
                        <td className="px-4 py-3 text-zinc-500">{asgn.employee?.department || 'Operations'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 border border-amber-200">
                            {asgn.accessLevel || 'FULL_ACCESS'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. OPERATIONS TAB (Materials & Employees) */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-zinc-200 text-xs font-semibold pb-2">
              <button
                onClick={() => setOpsSubTab('materials')}
                className={`px-3 py-1.5 rounded-lg ${opsSubTab === 'materials' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                Materials Inventory
              </button>
              <button
                onClick={() => setOpsSubTab('employees')}
                className={`px-3 py-1.5 rounded-lg ${opsSubTab === 'employees' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                Venture Staff
              </button>
            </div>

            {opsSubTab === 'materials' ? (
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
                <h3 className="text-base font-bold text-black">Scoped Site Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-700">
                    <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Material Name & Code</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Current Stock</th>
                        <th className="px-4 py-3">Stock Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {(venture.stocks || []).map((stk: any) => (
                        <tr key={stk.id}>
                          <td className="px-4 py-3 font-bold text-black">
                            {stk.material?.name}
                            <span className="block text-[10px] text-zinc-400 font-mono">{stk.material?.code}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500">{stk.material?.category?.name || 'Structural'}</td>
                          <td className="px-4 py-3 font-extrabold text-amber-700">
                            {stk.quantity} {stk.material?.unitOfMeasure?.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Healthy</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="px-2.5 py-1 bg-amber-500/10 hover:bg-black text-zinc-700 hover:text-white rounded text-xs font-semibold transition-colors">
                              Issue Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-700">
                Displaying venture employees and site engineers assigned to this venture.
              </div>
            )}
          </div>
        )}

        {/* 5. DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black">Venture Documents Repository</h3>
                <p className="text-xs text-zinc-500">Drawings, municipal approvals, legal permits, and photos scoped to this venture.</p>
              </div>
              <button className="px-3.5 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(venture.documents || []).map((doc: any) => (
                <div key={doc.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 hover:border-zinc-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <FileText className="w-8 h-8 text-amber-700" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-55/10 text-amber-700 border border-amber-200/50">{doc.category}</span>
                  </div>
                  <h4 className="font-bold text-xs text-black truncate">{doc.title}</h4>
                  <div className="text-[10px] text-zinc-500 flex justify-between pt-2 border-t border-zinc-200">
                    <span>Ver {doc.version}</span>
                    <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. COMMUNICATION (CHAT) TAB */}
        {activeTab === 'communication' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Scoped Chat Rooms List */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-3">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">Scoped Venture Channels</h3>
              <div className="space-y-1 text-xs">
                {(venture.chatRooms || []).map((rm: any, idx: number) => (
                  <button key={rm.id || idx} className={`w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center gap-2 ${idx === 0 ? 'bg-black text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>
                    <MessageSquare className="w-3.5 h-3.5" /> #{rm.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="md:col-span-3 p-5 rounded-2xl bg-white border border-zinc-200 flex flex-col h-[500px]">
              <div className="border-b border-zinc-200 pb-3 mb-4">
                <h4 className="font-bold text-black text-sm"># General Discussion</h4>
                <p className="text-[11px] text-zinc-500">Scoped room for all members assigned to {venture.name}</p>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-amber-700">{msg.sender}</span>
                      <span className="text-zinc-400">{msg.time}</span>
                    </div>
                    <p className="text-zinc-800">{msg.content}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="pt-3 border-t border-zinc-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message in venture chat..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-black focus:outline-none focus:border-amber-500"
                />
                <button type="submit" className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                  Send <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 7. ACTIVITY LOG TAB */}
        {activeTab === 'activity' && (
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-black">Full Venture Activity & Audit Timeline</h3>
            <div className="space-y-3">
              {(venture.auditLogs || []).map((log: any) => (
                <div key={log.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-700 block">{log.action}</span>
                    <span className="text-zinc-800">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Today 10:42 AM'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-6">
            <div>
              <h3 className="text-base font-bold text-black">Venture Configuration Settings</h3>
              <p className="text-xs text-zinc-500">Configure material threshold alerts and permission rules.</p>
            </div>

            <div className="space-y-4 max-w-xl text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-bold text-black block">Require Material Request Approval</span>
                  <span className="text-zinc-500 text-[11px]">All site material requests must be approved by Venture Manager.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#d97706] cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <span className="font-bold text-black block">Low-Stock Automatic Notifications</span>
                  <span className="text-zinc-500 text-[11px]">Notify Purchase Manager when stock dips below threshold.</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#d97706] cursor-pointer" />
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3 pt-3">
                <h4 className="font-bold text-rose-400 text-xs">Danger Zone</h4>
                <p className="text-[11px] text-rose-300/80">Archiving will lock venture access while preserving complete audit logs.</p>
                <button className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5">
                  <Archive className="w-4 h-4" /> Archive Venture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
