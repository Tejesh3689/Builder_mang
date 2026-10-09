'use client';

import React, { useState, useEffect, useMemo } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

import Link from 'next/link';
import { EmployeeProfile } from '@/lib/types';

import { api } from '@/lib/api';

export default function EmployeesClient({ 
  userRole = 'ADMIN', 
  sessionName = '' 
}: { 
  userRole?: string;
  sessionName?: string;
}) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  const isSupervisorOrManager = isSupervisor || isManager;
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Server-side paging + search: the directory can hold thousands of rows, so never assume
  // the first page is everything.
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function fetchEmployees() {
      setLoading(true);
      setLoadError(null);
      try {
        const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (debouncedSearch) query.set('search', debouncedSearch);
        const json = await api.get<{ success: boolean, data: any[], total?: number }>(`/api/employees?${query}`, { signal: controller.signal });
        if (cancelled) return;
        setTotal(json.total ?? json.data?.length ?? 0);
        if (json.success && json.data) {
          // Map backend schema shape to frontend profile shape
          const mapped: EmployeeProfile[] = json.data.map((item: any) => {
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
              assignmentHistory: item.assignments?.map((a: any) => ({
                id: a.id,
                project: a.venture?.name || '—',
                site: a.roleAtSite || '—',
                role: a.roleAtSite || '—',
                duration: a.startDate ? `${new Date(a.startDate).toLocaleDateString('en-GB')} - ${a.endDate ? new Date(a.endDate).toLocaleDateString('en-GB') : 'Present'}` : '—',
                status: a.status === 'ACTIVE' ? 'Active' : 'Completed',
              })) || [],
              activities: item.activitiesJson ? JSON.parse(item.activitiesJson) : [],
            };
          });
          setEmployees(mapped);
        }
      } catch (err: any) {
        console.error('Failed to fetch employees:', err);
        if (!cancelled && err?.status !== 401) setLoadError(err?.message || 'Failed to load employees.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEmployees();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, debouncedSearch, reloadKey]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  // Filter states
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesignation, setSelectedDesignation] = useState('All');
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedEmpType, setSelectedEmpType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedManager, setSelectedManager] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedCertStatus, setSelectedCertStatus] = useState('All');

  // Available filter options (computed dynamically)
  const departments = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.department)))], [employees]);
  const designations = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.designation)))], [employees]);
  const projects = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.currentProject)))], [employees]);
  const sites = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.currentSite)))], [employees]);
  const employmentTypes = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.employmentType)))], [employees]);
  const statuses = ['All', 'Active', 'On Leave', 'Terminated'];
  const managers = useMemo(() => ['All', ...Array.from(new Set(employees.map((e) => e.reportingManager).filter((m) => m !== '—')))], [employees]);
  
  // Flat list of unique skills
  const skillsList = useMemo(() => {
    const allSkills = employees.flatMap((e) => e.skills.map((s) => s.skill));
    return ['All', ...Array.from(new Set(allSkills))];
  }, [employees]);

  // Certifications statuses
  const certStatuses = ['All', 'Valid', 'Expiring Soon', 'Expired', 'None'];

  // 2. Search and Filtering Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      // Only display active employees in directory (candidates belong to onboarding)
      const isActiveInDirectory = e.onboardingStage === 'Active';
      if (!isActiveInDirectory) return false;

      // Search and role scoping happen on the server (GET /api/employees); the dropdowns below
      // refine the rows already loaded for this page.

      const matchesDept = selectedDept === 'All' || e.department === selectedDept;
      const matchesDesignation = selectedDesignation === 'All' || e.designation === selectedDesignation;
      const matchesProject = selectedProject === 'All' || e.currentProject === selectedProject;
      const matchesSite = selectedSite === 'All' || e.currentSite === selectedSite;
      const matchesEmpType = selectedEmpType === 'All' || e.employmentType === selectedEmpType;
      const matchesStatus = selectedStatus === 'All' ? e.status !== 'Terminated' : e.status === selectedStatus;
      const matchesManager = selectedManager === 'All' || e.reportingManager === selectedManager;

      const matchesSkill = selectedSkill === 'All' || e.skills.some((s) => s.skill === selectedSkill);

      // Certification status logic
      let matchesCert = true;
      if (selectedCertStatus !== 'All') {
        if (selectedCertStatus === 'None') {
          matchesCert = e.certifications.length === 0;
        } else {
          matchesCert = e.certifications.some((c) => c.status === selectedCertStatus);
        }
      }

      return (
        matchesDept &&
        matchesDesignation &&
        matchesProject &&
        matchesSite &&
        matchesEmpType &&
        matchesStatus &&
        matchesManager &&
        matchesSkill &&
        matchesCert
      );
    });
  }, [
    employees,
    selectedDept,
    selectedDesignation,
    selectedProject,
    selectedSite,
    selectedEmpType,
    selectedStatus,
    selectedManager,
    selectedSkill,
    selectedCertStatus,
  ]);

  // Handle Deactivation
  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate employee ${name}?`)) {
      try {
        const json = await api.delete<{ success: boolean, data?: any, error?: string }>(`/api/employees/${id}`);
        if (json.success) {
          setEmployees((prev) =>
            prev.map((emp) => {
              if (emp.id === id) {
                return { ...emp, status: 'Terminated' as const };
              }
              return emp;
            })
          );
        } else {
          alert(json.error || 'Failed to deactivate employee.');
        }
      } catch (err: any) {
        console.error('Failed to deactivate employee:', err);
        alert(err.message || 'An error occurred while deactivating the employee.');
      }
    }
  };

  // Avatar circular color mapping
  const getAvatarColor = (name: string) => {
    const char = name.charCodeAt(0) % 5;
    const colors = [
      'bg-amber-600/10 text-amber-700 border-amber-200/60',
      'bg-amber-500/10 text-amber-700 border-amber-200/60',
      'bg-zinc-100 text-zinc-700 border-zinc-200/60',
      'bg-amber-700/10 text-amber-800 border-amber-200/60',
      'bg-zinc-200 text-zinc-850 border-zinc-300/60',
    ];
    return colors[char];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400 text-xs font-semibold">
        Loading directory...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto text-sm">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">{isSupervisor ? 'My Team' : 'Employees'}</h1>
          <p className="text-xs text-zinc-500 mt-1">{isSupervisor ? 'Directory of your assigned crew members' : 'Directory of certified construction personnel and crew assignments'}</p>
        </div>
        {!isSupervisor && (
          <div className="flex items-center gap-2">
            <Link
              href="/employees/dashboard"
              className="px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
            >
              Dashboard View
            </Link>
            <Link
              href="/employees/new"
              className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              + Add Employee
            </Link>
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
        <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">
          Search & Advanced Filtering
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-xs col-span-1 md:col-span-2">
            <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search all employees by name, ID, designation, email or phone..."
              aria-label="Search employees"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-hidden text-xs w-full text-zinc-800 placeholder-zinc-400"
            />
          </div>

          {/* Department Filter */}
          <Select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Departments</SelectOption>
            {departments.filter((d) => d !== 'All').map((d) => (
              <SelectOption key={d} value={d}>{d}</SelectOption>
            ))}
          </Select>

          {/* Designation Filter */}
          <Select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Designations</SelectOption>
            {designations.filter((d) => d !== 'All').map((d) => (
              <SelectOption key={d} value={d}>{d}</SelectOption>
            ))}
          </Select>

          {/* Project Filter */}
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Projects</SelectOption>
            {projects.filter((p) => p !== 'All').map((p) => (
              <SelectOption key={p} value={p}>{p}</SelectOption>
            ))}
          </Select>

          {/* Site Filter */}
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Sites</SelectOption>
            {sites.filter((s) => s !== 'All').map((s) => (
              <SelectOption key={s} value={s}>{s}</SelectOption>
            ))}
          </Select>

          {/* Employment Type */}
          <Select
            value={selectedEmpType}
            onChange={(e) => setSelectedEmpType(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Employment Types</SelectOption>
            {employmentTypes.filter((et) => et !== 'All').map((et) => (
              <SelectOption key={et} value={et}>{et}</SelectOption>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Statuses</SelectOption>
            {statuses.filter((s) => s !== 'All').map((s) => (
              <SelectOption key={s} value={s}>{s}</SelectOption>
            ))}
          </Select>

          {/* Manager Filter */}
          <Select
            value={selectedManager}
            onChange={(e) => setSelectedManager(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Managers</SelectOption>
            {managers.filter((m) => m !== 'All').map((m) => (
              <SelectOption key={m} value={m}>{m}</SelectOption>
            ))}
          </Select>

          {/* Skills Filter */}
          <Select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Skills</SelectOption>
            {skillsList.filter((s) => s !== 'All').map((s) => (
              <SelectOption key={s} value={s}>{s}</SelectOption>
            ))}
          </Select>

          {/* Cert Status Filter */}
          <Select
            value={selectedCertStatus}
            onChange={(e) => setSelectedCertStatus(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <SelectOption value="All">All Certifications Status</SelectOption>
            {certStatuses.filter((cs) => cs !== 'All').map((cs) => (
              <SelectOption key={cs} value={cs}>{cs}</SelectOption>
            ))}
          </Select>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Active Personnel Directory</h3>
          <span className="text-xs text-zinc-400 font-mono font-medium" aria-live="polite">
            {loading
              ? 'Loading…'
              : `Showing ${firstRow}–${lastRow} of ${total} profiles${filteredEmployees.length !== employees.length ? ` · ${filteredEmployees.length} match filters on this page` : ''}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/20">
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Designation</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Project</th>
                <th className="py-3 px-4 font-semibold">Site</th>
                <th className="py-3 px-4 font-semibold">Reporting Manager</th>
                <th className="py-3 px-4 font-semibold">Employment Type</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((e) => {
                  const initials = `${e.firstName[0] || ''}${e.lastName[0] || ''}`.toUpperCase();
                  return (
                    <tr key={e.id} className="hover:bg-zinc-50/30 transition-colors group">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${getAvatarColor(`${e.firstName} ${e.lastName}`)}`}>
                            {initials}
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <Link href={`/employees/${e.id}`} title={`${e.firstName} ${e.lastName}`} className="font-bold text-zinc-800 hover:text-black hover:underline block truncate">
                              {e.firstName} {e.lastName}
                            </Link>
                            <div className="text-[10px] text-zinc-400 truncate" title={e.email}>{e.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-zinc-500">{e.employeeId}</td>

                      {/* Designation */}
                      <td className="py-3.5 px-4 text-zinc-700 font-semibold">{e.designation}</td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-zinc-500">{e.department}</td>

                      {/* Project */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">{e.currentProject}</td>

                      {/* Site */}
                      <td className="py-3.5 px-4 text-zinc-500">{e.currentSite}</td>

                      {/* Manager */}
                      <td className="py-3.5 px-4 text-zinc-500">{e.reportingManager}</td>

                      {/* Employment Type */}
                      <td className="py-3.5 px-4 text-zinc-600">{e.employmentType}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            e.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                              : e.status === 'On Leave'
                              ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                              : 'bg-red-50 text-red-700 border-red-200/60'
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${e.status === 'Active' ? 'bg-emerald-500' : e.status === 'On Leave' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          {e.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Profile */}
                          <Link
                            href={`/employees/${e.id}`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                            title="View Profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>

                          {/* Edit */}
                          {(!isSupervisor) && (
                            <Link
                              href={`/employees/${e.id}/edit`}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                              title="Edit Profile"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Link>
                          )}

                          {/* Deactivate */}
                          {(!isSupervisor && !isManager) && (
                            <button
                              onClick={() => handleDeactivate(e.id, `${e.firstName} ${e.lastName}`)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Deactivate Profile"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-400 font-medium bg-zinc-50/20">
                    No active employees matching filters in the directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loadError && (
          <div role="alert" className="px-6 py-3 border-t border-red-100 bg-red-50 text-xs text-red-700 flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button onClick={() => setReloadKey((k) => k + 1)} className="px-3 py-2 font-semibold underline">Retry</button>
          </div>
        )}
        <nav aria-label="Employee pages" className="px-6 py-3 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs">
          <span className="text-zinc-500 font-mono">Page {page} of {pageCount}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-4 py-2.5 rounded-lg border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount || loading}
              className="px-4 py-2.5 rounded-lg border border-zinc-200 bg-white font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
