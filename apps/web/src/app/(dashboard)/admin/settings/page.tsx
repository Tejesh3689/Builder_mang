'use client';

import React, { useEffect, useState, useRef, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Select, SelectOption } from '@/components/ui/Select';
import { IANA_TIMEZONES } from '@/lib/validation/companySettings';
import { useCompanySettings } from '@/components/providers/CompanySettingsProvider';

type TabSection = 'general' | 'regional' | 'branding' | 'workforce' | 'inventory' | 'security';

export default function CompanySettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { refreshSettings } = useCompanySettings();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabSection>('general');

  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);

  const loadSettings = async () => {
    setLoading(true);
    setLoadError(null);
    setConflictError(false);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 403) {
        setLoadError('Access Denied. Only system administrators can access Company Settings.');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load company settings from server');
      }
      const json = await res.json();
      if (json.success && json.data) {
        setInitialData(json.data);
        setFormData(json.data);
      } else {
        throw new Error(json.error || 'Failed to load settings');
      }
    } catch (err: any) {
      setLoadError(err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Warn on navigation if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        <div className="h-64 bg-white rounded-xl border border-zinc-200"></div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;
  if (userRole && userRole !== 'ADMIN') {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
        <h2 className="text-xl font-bold text-zinc-900">Access Restricted</h2>
        <p className="text-sm text-zinc-500">You must be an administrator to view or manage company settings.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
        <h2 className="text-xl font-bold text-zinc-900">Failed to Load Settings</h2>
        <p className="text-sm text-zinc-500">{loadError}</p>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGeneralError(null);
  };

  const handleDiscard = () => {
    setFormData(initialData);
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleSave = async () => {
    if (!isDirty || isPending) return;

    setFieldErrors({});
    setGeneralError(null);
    setSuccessToast(null);
    setConflictError(false);

    // Compute changed fields
    const patchPayload: Record<string, any> = { version: initialData.version };
    for (const key of Object.keys(formData)) {
      if (formData[key] !== initialData[key]) {
        patchPayload[key] = formData[key];
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        });

        if (res.status === 409) {
          setConflictError(true);
          return;
        }

        const json = await res.json();
        if (!res.ok) {
          if (json.fieldErrors) {
            setFieldErrors(json.fieldErrors);
            const firstErrField = Object.keys(json.fieldErrors)[0];
            const elem = document.getElementById(firstErrField);
            if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            setGeneralError(json.error || 'Failed to save changes');
          }
          return;
        }

        if (json.success && json.data) {
          setInitialData(json.data);
          setFormData(json.data);
          setSuccessToast('Company settings successfully updated.');
          await refreshSettings();
          setTimeout(() => setSuccessToast(null), 4000);
        }
      } catch (err: any) {
        setGeneralError(err.message || 'Network error occurred while saving.');
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    if (file.size > 512 * 1024) {
      setLogoError('File size exceeds the 512 KB limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setLogoError('Invalid file type. Allowed: PNG, JPG, WEBP (SVG is not supported).');
      return;
    }

    setLogoUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setLogoError(json.error || 'Failed to upload logo');
      } else {
        await refreshSettings();
        setSuccessToast('Company logo updated successfully.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch {
      setLogoError('Failed to upload logo due to a network error.');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    setLogoError(null);
    try {
      const res = await fetch('/api/admin/settings/logo', { method: 'DELETE' });
      if (res.ok) {
        await refreshSettings();
        setSuccessToast('Company logo removed.');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch {
      setLogoError('Failed to remove logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'regional', label: 'Regional & Finance' },
    { id: 'branding', label: 'Branding' },
    { id: 'workforce', label: 'Workforce & Shifts' },
    { id: 'inventory', label: 'Inventory & Approvals' },
    { id: 'security', label: 'Security & Auth' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Company Settings</h1>
          <p className="text-xs text-zinc-500 mt-1">Configure global organization profile, regional standards, and business logic.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isPending}
              className="px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Discard changes
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className={`px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${isDirty && !isPending
              ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>✓ {successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">✕</button>
        </div>
      )}

      {conflictError && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-sm flex items-center justify-between">
          <div>
            <strong>Concurrency Warning:</strong> Settings were modified by another administrator. Reload the latest version to prevent overwriting.
          </div>
          <button
            onClick={loadSettings}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-md shadow-sm ml-4"
          >
            Reload Latest
          </button>
        </div>
      )}

      {generalError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {generalError}
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex border-b border-zinc-200 overflow-x-auto gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabSection)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Body */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Organization & Legal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Legal Registered Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="legalName"
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => handleFieldChange('legalName', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.legalName ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.legalName && <p className="text-xs text-red-600 mt-1">{fieldErrors.legalName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Brand Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.displayName ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.displayName && <p className="text-xs text-red-600 mt-1">{fieldErrors.displayName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Support Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="supportEmail"
                  type="email"
                  value={formData.supportEmail || ''}
                  onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.supportEmail ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.supportEmail && <p className="text-xs text-red-600 mt-1">{fieldErrors.supportEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Primary Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Official Website
                </label>
                <input
                  id="website"
                  type="text"
                  placeholder="https://example.com"
                  value={formData.website || ''}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.website ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.website && <p className="text-xs text-red-600 mt-1">{fieldErrors.website}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  GSTIN
                </label>
                <input
                  id="gstin"
                  type="text"
                  placeholder="29ABCDE1234F1Z5"
                  value={formData.gstin || ''}
                  onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm uppercase outline-none ${fieldErrors.gstin ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.gstin && <p className="text-xs text-red-600 mt-1">{fieldErrors.gstin}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  PAN
                </label>
                <input
                  id="pan"
                  type="text"
                  placeholder="ABCDE1234F"
                  value={formData.pan || ''}
                  onChange={(e) => handleFieldChange('pan', e.target.value.toUpperCase())}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm uppercase outline-none ${fieldErrors.pan ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.pan && <p className="text-xs text-red-600 mt-1">{fieldErrors.pan}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Postal Pincode
                </label>
                <input
                  id="pincode"
                  type="text"
                  placeholder="560001"
                  value={formData.pincode || ''}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.pincode ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.pincode && <p className="text-xs text-red-600 mt-1">{fieldErrors.pincode}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Registered Address
                </label>
                <input
                  id="addressLine"
                  type="text"
                  value={formData.addressLine || ''}
                  onChange={(e) => handleFieldChange('addressLine', e.target.value)}
                  placeholder="Building No, Street, Landmark"
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* REGIONAL & FINANCE TAB */}
        {activeTab === 'regional' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Regional & Financial Preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Currency <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.currency || 'INR'}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                >
                  <SelectOption value="INR">INR (₹ - Indian Rupee)</SelectOption>
                  <SelectOption value="USD">USD ($ - US Dollar)</SelectOption>
                  <SelectOption value="AED">AED (د.إ - UAE Dirham)</SelectOption>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  System Timezone <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.timezone || 'Asia/Kolkata'}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                >
                  {IANA_TIMEZONES.map((tz) => (
                    <SelectOption key={tz} value={tz}>
                      {tz}
                    </SelectOption>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Standard Date Format <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) => handleFieldChange('dateFormat', e.target.value)}
                >
                  <SelectOption value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/08/2026)</SelectOption>
                  <SelectOption value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/15/2026)</SelectOption>
                  <SelectOption value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-15)</SelectOption>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Fiscal Year Starting Month <span className="text-red-500">*</span>
                </label>
                <Select
                  value={String(formData.fiscalYearStartMonth || 4)}
                  onChange={(e) => handleFieldChange('fiscalYearStartMonth', Number(e.target.value))}
                >
                  <SelectOption value="1">January</SelectOption>
                  <SelectOption value="4">April (India standard)</SelectOption>
                  <SelectOption value="7">July</SelectOption>
                  <SelectOption value="10">October</SelectOption>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Week Starts On <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.weekStartsOn || 'MONDAY'}
                  onChange={(e) => handleFieldChange('weekStartsOn', e.target.value)}
                >
                  <SelectOption value="MONDAY">Monday</SelectOption>
                  <SelectOption value="SUNDAY">Sunday</SelectOption>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* BRANDING TAB */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Company Logo & Visual Identity</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="w-24 h-24 rounded-2xl bg-white border border-zinc-300 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/settings/logo?t=${Date.now()}`}
                  alt="Company Logo Preview"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-xs text-zinc-400 font-medium">
                  No Logo
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {logoUploading ? 'Uploading...' : 'Upload New Logo'}
                  </button>
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={handleLogoRemove}
                    className="px-3.5 py-2 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-lg"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  Accepted formats: <strong>PNG, JPG, WEBP</strong> (SVGs not permitted). Maximum file size: <strong>512 KB</strong>.
                </p>
                {logoError && <p className="text-xs text-red-600 font-medium">{logoError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* WORKFORCE TAB */}
        {activeTab === 'workforce' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Workforce & Shift Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Shift Start Time (HH:mm) <span className="text-red-500">*</span>
                </label>
                <input
                  id="shiftStart"
                  type="time"
                  value={formData.shiftStart || '09:00'}
                  onChange={(e) => handleFieldChange('shiftStart', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.shiftStart ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.shiftStart && <p className="text-xs text-red-600 mt-1">{fieldErrors.shiftStart}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Shift End Time (HH:mm) <span className="text-red-500">*</span>
                </label>
                <input
                  id="shiftEnd"
                  type="time"
                  value={formData.shiftEnd || '18:00'}
                  onChange={(e) => handleFieldChange('shiftEnd', e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.shiftEnd ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                {fieldErrors.shiftEnd && <p className="text-xs text-red-600 mt-1">{fieldErrors.shiftEnd}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Late Arrival Grace Minutes <span className="text-red-500">*</span>
                </label>
                <input
                  id="lateGraceMinutes"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.lateGraceMinutes ?? 15}
                  onChange={(e) => handleFieldChange('lateGraceMinutes', Number(e.target.value))}
                  className={`w-full px-3.5 py-2 border rounded-lg text-sm outline-none ${fieldErrors.lateGraceMinutes ? 'border-red-500 bg-red-50/30' : 'border-zinc-300 focus:border-amber-500'
                    }`}
                />
                <p className="text-[11px] text-zinc-500 mt-1">Arrivals beyond this grace window are recorded as LATE.</p>
                {fieldErrors.lateGraceMinutes && <p className="text-xs text-red-600 mt-1">{fieldErrors.lateGraceMinutes}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Weekly Off Day
                </label>
                <Select
                  value={formData.weeklyOffDays || 'SUNDAY'}
                  onChange={(e) => handleFieldChange('weeklyOffDays', e.target.value)}
                >
                  <SelectOption value="SUNDAY">Sunday</SelectOption>
                  <SelectOption value="SATURDAY">Saturday</SelectOption>
                  <SelectOption value="FRIDAY">Friday</SelectOption>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY & APPROVALS TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Inventory Management & Approval Rules</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(formData.allowNegativeStock)}
                  onChange={(e) => handleFieldChange('allowNegativeStock', e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-bold text-zinc-900 block">Allow Negative Stock Issuance</span>
                  <span className="text-xs text-zinc-500 block mt-0.5">
                    When disabled, stock issues will be strictly rejected if available warehouse quantity is insufficient.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(formData.requireMaterialRequestApproval)}
                  onChange={(e) => handleFieldChange('requireMaterialRequestApproval', e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-bold text-zinc-900 block">Require Material Request Approvals</span>
                  <span className="text-xs text-zinc-500 block mt-0.5">
                    When disabled, submitted material requests are automatically marked APPROVED and ready for immediate issuance.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-zinc-900">Authentication & Password Security Policy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Session Inactivity Timeout (Minutes)
                </label>
                <input
                  id="sessionTimeoutMinutes"
                  type="number"
                  min="15"
                  max="1440"
                  value={formData.sessionTimeoutMinutes ?? 480}
                  onChange={(e) => handleFieldChange('sessionTimeoutMinutes', Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">Applies to newly issued user sessions upon next sign-in.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Minimum Password Length
                </label>
                <input
                  id="passwordMinLength"
                  type="number"
                  min="8"
                  max="32"
                  value={formData.passwordMinLength ?? 8}
                  onChange={(e) => handleFieldChange('passwordMinLength', Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(formData.passwordRequireUppercase)}
                  onChange={(e) => handleFieldChange('passwordRequireUppercase', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-700">Require at least one uppercase letter (A-Z)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(formData.passwordRequireNumber)}
                  onChange={(e) => handleFieldChange('passwordRequireNumber', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-700">Require at least one numeric digit (0-9)</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(formData.passwordRequireSpecial)}
                  onChange={(e) => handleFieldChange('passwordRequireSpecial', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
                />
                <span className="text-sm text-zinc-700">Require at least one special symbol (!@#$%^&*)</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
