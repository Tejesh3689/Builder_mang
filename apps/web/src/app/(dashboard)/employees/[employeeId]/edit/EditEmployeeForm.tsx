'use client';

import React, { useState, useEffect } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmployeeProfile } from '@/lib/types';
import { api } from '@/lib/api';
import { getSafeReturnTo } from '@/lib/navigation';

interface EditEmployeeFormProps {
  employeeId: string;
}

export default function EditEmployeeForm({ employeeId }: EditEmployeeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get('returnTo'), `/employees/${employeeId}`);

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
  
  const [seniorEmployees, setSeniorEmployees] = useState<{id: string, name: string, designation: string}[]>([]);

  useEffect(() => {
    async function fetchManagers() {
      try {
        const data = await api.get<{success: boolean, data: any[]}>('/api/employees');
        if (data.success && data.data) {
          // Filter to senior roles or managers
          const managers = data.data
            .filter((e: any) => 
              e.id !== employee?.id &&
              e.status !== 'TERMINATED' &&
              (e.designation?.toLowerCase().includes('manager') || 
               e.designation?.toLowerCase().includes('director') || 
               e.designation?.toLowerCase().includes('supervisor') ||
               e.designation?.toLowerCase().includes('lead'))
            )
            .map((e: any) => ({
              id: e.id,
              name: `${e.firstName} ${e.lastName}`,
              designation: e.designation
            }));
          setSeniorEmployees(managers);
        }
      } catch (err) {
        console.error('Failed to fetch managers:', err);
      }
    }
    fetchManagers();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const json = await api.get<{success: boolean, data: any}>(`/api/employees/${employeeId}`);
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
          });

          setFirstName(item.firstName);
          setLastName(item.lastName || '');
          setPhone(item.phone || '');
          setEmail(item.email || '');
          setRole(item.designation);
          setVenture(activeAssignment?.venture?.name || '');
          setSupervisor(item.reportingManagerId || '—');
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
        reportingManagerId: supervisor !== '—' ? supervisor : null,
        employmentType,
      };

      const json = await api.patch<{success: boolean, error?: string}>(`/api/employees/${employee.id}`, payload);

      if (!json.success) {
        throw new Error(json.error || 'Failed to update employee in database.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(returnTo);
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <SelectOption value="Mason">Mason</SelectOption>
                  <SelectOption value="Electrician">Electrician</SelectOption>
                  <SelectOption value="Plumber">Plumber</SelectOption>
                  <SelectOption value="Carpenter">Carpenter</SelectOption>
                  <SelectOption value="Supervisor">Supervisor</SelectOption>
                  <SelectOption value="Site Engineer">Site Engineer</SelectOption>
                  <SelectOption value="Project Manager">Project Manager</SelectOption>
                  <SelectOption value="Safety Officer">Safety Officer</SelectOption>
                  <SelectOption value="Quantity Surveyor">Quantity Surveyor</SelectOption>
                </Select>
              </div>

              <div>
                <label htmlFor="venture" className="block text-xs font-bold text-zinc-700 mb-1">
                  Assign Venture <span className="text-red-500">*</span>
                </label>
                <Select
                  id="venture"
                  value={venture}
                  onChange={(e) => setVenture(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <SelectOption value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</SelectOption>
                  <SelectOption value="Skyline Gated Villas">Skyline Gated Villas</SelectOption>
                  <SelectOption value="Lake View Gated Community">Lake View Gated Community</SelectOption>
                  <SelectOption value="Sunrise Villas">Sunrise Villas</SelectOption>
                  <SelectOption value="Riverfront Towers">Riverfront Towers</SelectOption>
                  <SelectOption value="Unassigned">Unassigned</SelectOption>
                </Select>
              </div>

              <div>
                <label htmlFor="supervisor" className="block text-xs font-bold text-zinc-700 mb-1">
                  Reporting Supervisor <span className="text-red-500">*</span>
                </label>
                <Select
                  id="supervisor"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <SelectOption value="—">None / Direct Report</SelectOption>
                  {seniorEmployees.map((emp, idx) => (
                    <SelectOption key={idx} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </SelectOption>
                  ))}
                  {!seniorEmployees.some(e => e.id === supervisor) && supervisor !== '—' && supervisor && (
                    <SelectOption value={supervisor}>Current ID: {supervisor}</SelectOption>
                  )}
                </Select>
              </div>

              <div>
                <label htmlFor="employmentType" className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <Select
                  id="employmentType"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <SelectOption value="Permanent">Permanent</SelectOption>
                  <SelectOption value="Full-Time Contractor">Full-Time Contractor</SelectOption>
                  <SelectOption value="Daily Wage">Daily Wage</SelectOption>
                </Select>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Status <span className="text-red-500">*</span>
                </label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <SelectOption value="Active">Active</SelectOption>
                  <SelectOption value="On Leave">On Leave</SelectOption>
                  <SelectOption value="Terminated">Terminated</SelectOption>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-5 py-2 bg-[#d97706] hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
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
