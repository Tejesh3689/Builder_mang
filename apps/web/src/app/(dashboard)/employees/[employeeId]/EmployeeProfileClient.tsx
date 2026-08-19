'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLocalEmployees, updateLocalEmployee, EmployeeProfile, Skill, Certification, Document } from '@/lib/mockDatabase';

interface EmployeeProfileProps {
  employeeId: string;
}

export default function EmployeeProfileClient({ employeeId }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  // Load from local storage
  useEffect(() => {
    const list = getLocalEmployees();
    const found = list.find((e) => e.id === employeeId || e.employeeId === employeeId || e.employeeId === employeeId.toUpperCase());
    if (found) {
      setEmployee(found);
    }
  }, [employeeId]);

  // Modal / Action states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Assignment states
  const [newProject, setNewProject] = useState('Green Heights Luxury Apartments');
  const [newSite, setNewSite] = useState('Site A');
  const [newRole, setNewRole] = useState('Site Engineer');
  const [newManager, setNewManager] = useState('Suresh Verma');
  const [newDuration, setNewDuration] = useState('Feb 2026 - Present');

  // Skill states
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Civil');
  const [skillProficiency, setSkillProficiency] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');
  const [skillExp, setSkillExp] = useState(2);

  // Cert states
  const [certName, setCertName] = useState('');
  const [certNo, setCertNo] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certAuthority, setCertAuthority] = useState('');

  // Doc states
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'Identity' | 'Employment' | 'Construction' | 'Other'>('Identity');
  const [docFileType, setDocFileType] = useState('PDF');
  const [docExpiry, setDocExpiry] = useState('');

  // Leave states
  const [leaveDays, setLeaveDays] = useState(2);
  const [leaveType, setLeaveType] = useState<'Paid' | 'Sick' | 'Casual'>('Casual');
  const [leaveReason, setLeaveReason] = useState('');

  if (!employee) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs font-semibold">
        Loading profile details...
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const tabs = [
    'Overview',
    'Employment',
    'Projects & Assignments',
    'Skills',
    'Certifications',
    'Documents',
    'Training & Safety',
    'Attendance',
    'Leave',
    'Performance',
    'Activity',
  ];

  // Helper to persist updates
  const handlePersistUpdate = (updatedObj: Partial<EmployeeProfile>) => {
    const res = updateLocalEmployee(employee.id, updatedObj);
    if (res) {
      setEmployee(res);
    }
  };

  // Actions
  const handleAssignProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAssignment = {
      id: `assign-${Date.now()}`,
      project: newProject,
      site: newSite,
      role: newRole,
      duration: newDuration,
      status: 'Active' as const,
    };

    // Complete all previous active assignments in history
    const updatedHistory = employee.assignmentHistory.map((a) => {
      if (a.status === 'Active') {
        return { ...a, status: 'Completed' as const };
      }
      return a;
    });

    updatedHistory.unshift(newAssignment);

    handlePersistUpdate({
      currentProject: newProject,
      currentSite: newSite,
      designation: newRole,
      reportingManager: newManager,
      assignmentHistory: updatedHistory,
      activities: [
        { action: `Assigned to ${newProject} (${newSite}) as ${newRole}`, timestamp: 'Just now' },
        ...employee.activities,
      ],
    });

    setShowAssignModal(false);
  };

  const handleAddSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName) return;

    const newSkill: Skill = {
      skill: skillName,
      category: skillCategory,
      proficiency: skillProficiency,
      experienceYears: skillExp,
      verificationStatus: 'Verified',
      verifiedBy: 'Suresh Verma',
      verificationDate: new Date().toLocaleDateString('en-GB'),
    };

    handlePersistUpdate({
      skills: [...employee.skills, newSkill],
      activities: [
        { action: `Added skill "${skillName}" (${skillProficiency})`, timestamp: 'Just now' },
        ...employee.activities,
      ],
    });

    setSkillName('');
    setShowSkillModal(false);
  };

  const handleAddCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName || !certNo) return;

    // Check status based on expiry
    const expiry = new Date(certExpiry);
    const today = new Date();
    const warningDays = 30 * 24 * 60 * 60 * 1000;
    const diff = expiry.getTime() - today.getTime();

    let certStatus: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
    if (diff < 0) {
      certStatus = 'Expired';
    } else if (diff < warningDays) {
      certStatus = 'Expiring Soon';
    }

    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      certification: certName,
      certificateNo: certNo,
      issueDate: certIssue || new Date().toISOString().split('T')[0],
      expiryDate: certExpiry,
      status: certStatus,
      authority: certAuthority || 'National Safety Agency',
    };

    handlePersistUpdate({
      certifications: [...employee.certifications, newCert],
      activities: [
        { action: `Added safety certification "${certName}"`, timestamp: 'Just now' },
        ...employee.activities,
      ],
    });

    setCertName('');
    setCertNo('');
    setShowCertModal(false);
  };

  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: docName,
      category: docCategory,
      fileType: docFileType,
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: docExpiry || undefined,
      verificationStatus: 'Verified',
      uploadedBy: 'HR Admin',
    };

    handlePersistUpdate({
      documents: [...employee.documents, newDoc],
      activities: [
        { action: `Uploaded document "${docName}" under ${docCategory}`, timestamp: 'Just now' },
        ...employee.activities,
      ],
    });

    setDocName('');
    setShowDocModal(false);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPaid = employee.leaveBalancePaid;
    let updatedSick = employee.leaveBalanceSick;
    let updatedCasual = employee.leaveBalanceCasual;

    if (leaveType === 'Paid') {
      updatedPaid = Math.max(0, updatedPaid - leaveDays);
    } else if (leaveType === 'Sick') {
      updatedSick = Math.max(0, updatedSick - leaveDays);
    } else {
      updatedCasual = Math.max(0, updatedCasual - leaveDays);
    }

    handlePersistUpdate({
      status: 'On Leave',
      leaveBalancePaid: updatedPaid,
      leaveBalanceSick: updatedSick,
      leaveBalanceCasual: updatedCasual,
      activities: [
        { action: `Requested ${leaveDays} days of ${leaveType} Leave: "${leaveReason}"`, timestamp: 'Just now' },
        ...employee.activities,
      ],
    });

    setShowLeaveModal(false);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Contact & Basic Information</h4>
              <div className="space-y-2 border border-zinc-200/80 rounded-xl p-4 bg-zinc-50/20">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Full Name</span>
                  <span className="font-semibold text-black">{fullName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Personal Email</span>
                  <span className="font-semibold text-black">{employee.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Phone Number</span>
                  <span className="font-semibold text-black">{employee.phone}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Emergency Contact</span>
                  <span className="font-semibold text-black">+91 90023 11842 (Spouse)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Site Access & Security</h4>
              <div className="space-y-2 border border-zinc-200/80 rounded-xl p-4 bg-zinc-50/20">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Site Pass Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${employee.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{employee.status === 'Active' ? 'Active Pass' : 'Suspended'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Biometric Register</span>
                  <span className="font-semibold text-emerald-600">Registered</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Primary Site Location</span>
                  <span className="font-semibold text-black">{employee.currentSite}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Employment':
        return (
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Employment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-zinc-200/80 rounded-xl p-4 bg-zinc-50/20">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Designation</span>
                  <span className="font-semibold text-black">{employee.designation}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Department</span>
                  <span className="font-semibold text-black">{employee.department}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">System Permission</span>
                  <span className="font-semibold text-black font-mono">SITE_TEAM</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Joining Date</span>
                  <span className="font-semibold text-black">{employee.joiningDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-100">
                  <span className="text-zinc-400">Reporting Manager</span>
                  <span className="font-semibold text-black">{employee.reportingManager}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Employment Type</span>
                  <span className="font-semibold text-black">{employee.employmentType}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Projects & Assignments':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Active Assignments & History</h4>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Assign Project
              </button>
            </div>

            <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono text-[10px] border-b border-zinc-200/80">
                  <tr>
                    <th className="py-2.5 px-4">Venture Site</th>
                    <th className="py-2.5 px-4">Role At Site</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {employee.assignmentHistory.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-900">{a.project} ({a.site})</td>
                      <td className="py-3 px-4">{a.role}</td>
                      <td className="py-3 px-4 text-zinc-500">{a.duration}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${a.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                  {employee.assignmentHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-400 font-semibold">No assignment history.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Skills':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Verified Professional Skills</h4>
              <button
                onClick={() => setShowSkillModal(true)}
                className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {employee.skills.map((s, idx) => (
                <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium flex items-center gap-1.5">
                  {s.skill}
                  <span className="text-[10px] text-zinc-400">({s.proficiency} · {s.experienceYears} yrs)</span>
                </span>
              ))}
            </div>
          </div>
        );

      case 'Certifications':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Active Safety & Technical Licenses</h4>
              <button
                onClick={() => setShowCertModal(true)}
                className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Add Certification
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.certifications.map((c) => (
                <div key={c.id} className="p-4 border border-zinc-200/80 rounded-xl bg-zinc-50/20 space-y-1.5 flex justify-between items-start">
                  <div>
                    <div className="font-bold text-zinc-800">{c.certification}</div>
                    <div className="text-[11px] text-zinc-500">Issued: {c.issueDate} · Expiry: {c.expiryDate}</div>
                    <div className="text-[11px] text-zinc-400">Verification ID: {c.certificateNo}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${c.status === 'Valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
              {employee.certifications.length === 0 && (
                <div className="col-span-2 py-8 text-center text-zinc-400">No certifications uploaded.</div>
              )}
            </div>
          </div>
        );

      case 'Documents':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Employee Document Vault</h4>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                + Upload Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.documents.map((d) => (
                <div key={d.id} className="p-4 border border-zinc-200/80 rounded-xl bg-zinc-50/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-800">{d.name}</div>
                    <div className="text-[11px] text-zinc-400">Category: {d.category} · Uploaded: {d.uploadDate}</div>
                  </div>
                  <span className="text-emerald-600 font-semibold cursor-pointer">Download</span>
                </div>
              ))}
              {employee.documents.length === 0 && (
                <div className="col-span-2 py-8 text-center text-zinc-400">No documents in vault.</div>
              )}
            </div>
          </div>
        );

      case 'Training & Safety':
        return (
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Safety Induction Log</h4>
            <div className="space-y-3">
              {employee.trainingSafety.map((t) => (
                <div key={t.id} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-800">{t.training}</div>
                    <div className="text-[11px] text-zinc-400">Trainer: {t.trainer} · Date: {t.date}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{t.status}</span>
                </div>
              ))}
              {employee.trainingSafety.length === 0 && (
                <div className="text-center py-6 text-zinc-400">No safety inductions completed.</div>
              )}
            </div>
          </div>
        );

      case 'Attendance':
        return (
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Attendance Calendar Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/20 text-center">
                <div className="text-zinc-400">Present (Current Month)</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">21 Days</div>
              </div>
              <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/20 text-center">
                <div className="text-zinc-400">Absent</div>
                <div className="text-xl font-bold text-red-600 mt-1">1 Day</div>
              </div>
              <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/20 text-center">
                <div className="text-zinc-400">Attendance Rate</div>
                <div className="text-xl font-bold text-indigo-600 mt-1">{employee.attendanceRate}</div>
              </div>
            </div>
          </div>
        );

      case 'Leave':
        return (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Leave Balance & Requests</h4>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Request Leave
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-bold text-zinc-800">Available Balance</h5>
                <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 flex justify-between">
                  <span>Paid Leave Balance</span>
                  <span className="font-bold text-zinc-900">{employee.leaveBalancePaid} Days</span>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 flex justify-between">
                  <span>Sick Leave Balance</span>
                  <span className="font-bold text-zinc-900">{employee.leaveBalanceSick} Days</span>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 flex justify-between">
                  <span>Casual Leave Balance</span>
                  <span className="font-bold text-zinc-900">{employee.leaveBalanceCasual} Days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Performance':
        return (
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">Annual Performance & Safety Ratings</h4>
            <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-800">Safety Compliance Rating</span>
                <span className="font-extrabold text-emerald-600">{employee.performanceRating ? `${employee.performanceRating} / 5.0` : '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-800">Task Completion Rate</span>
                <span className="font-extrabold text-zinc-900">95.4%</span>
              </div>
            </div>
          </div>
        );

      case 'Activity':
        return (
          <div className="space-y-4 text-xs">
            <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">System & Site Activity Log</h4>
            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-zinc-100">
              {employee.activities.map((a, idx) => (
                <div key={idx} className="relative pl-7">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-400 border border-white" />
                  <div className="font-bold text-zinc-800">{a.action}</div>
                  <div className="text-[11px] text-zinc-400">{a.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto text-sm">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
        <Link href="/employees" className="hover:text-black transition-colors">Employees</Link>
        <span>&rarr;</span>
        <span className="text-black font-semibold">{fullName}</span>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-black tracking-tight">{fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  • {employee.status}
                </span>
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">
                {employee.employeeId} · {employee.designation}
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Project: {employee.currentProject} ({employee.currentSite})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/employees/${employee.id}/edit`}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-colors"
            >
              Edit Profile
            </Link>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-colors"
            >
              Assign Project
            </button>
            <button
              onClick={() => handlePersistUpdate({ status: 'Terminated' })}
              className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors border border-red-200"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Card for Tabbed Content */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Horizontal Scrollable Tabs */}
        <div className="flex border-b border-zinc-200 overflow-x-auto bg-zinc-50/30">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors focus:outline-hidden ${
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
          {renderTabContent()}
        </div>
      </div>

      {/* Modal 1: Assign Project */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAssignProjectSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Assign Project & Site</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Select Project</label>
                <select value={newProject} onChange={(e) => setNewProject(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  <option value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</option>
                  <option value="Skyline Gated Villas">Skyline Gated Villas</option>
                  <option value="Lake View Gated Community">Lake View Gated Community</option>
                  <option value="Sunrise Villas">Sunrise Villas</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Select Site</label>
                <select value={newSite} onChange={(e) => setNewSite(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  <option value="Site A">Site A</option>
                  <option value="Site B">Site B</option>
                  <option value="Site Alpha">Site Alpha</option>
                  <option value="Site Beta">Site Beta</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Designation At Site</label>
                <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Reporting Manager</label>
                <input type="text" value={newManager} onChange={(e) => setNewManager(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowAssignModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Save Assignment</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Add Skill */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddSkillSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Verified Skill</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Skill Name</label>
                <input type="text" required placeholder="e.g. AutoCAD, Site Supervision" value={skillName} onChange={(e) => setSkillName(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Proficiency</label>
                <select value={skillProficiency} onChange={(e) => setSkillProficiency(e.target.value as any)} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Years of Experience</label>
                <input type="number" min="0" value={skillExp} onChange={(e) => setSkillExp(Number(e.target.value))} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowSkillModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg">Save Skill</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Add Certification */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddCertSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Certification</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Certification Name</label>
                <input type="text" required placeholder="e.g. OSHA 30-Hour Construction Safety" value={certName} onChange={(e) => setCertName(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Certificate Number</label>
                <input type="text" required placeholder="e.g. OSH-3341" value={certNo} onChange={(e) => setCertNo(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Expiry Date</label>
                <input type="date" required value={certExpiry} onChange={(e) => setCertExpiry(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Issuing Authority</label>
                <input type="text" value={certAuthority} onChange={(e) => setCertAuthority(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowCertModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg">Save Certification</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Upload Document */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddDocSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Upload Document Vault</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Document Title</label>
                <input type="text" required placeholder="e.g. Aadhaar Card Copy.pdf" value={docName} onChange={(e) => setDocName(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Category</label>
                <select value={docCategory} onChange={(e) => setDocCategory(e.target.value as any)} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  <option value="Identity">Identity</option>
                  <option value="Employment">Employment</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowDocModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg">Upload Doc</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 5: Leave Request */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleLeaveSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Request Leave</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Leave Type</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  <option value="Casual">Casual Leave</option>
                  <option value="Paid">Paid Leave</option>
                  <option value="Sick">Sick Leave</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Duration (Days)</label>
                <input type="number" min="1" max="15" value={leaveDays} onChange={(e) => setLeaveDays(Number(e.target.value))} className="w-full border border-zinc-200 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Reason</label>
                <textarea required placeholder="Reason for leave..." value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full border border-zinc-200 p-2 rounded-lg h-20" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button type="button" onClick={() => setShowLeaveModal(false)} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg">Submit Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
