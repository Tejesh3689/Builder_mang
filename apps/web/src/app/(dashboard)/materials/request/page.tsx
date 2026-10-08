'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, newIdempotencyKey } from '@/lib/api';

export default function MaterialRequestPage() {
  const router = useRouter();

  const [ventures, setVentures] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [ventureId, setVentureId] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [remarks, setRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per request being filled in: a retry or double-submit of the same form is deduplicated server-side.
  const idempotencyKey = useRef('');
  const inFlight = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const vRes = await api.get<{success: boolean, data: any[]}>('/api/ventures');
        const mRes = await api.get<{success: boolean, data: any[]}>('/api/materials');

        if (vRes.success && Array.isArray(vRes.data)) setVentures(vRes.data);
        if (mRes.success && Array.isArray(mRes.data)) setMaterials(mRes.data);
      } catch (err) {
        console.error('Failed to load form data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventureId || !materialId || !quantity || inFlight.current) return;

    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<{success: boolean, error?: string}>('/api/materials/requests', {
        ventureId,
        idempotencyKey: (idempotencyKey.current ||= newIdempotencyKey()),
        priority,
        requiredDate: requiredDate || null,
        remarks,
        items: [
          {
            materialId,
            quantity: parseFloat(quantity)
          }
        ]
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed submitting request');
      }

      router.push('/materials/requests');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
      inFlight.current = false;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Loading Request Form...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-3">
        <Link href="/materials" className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors border border-zinc-200 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Request Materials</h1>
          <p className="text-sm text-zinc-500">Submit a request for site materials</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Project / Venture</label>
                <select 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white"
                  value={ventureId}
                  onChange={e => setVentureId(e.target.value)}
                  required
                >
                  <option value="">Select venture</option>
                  {ventures.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Material Needed</label>
                <select 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white"
                  value={materialId}
                  onChange={e => setMaterialId(e.target.value)}
                  required
                >
                  <option value="">Select material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unitOfMeasure?.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Quantity Required</label>
                  <input 
                    type="number" 
                    min="0.1"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Required By Date</label>
                  <input 
                    type="date" 
                    value={requiredDate}
                    onChange={e => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Priority</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" checked={priority === 'LOW'} onChange={() => setPriority('LOW')} className="text-black focus:ring-black" />
                    <span className="text-sm text-zinc-700">Low</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" checked={priority === 'NORMAL'} onChange={() => setPriority('NORMAL')} className="text-black focus:ring-black" />
                    <span className="text-sm text-zinc-700">Normal</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" checked={priority === 'URGENT'} onChange={() => setPriority('URGENT')} className="text-black focus:ring-black" />
                    <span className="text-sm text-zinc-700">Urgent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reason / Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Explain why these materials are needed..."
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
              <button 
                type="button" 
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
