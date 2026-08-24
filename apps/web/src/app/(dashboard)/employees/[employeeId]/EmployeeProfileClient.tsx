'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmployeeProfile, Skill, Certification, Document } from '@/lib/mockDatabase';

interface EmployeeProfileProps {
  employeeId: string;
  userRole?: string;
  sessionName?: string;
}

export default function EmployeeProfileClient({ employeeId, userRole = 'ADMIN', sessionName = '' }: EmployeeProfileProps) {
  const isSupervisor = userRole === 'SUPERVISOR';
  const isManager = userRole === 'MANAGER';
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canDeactivate = userRole === 'ADMIN';
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [ventureOptions, setVentureOptions] = useState<{ id: string; name: string }[]>([]);
  const [actionError, setActionError] = useState('');

  // Load real ventures for the "Assign Project" dropdown, so submissions reference a
  // venture ID that actually exists instead of a hardcoded placeholder.
  useEffect(() => {
    async function loadVentures() {
      try {
        const res = await fetch('/api/ventures');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setVentureOptions(json.data.map((v: any) => ({ id: v.id, name: v.name })));
        }
      } catch (err) {
        console.error('Failed to load ventures for assignment dropdown:', err);
      }
    }
    loadVentures();
  }, []);

  // Load from API
  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const item = json.data;
          const activeAssignment = item.assignments?.find((a: any) => a.status === 'ACTIVE');
          
          setEmployee({
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
            reportingManager: item.reportingManager || '—',
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
          });
        }
      } catch (err) {
        console.error('Failed to load employee profile:', err);
      }
    }
    loadEmployee();
  }, [employeeId]);

  // Modal / Action states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Assignment states — newProject holds the real venture ID (populated once ventureOptions loads)
  const [newProject, setNewProject] = useState('');
  const [newSite, setNewSite] = useState('Site A');
  const [newRole, setNewRole] = useState('Site Engineer');
  const [newManager, setNewManager] = useState('Suresh Verma');
  const [newDuration, setNewDuration] = useState('Feb 2026 - Present');

  useEffect(() => {
    if (!newProject && ventureOptions.length > 0) {
      setNewProject(ventureOptions[0].id);
    }
  }, [ventureOptions, newProject]);

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
  const [selectedDocFile, setSelectedDocFile] = useState<{ name: string; type: string } | null>(null);

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
  ];

  // Helper to persist updates
  const handlePersistUpdate = async (updatedObj: Partial<EmployeeProfile>) => {
    if (!employee) return;
    try {
      // Map status
      let backendStatus = undefined;
      if (updatedObj.status) {
        backendStatus = updatedObj.status === 'Active' ? 'ACTIVE' : updatedObj.status === 'On Leave' ? 'ON_LEAVE' : 'TERMINATED';
      }

      const payload = {
        firstName: updatedObj.firstName,
        lastName: updatedObj.lastName,
        phone: updatedObj.phone,
        email: updatedObj.email,
        designation: updatedObj.designation,
        department: updatedObj.department,
        status: backendStatus,
        joiningDate: updatedObj.joiningDate,
        reportingManager: updatedObj.reportingManager,
        employmentType: updatedObj.employmentType,
        onboardingStage: updatedObj.onboardingStage,
        onboardingStatus: updatedObj.onboardingStatus,
      };

      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const item = json.data;
        const activeAssignment = item.assignments?.find((a: any) => a.status === 'ACTIVE');

        setEmployee((prev) => {
          if (!prev) return null;
          return {
            ...prev,
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
            reportingManager: item.reportingManager || '—',
            employmentType: item.employmentType || 'Permanent',
          };
        });
      }
    } catch (err) {
      console.error('Failed to update employee profile in database:', err);
    }
  };

  // Actions
  const handleAssignProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !newProject) return;
    setActionError('');

    const projectName = ventureOptions.find((v) => v.id === newProject)?.name || newProject;

    try {
      const res = await fetch(`/api/employees/${employee.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: newProject,
          roleAtSite: newRole,
          accessLevel: 'STANDARD'
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Optimistically update UI
        const updatedHistory = employee.assignmentHistory.map((a: any) => {
          if (a.status === 'Active') return { ...a, status: 'Completed' as const };
          return a;
        });

        updatedHistory.unshift({
          id: json.data.id || `assign-${Date.now()}`,
          project: projectName,
          site: newSite,
          role: newRole,
          duration: 'Just now - Present',
          status: 'Active' as const,
        });

        setEmployee((prev: any) => ({
          ...prev,
          currentProject: projectName,
          currentSite: newSite,
          designation: newRole,
          reportingManager: newManager,
          assignmentHistory: updatedHistory,
          activities: [
            { action: `Assigned to ${projectName} (${newSite}) as ${newRole}`, timestamp: 'Just now' },
            ...prev.activities,
          ],
        }));
        setShowAssignModal(false);
      } else {
        setActionError(json.error || 'Failed to save assignment.');
      }
    } catch (err) {
      console.error('Failed to assign project', err);
      setActionError('Failed to save assignment. Please try again.');
    }
  };

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName || !employee) return;
    setActionError('');

    try {
      const res = await fetch(`/api/employees/${employee.id}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: skillName,
          category: skillCategory,
          proficiency: skillProficiency,
          experienceYears: skillExp,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEmployee((prev: any) => ({
          ...prev,
          skills: [...prev.skills, {
            ...json.data,
            verificationStatus: 'Verified',
            verifiedBy: 'HR Admin'
          }],
          activities: [
            { action: `Added skill "${skillName}" (${skillProficiency})`, timestamp: 'Just now' },
            ...prev.activities,
          ],
        }));
        setSkillName('');
        setShowSkillModal(false);
      } else {
        setActionError(json.error || 'Failed to save skill.');
      }
    } catch (err) {
      console.error('Failed to add skill', err);
      setActionError('Failed to save skill. Please try again.');
    }
  };

  const handleAddCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName || !certNo || !employee) return;
    setActionError('');

    try {
      const res = await fetch(`/api/employees/${employee.id}/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification: certName,
          certificateNo: certNo,
          issueDate: certIssue || new Date().toISOString().split('T')[0],
          expiryDate: certExpiry,
          authority: certAuthority || 'National Safety Agency',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEmployee((prev: any) => ({
          ...prev,
          certifications: [...prev.certifications, {
            ...json.data,
            status: 'Valid' // optimistic logic
          }],
          activities: [
            { action: `Added safety certification "${certName}"`, timestamp: 'Just now' },
            ...prev.activities,
          ],
        }));
        setCertName('');
        setCertNo('');
        setShowCertModal(false);
      } else {
        setActionError(json.error || 'Failed to save certification.');
      }
    } catch (err) {
      console.error('Failed to add cert', err);
      setActionError('Failed to save certification. Please try again.');
    }
  };

  const handleAddDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !employee) return;
    setActionError('');

    try {
      const res = await fetch(`/api/employees/${employee.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          fileType: docFileType,
          fileUrl: '/docs/placeholder.pdf'
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEmployee((prev: any) => ({
          ...prev,
          documents: [...prev.documents, {
            ...json.data,
            uploadDate: new Date().toISOString().split('T')[0]
          }],
          activities: [
            { action: `Uploaded document "${docName}" under ${docCategory}`, timestamp: 'Just now' },
            ...prev.activities,
          ],
        }));
        setDocName('');
        setSelectedDocFile(null);
        setShowDocModal(false);
      } else {
        setActionError(json.error || 'Failed to upload document.');
      }
    } catch (err) {
      console.error('Failed to add document', err);
      setActionError('Failed to upload document. Please try again.');
    }
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
              {canEdit && (
                <button
                  onClick={() => setShowSkillModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
                >
                  Add Skill
                </button>
              )}
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
              {canEdit && (
                <button
                  onClick={() => setShowCertModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
                >
                  Add Certification
                </button>
              )}
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
              {canEdit && (
                <button
                  onClick={() => setShowDocModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-black bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200"
                >
                  Upload Document
                </button>
              )}
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
            {canEdit && (
              <>
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
              </>
            )}
            {canDeactivate && (
              <button
                onClick={() => handlePersistUpdate({ status: 'Terminated' })}
                className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors border border-red-200"
              >
                Deactivate
              </button>
            )}
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
          {renderTabContent()}
        </div>
      </div>

      {/* Modal 1: Assign Project */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAssignProjectSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Assign Project & Site</h3>
            {actionError && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{actionError}</p>}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Select Project</label>
                <select value={newProject} onChange={(e) => setNewProject(e.target.value)} disabled={ventureOptions.length === 0} className="w-full border border-zinc-200 p-2 rounded-lg bg-white">
                  {ventureOptions.length === 0 && <option value="">Loading ventures...</option>}
                  {ventureOptions.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
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
              <button type="button" onClick={() => { setShowAssignModal(false); setActionError(''); }} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
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
            {actionError && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{actionError}</p>}
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
              <button type="button" onClick={() => { setShowSkillModal(false); setActionError(''); }} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Save Skill</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Add Certification */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddCertSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Add Certification</h3>
            {actionError && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{actionError}</p>}
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
              <button type="button" onClick={() => { setShowCertModal(false); setActionError(''); }} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Save Certification</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Upload Document */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddDocSubmit} className="bg-white rounded-xl border border-zinc-200 shadow-lg p-5 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Upload Document Vault</h3>
            {actionError && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{actionError}</p>}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Select File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSelectedDocFile({ name: file.name, type: file.type });
                      setDocName(file.name);
                      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
                      setDocFileType(ext);
                    }
                  }}
                  className="w-full border border-zinc-200 p-2 rounded-lg"
                />
              </div>
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
              <button type="button" onClick={() => { setShowDocModal(false); setActionError(''); }} className="px-3.5 py-1.5 border border-zinc-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg">Upload Doc</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
