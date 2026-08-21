'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getLocalEmployees, EmployeeProfile } from '@/lib/mockDatabase';

interface CrewType {
  id: string;
  name: string;
  supervisor: string;
  members: string[];
  project: string;
  site: string;
  shift: string;
  status: 'Active' | 'On Break' | 'Standby';
}

export default function WorkforcePage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showCrewModal, setShowCrewModal] = useState(false);

  // Crew fields for creation
  const [crewName, setCrewName] = useState('');
  const [crewSupervisor, setCrewSupervisor] = useState('Arjun Sharma');
  const [crewProject, setCrewProject] = useState('Green Heights Luxury Apartments');
  const [crewSite, setCrewSite] = useState('Site A');
  const [crewShift, setCrewShift] = useState('Day Shift (08:00 - 17:00)');
  const [crews, setCrews] = useState<CrewType[]>([
    {
      id: 'crew-1',
      name: 'Masonry Crew A',
      supervisor: 'Arjun Sharma',
      members: ['Amit Patel', 'Rohan Roy'],
      project: 'Green Heights Luxury Apartments',
      site: 'Site A',
      shift: 'Day Shift (08:00 - 17:00)',
      status: 'Active'
    },
    {
      id: 'crew-2',
      name: 'Site Engineering Crew',
      supervisor: 'Ajay Rao',
      members: ['Priya Nair'],
      project: 'Skyline Gated Villas',
      site: 'Site B',
      shift: 'Day Shift (08:00 - 17:00)',
      status: 'Active'
    }
  ]);

  useEffect(() => {
    setEmployees(getLocalEmployees());
  }, []);

  const totalPersonnel = employees.filter((e) => e.onboardingStage === 'Active').length;
  const allocatedCount = employees.filter((e) => e.onboardingStage === 'Active' && e.currentProject !== 'Unassigned').length;
  const allocationRate = totalPersonnel > 0 ? ((allocatedCount / totalPersonnel) * 100).toFixed(1) : '0';

  // Group employees by Project → Site → Role
  const projectHierarchy = useMemo(() => {
    const hierarchy: Record<string, Record<string, Record<string, EmployeeProfile[]>>> = {};

    employees.forEach((emp) => {
      if (emp.onboardingStage !== 'Active') return;
      const proj = emp.currentProject;
      const site = emp.currentSite;
      const role = emp.designation;

      if (!hierarchy[proj]) hierarchy[proj] = {};
      if (!hierarchy[proj][site]) hierarchy[proj][site] = {};
      if (!hierarchy[proj][site][role]) hierarchy[proj][site][role] = [];

      hierarchy[proj][site][role].push(emp);
    });

    return hierarchy;
  }, [employees]);

  // Handle Crew Creation
  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crewName) return;

    const newCrew: CrewType = {
      id: `crew-${Date.now()}`,
      name: crewName,
      supervisor: crewSupervisor,
      members: employees
        .filter((emp) => emp.reportingManager === crewSupervisor && emp.onboardingStage === 'Active')
        .map((emp) => `${emp.firstName} ${emp.lastName}`),
      project: crewProject,
      site: crewSite,
      shift: crewShift,
      status: 'Active'
    };

    setCrews([...crews, newCrew]);
    setCrewName('');
    setShowCrewModal(false);
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Workforce Allocation</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage construction crew assignments and site deployments</p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Total Active Workforce</div>
          <div className="text-2xl font-black text-black tracking-tight">{totalPersonnel} Personnel</div>
          <div className="text-[10px] text-zinc-400">Deployed & standby staff</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Site Allocation Rate</div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{allocationRate}%</div>
          <div className="text-[10px] text-emerald-600">{allocatedCount} Deployed staff</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Active Site Crews</div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">{crews.length} Active Crews</div>
          <div className="text-[10px] text-amber-600">Scheduled shifts</div>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto">
          {['Overview', 'Project Allocation Matrix', 'Crew Registry'].map((tab) => (
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
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Headcount Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-3">
                  <div className="font-bold text-zinc-800">Site Headcount Allocation</div>
                  <div className="space-y-2">
                    {Object.entries(projectHierarchy).map(([project, sitesObj]) => {
                      const totalProjCount = Object.values(sitesObj).reduce(
                        (sum, rolesObj) => sum + Object.values(rolesObj).reduce((s, arr) => s + arr.length, 0),
                        0
                      );
                      return (
                        <div key={project} className="flex justify-between py-1.5 border-b border-zinc-100">
                          <span>{project}</span>
                          <span className="font-bold font-mono">{totalProjCount} Personnel</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-bold text-zinc-800">Job Role Headcount Breakdown</div>
                  <div className="space-y-2">
                    {Array.from(new Set(employees.filter((e) => e.onboardingStage === 'Active').map((e) => e.designation))).map((role) => {
                      const roleCount = employees.filter((e) => e.designation === role && e.onboardingStage === 'Active').length;
                      return (
                        <div key={role} className="flex justify-between py-1.5 border-b border-zinc-100">
                          <span>{role}</span>
                          <span className="font-bold font-mono">{roleCount} Active</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Project Allocation Matrix' && (
            <div className="space-y-6 text-xs">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">
                Project &rarr; Site Allocation Matrix
              </h3>

              <div className="space-y-6">
                {Object.entries(projectHierarchy).map(([project, sitesObj]) => (
                  <div key={project} className="border border-zinc-200 rounded-xl p-4 space-y-4 bg-zinc-50/20">
                    <h4 className="font-bold text-sm text-zinc-800 border-b border-zinc-100 pb-2">{project}</h4>

                    {Object.entries(sitesObj).map(([site, rolesObj]) => (
                      <div key={site} className="pl-4 border-l-2 border-zinc-200 space-y-3">
                        <h5 className="font-semibold text-zinc-700 font-mono">{site}</h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(rolesObj).map(([role, list]) => (
                            <div key={role} className="p-3 bg-white border border-zinc-200 rounded-lg space-y-1.5">
                              <div className="flex justify-between font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
                                <span>{role}</span>
                                <span className="font-mono text-zinc-500">{list.length}</span>
                              </div>
                              <div className="space-y-0.5 max-h-[100px] overflow-y-auto">
                                {list.map((emp) => (
                                  <Link
                                    key={emp.id}
                                    href={`/employees/${emp.id}`}
                                    className="block text-zinc-600 hover:text-black hover:underline"
                                  >
                                    • {emp.firstName} {emp.lastName} ({emp.employeeId})
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Crew Registry' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono">Site Crews Registry</h3>
                <button
                  onClick={() => setShowCrewModal(true)}
                  className="px-3.5 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  + Create Crew
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crews.map((c) => (
                  <div key={c.id} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-200/60 pb-2">
                      <div className="font-bold text-zinc-900 text-xs">{c.name}</div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {c.status}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Crew Lead</span>
                        <span className="font-semibold text-zinc-800">{c.supervisor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Shift Scheduled</span>
                        <span className="font-semibold text-zinc-800">{c.shift}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Assigned Site</span>
                        <span className="font-semibold text-zinc-800">{c.project} ({c.site})</span>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-zinc-100">
                        <span className="text-zinc-400 block font-bold text-[10px] uppercase">Members</span>
                        <div className="flex flex-wrap gap-1">
                          {c.members.map((m, idx) => (
                            <span key={idx} className="bg-zinc-100 px-2 py-0.5 rounded-sm text-[10px] text-zinc-700">{m}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Crew */}
      {showCrewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCrew} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Create New Construction Crew</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Crew Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B Electricians"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Crew Supervisor</label>
                <select
                  value={crewSupervisor}
                  onChange={(e) => setOriginalSupervisor(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg bg-white"
                >
                  {employees
                    .filter((emp) => emp.designation === 'Supervisor' && emp.onboardingStage === 'Active')
                    .map((emp) => (
                      <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Project Site</label>
                <select
                  value={crewProject}
                  onChange={(e) => setCrewProject(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg bg-white"
                >
                  <option value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</option>
                  <option value="Skyline Gated Villas">Skyline Gated Villas</option>
                  <option value="Lake View Gated Community">Lake View Gated Community</option>
                  <option value="Sunrise Villas">Sunrise Villas</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Shift</label>
                <select
                  value={crewShift}
                  onChange={(e) => setCrewShift(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg bg-white"
                >
                  <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                  <option value="Night Shift (20:00 - 05:00)">Night Shift (20:00 - 05:00)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowCrewModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Create Crew</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  function setOriginalSupervisor(val: string) {
    setCrewSupervisor(val);
  }
}
