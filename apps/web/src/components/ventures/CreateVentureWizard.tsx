'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Calendar, Users, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

interface CreateVentureWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVenture: any) => void;
}

export function CreateVentureWizard({ isOpen, onClose, onSuccess }: CreateVentureWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  // Fetch employees from DB for leadership dropdowns
  useEffect(() => {
    if (isOpen) {
      fetch('/api/employees')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEmployees(data.data);
          }
        })
        .catch((err) => console.error('Failed to fetch employees:', err));
    }
  }, [isOpen]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: `VNT-2026-${Math.floor(100 + Math.random() * 900)}`,
    type: 'RESIDENTIAL',
    description: '',
    status: 'ACTIVE',
    regAddressLine1: '',
    regCity: 'Vijayawada',
    regState: 'Andhra Pradesh',
    regPincode: '520008',
    siteAddressLine1: '',
    siteCity: 'Vijayawada',
    siteState: 'Andhra Pradesh',
    sitePincode: '520010',
    latitude: '16.5062',
    longitude: '80.6480',
    planningStartDate: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletionDate: '',
    estimatedBudget: '82000000',
    projectManagerId: '',
    siteManagerId: '',
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && !formData.name) {
      setError('Venture Name is required.');
      return;
    }
    setError('');
    if (step < 5) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || 'Failed to create venture');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-700" /> Create New Operational Venture
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Multi-step setup wizard for construction project container</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="px-6 py-3 bg-zinc-50/20 border-b border-zinc-200 flex justify-between items-center text-xs">
          {[
            { num: 1, label: 'Basic Info', icon: Building2 },
            { num: 2, label: 'Location', icon: MapPin },
            { num: 3, label: 'Timeline', icon: Calendar },
            { num: 4, label: 'Leadership', icon: Users },
            { num: 5, label: 'Review', icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            const active = step === s.num;
            const completed = step > s.num;
            return (
              <div key={s.num} className={`flex items-center gap-1.5 font-medium ${active ? 'text-amber-700 font-bold' : completed ? 'text-emerald-600' : 'text-zinc-450'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${active ? 'bg-[#d97706] text-white' : completed ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40' : 'bg-zinc-150 text-zinc-400'}`}>
                  {completed ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Step 1 — Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Venture Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Green Heights Luxury Apartments"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Venture Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-amber-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Venture Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="VILLA">Villa</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="PLOT_DEVELOPMENT">Plot Development</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="RENOVATION">Renovation</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Estimated Budget (INR)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="e.g. 82000000"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Project Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Operational scope, key features, structural overview..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Step 2 — Location Setup</h3>
              
              <div className="p-3 bg-amber-550/10 border border-amber-200 rounded-lg text-xs text-amber-800">
                Separating Registered Office Address and Physical Construction Site Address ensures site-specific material logistics and compliance.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registered Address */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" /> Registered Address
                  </h4>
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.regAddressLine1}
                    onChange={(e) => setFormData({ ...formData, regAddressLine1: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.regCity}
                      onChange={(e) => setFormData({ ...formData, regCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.regState}
                      onChange={(e) => setFormData({ ...formData, regState: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={formData.regPincode}
                    onChange={(e) => setFormData({ ...formData, regPincode: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                  />
                </div>

                {/* Construction Site Address */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Construction Site Address
                  </h4>
                  <input
                    type="text"
                    placeholder="Site Address / Land Survey No."
                    value={formData.siteAddressLine1}
                    onChange={(e) => setFormData({ ...formData, siteAddressLine1: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Site City"
                      value={formData.siteCity}
                      onChange={(e) => setFormData({ ...formData, siteCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={formData.sitePincode}
                      onChange={(e) => setFormData({ ...formData, sitePincode: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-xs text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Geo Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Timeline */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Step 3 — Timeline & Lifecycle Status</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Project Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Expected Completion Date</label>
                  <input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Initial Lifecycle Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st })}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        formData.status === st
                          ? 'bg-[#d97706] border-amber-600 text-white shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Project Leadership */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Step 4 — Project Leadership</h3>
              <p className="text-xs text-zinc-500">Leadership fields reference global employee records for full operational traceability.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Project Manager</label>
                  <select
                    value={formData.projectManagerId}
                    onChange={(e) => setFormData({ ...formData, projectManagerId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} (#{emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Lead Site Engineer</label>
                  <select
                    value={formData.siteManagerId}
                    onChange={(e) => setFormData({ ...formData, siteManagerId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} (#{emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Auto Provisioning */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider">Step 5 — Summary & Auto Provisioning</h3>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                  <span className="text-sm font-bold text-zinc-900">{formData.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/10 text-amber-800 border border-amber-250">
                    {formData.code}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 text-xs text-zinc-600 gap-y-1.5">
                  <div>Type: <span className="font-semibold text-zinc-900">{formData.type}</span></div>
                  <div>Status: <span className="font-semibold text-emerald-600">{formData.status}</span></div>
                  <div>Site City: <span className="font-semibold text-zinc-900">{formData.siteCity}</span></div>
                  <div>Budget: <span className="font-semibold text-emerald-600">₹{(Number(formData.estimatedBudget)/10000000).toFixed(2)} Cr</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-550/10 border border-emerald-250 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Configured Scoped Channels
                </p>
                <p className="text-emerald-700">
                  Creating this venture will automatically provision scoped Chat Channels (`General`, `Site Team`, `Materials`), initial inventory tracking, document repository folders, and activity logging.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50/50">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              step === 1 ? 'opacity-40 cursor-not-allowed text-zinc-450' : 'text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              {loading ? 'Creating Venture...' : 'Launch Venture Container'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
