'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddEmployeeForm() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Mason');
  const [venture, setVenture] = useState('Green Heights Luxury Apartments');
  const [supervisor, setSupervisor] = useState('Krishna Rao');
  const [joiningDate, setJoiningDate] = useState('');
  const [employmentType, setEmploymentType] = useState<'Full-Time Contractor' | 'Permanent' | 'Daily Wage'>('Permanent');

  const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string; base64?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/pdf',
            base64: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

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
        email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase() || 'site'}@naprocs.in`,
        designation: role,
        department: deptMap[role] || 'Site Operations',
        status: 'ACTIVE',
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        onboardingStage: 'Active',
        onboardingStatus: 'Active',
        reportingManager: supervisor,
        employmentType,
        ventureId: 'none', // Project assignments handled in Slice 2
      };

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create employee in database.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/employees');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the employee.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto text-sm space-y-4">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
        <Link href="/employees" className="hover:text-black transition-colors">Employees</Link>
        <span>&rarr;</span>
        <span className="text-black font-semibold">Add Employee</span>
      </div>

      {/* Error / Success Banners */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
          Employee profile added successfully! Redirecting to directory...
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-zinc-200/60 bg-zinc-50/30">
          <h2 className="text-sm font-extrabold text-black tracking-tight">Add Employee</h2>
        </div>

        {/* Card Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* PERSONAL DETAILS Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-extrabold text-[#d97706] tracking-wider uppercase font-mono">
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-zinc-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Sunita Rao"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white placeholder-zinc-400 text-zinc-800"
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
                  placeholder="+91"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white placeholder-zinc-400 text-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-zinc-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. sunita.rao@naprocs.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white placeholder-zinc-400 text-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="employmentType" className="block text-xs font-bold text-zinc-700 mb-1">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="employmentType"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Full-Time Contractor">Full-Time Contractor</option>
                  <option value="Daily Wage">Daily Wage</option>
                </select>
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                >
                  <option value="Green Heights Luxury Apartments">Green Heights Luxury Apartments</option>
                  <option value="Skyline Gated Villas">Skyline Gated Villas</option>
                  <option value="Lake View Gated Community">Lake View Gated Community</option>
                  <option value="Sunrise Villas">Sunrise Villas</option>
                  <option value="Riverfront Towers">Riverfront Towers</option>
                  <option value="Unassigned">Unassigned / Awaiting Deployment</option>
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
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
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
                <label htmlFor="joiningDate" className="block text-xs font-bold text-zinc-700 mb-1">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="joiningDate"
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-800"
                />
              </div>
            </div>
          </div>

          {/* DOCUMENTS Section */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-extrabold text-[#d97706] tracking-wider uppercase font-mono">
              Documents
            </h3>
            <input
              type="file"
              multiple
              id="employee-docs-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="employee-docs-input"
              className="block border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <div className="text-xs font-semibold text-zinc-700">Click to upload identity or safety documents</div>
              <div className="text-[10px] text-zinc-400 mt-1">Aadhaar Card, PAN, Offer Letter, or certificates (PDF/JPG, Max 5MB)</div>
            </label>

            {/* Selected Files list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-700">Selected Files:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-lg text-xs font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Link
              href="/employees"
              className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || success}
              className="px-5 py-2 bg-[#d97706] hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>{isLoading ? 'Creating...' : 'Add Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
