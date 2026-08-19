'use client';

import React, { useState, useEffect } from 'react';
import { getLocalEmployees, saveLocalEmployees, EmployeeProfile } from '@/lib/mockDatabase';

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    setEmployees(getLocalEmployees());
  }, []);

  const candidates = employees.filter((e) => e.onboardingStage !== 'Active');

  // Stages definition
  const STAGES = [
    'Candidate',
    'Documents',
    'Verification',
    'Safety Training',
    'Site Orientation',
    'Project Assignment'
  ];

  // Stage calculations
  const stageCounts = STAGES.reduce((acc: Record<string, number>, stage) => {
    acc[stage] = candidates.filter((c) => c.onboardingStage === stage).length;
    return acc;
  }, {});

  const handleSelectCandidate = (c: EmployeeProfile) => {
    setSelectedCandidate(c);
  };

  // Move candidate to next stage or complete onboarding
  const handleAdvanceStage = () => {
    if (!selectedCandidate) return;

    const currentIdx = STAGES.indexOf(selectedCandidate.onboardingStage);
    let nextStage = selectedCandidate.onboardingStage;
    let nextStatus = selectedCandidate.onboardingStatus;

    if (currentIdx < STAGES.length - 1) {
      nextStage = STAGES[currentIdx + 1] as any;
      const statusMap: Record<string, any> = {
        Documents: 'Documents Pending',
        Verification: 'Verification Pending',
        'Safety Training': 'Training Pending',
        'Site Orientation': 'Ready for Deployment',
        'Project Assignment': 'Ready for Deployment'
      };
      nextStatus = statusMap[nextStage] || 'Ready for Deployment';
    } else {
      // Completed last stage -> fully active
      nextStage = 'Active';
      nextStatus = 'Active';
    }

    const updated = employees.map((emp) => {
      if (emp.id === selectedCandidate.id) {
        const up = {
          ...emp,
          onboardingStage: nextStage,
          onboardingStatus: nextStatus,
          activities: [
            { action: `Advanced onboarding stage to ${nextStage}`, timestamp: 'Just now' },
            ...emp.activities
          ]
        };
        // If advanced to Active, make sure we assign standard site if unassigned
        if (nextStage === 'Active') {
          up.currentProject = 'Green Heights Luxury Apartments';
          up.currentSite = 'Site A';
        }
        return up;
      }
      return emp;
    });

    setEmployees(updated);
    saveLocalEmployees(updated);

    // Update selected ref
    const nextSelected = updated.find((emp) => emp.id === selectedCandidate.id) || null;
    setSelectedCandidate(nextSelected);
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Onboarding Status Hub</h1>
          <p className="text-xs text-zinc-500 mt-1">Verify documents, conduct safety inductions and deploy site personnel</p>
        </div>
      </div>

      {/* Stats Pipeline row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-white p-3 border border-zinc-200 rounded-xl text-center space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{stage}</div>
            <div className="text-lg font-black text-black font-mono">{stageCounts[stage] || 0}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Pipeline Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200/60 bg-zinc-50/30 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono font-bold">Candidates Pipeline</h3>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-mono font-medium">{candidates.length} In Progress</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCandidate(c)}
                  className={`p-4 flex items-center justify-between hover:bg-zinc-50/50 cursor-pointer transition-colors ${
                    selectedCandidate?.id === c.id ? 'bg-zinc-50' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-900">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-zinc-400">{c.designation} · {c.employeeId}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-semibold text-zinc-700">{c.onboardingStage}</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                      {c.onboardingStatus}
                    </span>
                  </div>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-xs font-medium">
                  No personnel currently in the onboarding pipeline.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Panel Drawer */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-5 h-fit">
          <h3 className="text-xs font-extrabold text-black uppercase tracking-wider font-mono border-b border-zinc-100 pb-2">
            Verification & Training Panel
          </h3>

          {selectedCandidate ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-zinc-900 text-sm">{selectedCandidate.firstName} {selectedCandidate.lastName}</div>
                <div className="text-zinc-400">{selectedCandidate.designation} · {selectedCandidate.employeeId}</div>
              </div>

              {/* Progress Bar Component */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
                  <span>Onboarding Progress</span>
                  <span>{((STAGES.indexOf(selectedCandidate.onboardingStage) / STAGES.length) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden flex">
                  {STAGES.map((stage, idx) => {
                    const currentIdx = STAGES.indexOf(selectedCandidate.onboardingStage);
                    const isDone = idx <= currentIdx;
                    return (
                      <div
                        key={stage}
                        className={`h-full border-r border-white/40 flex-1 transition-all ${isDone ? 'bg-amber-600' : 'bg-zinc-200'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border border-zinc-200 rounded-xl p-3 bg-zinc-50/50">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Current Phase</span>
                  <span className="font-bold text-zinc-800">{selectedCandidate.onboardingStage}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Phone</span>
                  <span className="font-semibold text-zinc-800">{selectedCandidate.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Status</span>
                  <span className="font-semibold text-zinc-800">{selectedCandidate.onboardingStatus}</span>
                </div>
              </div>

              {/* Documents Checklist */}
              <div className="space-y-2">
                <div className="font-bold text-zinc-800">Checklist Details</div>
                <div className="p-3 border border-zinc-200/80 rounded-xl bg-zinc-50/30 flex justify-between items-center">
                  <span>Aadhaar Identity Proof</span>
                  <span className="text-emerald-600 font-semibold font-mono text-[10px]">VERIFIED</span>
                </div>
                <div className="p-3 border border-zinc-200/80 rounded-xl bg-zinc-50/30 flex justify-between items-center">
                  <span>Safety Induction Seminar</span>
                  <span className={selectedCandidate.onboardingStage === 'Safety Training' || selectedCandidate.onboardingStage === 'Site Orientation' || selectedCandidate.onboardingStage === 'Project Assignment' ? 'text-emerald-600 font-semibold font-mono text-[10px]' : 'text-amber-600 font-semibold font-mono text-[10px]'}>
                    {selectedCandidate.onboardingStage === 'Safety Training' || selectedCandidate.onboardingStage === 'Site Orientation' || selectedCandidate.onboardingStage === 'Project Assignment' ? 'PASSED' : 'PENDING'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={handleAdvanceStage}
                  className="flex-1 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors text-center shadow-xs"
                >
                  {selectedCandidate.onboardingStage === 'Project Assignment' ? 'Activate Employee' : 'Complete Current Step'}
                </button>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="py-2 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Select a candidate from the pipeline list to view onboarding checklists and advance verification stages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
