'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployeeProfile } from '@/lib/mockDatabase';

interface EditEmployeeFormProps {
  employeeId: string;
}

export default function EditEmployeeForm({ employeeId }: EditEmployeeFormProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Mason');
  const [venture, setVenture] = useState('');
  const [supervisor, setSupervisor] = useState('—');
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Terminated'>('Active');
  const [employmentType, setEmploymentType] = useState<'Full-Time Contractor' | 'Permanent' | 'Daily Wage'>('Permanent');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

          setFirstName(item.firstName);
          setLastName(item.lastName || '');
          setPhone(item.phone || '');
          setEmail(item.email || '');
          setRole(item.designation);
          setVenture(activeAssignment?.venture?.name || '');
          setSupervisor(item.reportingManager || '—');
          setStatus(item.status === 'ACTIVE' ? 'Active' : item.status === 'ON_LEAVE' ? 'On Leave' : 'Terminated');
          setEmploymentType(item.employmentType || 'Permanent');
        }
      } catch (err) {
        console.error('Failed to load employee details for edit:', err);
      }
    }
    loadEmployee();
  }, [employeeId]);

  if (!employee) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs">
        Employee profile not found.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const deptMap: Record<string, string> = {
        Mason: 'Site Operations',
        Electrician: 'Site Operations',
        Plumber: 'Site Operations',
        Carpenter: 'Site Operations',
        Supervisor: 'Site Operations',
        'Site Engineer': 'Civil Engineering',
        'Project Manager': 'Project Management',
        'Safety Officer': 'Quality Assurance',
        'Quantity Surveyor': 'Planning & Civil',
      };

      const payload = {
        firstName,
        lastName,
        phone,
        email,
        designation: role,
        department: deptMap[role] || 'Site Operations',
        status: status === 'Active' ? 'ACTIVE' : status === 'On Leave' ? 'ON_LEAVE' : 'TERMINATED',
        reportingManager: supervisor,
        employmentType,
      };

      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update employee in database.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/employees/${employee.id}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the profile.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto text-sm space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
        <Link href="/employees" className="hover:text-black transition-colors">Employees</Link>
        <span>&rarr;</span>
        <Link href={`/employees/${employee.id}`} className="hover:text-black transition-colors">{firstName} {lastName}</Link>
        <span>&rarr;</span>
        <span className="text-black font-semibold">Edit Profile</span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
          Employee profile updated successfully! Redirecting...
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/60 bg-zinc-50/30">
          <h2 className="text-sm font-extrabold text-black tracking-tight">Edit Employee: {employee.employeeId}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* PERSONAL DETAILS Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-extrabold text-[#d97706] tracking-wider uppercase font-mono">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-bold text-zinc-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-bold text-zinc-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-zinc-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-zinc-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                />
              </div>
            </div>
          </div>

          {/* ROLE & ASSIGNMENT Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-extrabold text-[#d97706] tracking-wider uppercase font-mono">
              Role & Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="role" className="block text-xs font-bold text-zinc-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Mason">Mason</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Quantity Surveyor">Quantity Surveyor</option>
                </select>
              </div>

              <div>
                <label htmlFor="venture" className="block text-xs font-bold text-zinc-700 mb-1">
                  Assign Venture <span className="text-red-500">*</span>
                </label>
                <select
                  id="venture"
                  value={venture}
                  onChange={(e) => setVenture(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</option>
                  <option value="Skyline Gated Villas">Skyline Gated Villas</option>
                  <option value="Lake View Gated Community">Lake View Gated Community</option>
                  <option value="Sunrise Villas">Sunrise Villas</option>
                  <option value="Riverfront Towers">Riverfront Towers</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>

              <div>
                <label htmlFor="supervisor" className="block text-xs font-bold text-zinc-700 mb-1">
                  Reporting Supervisor <span className="text-red-500">*</span>
                </label>
                <select
                  id="supervisor"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Krishna Rao">Krishna Rao</option>
                  <option value="Suresh Kumar">Suresh Kumar</option>
                  <option value="Manoj Verma">Manoj Verma</option>
                  <option value="Arjun Sharma">Arjun Sharma</option>
                  <option value="Ajay Rao">Ajay Rao</option>
                  <option value="Rajesh Kumar">Rajesh Kumar</option>
                  <option value="—">None / Direct Report</option>
                </select>
              </div>

              <div>
                <label htmlFor="employmentType" className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="employmentType"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Full-Time Contractor">Full-Time Contractor</option>
                  <option value="Daily Wage">Daily Wage</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Link
              href={`/employees/${employee.id}`}
              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-5 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>{isLoading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
