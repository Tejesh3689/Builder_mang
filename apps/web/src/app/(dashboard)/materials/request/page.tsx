'use client';

import React, { useState, useEffect, useRef } from 'react';import { Select, SelectOption } from '@/components/ui/Select';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, newIdempotencyKey } from '@/lib/api';
import { FieldError, useFieldErrors } from '@/lib/form-errors';
import { getSafeReturnTo } from '@/lib/navigation';

export default function MaterialRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get('returnTo'), '/materials');

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
  // Request items are a single line here, so any items.* error belongs to the quantity input.
  const fe = useFieldErrors({ items: 'quantity' });
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
    fe.clear();

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

      router.push(returnTo);
      router.refresh();
    } catch (err: any) {
      const hasFieldErrors = fe.setFromError(err);
      setError(hasFieldErrors ? 'Please correct the highlighted fields.' : err.message || 'Something went wrong.');
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
        <Link href={returnTo} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors border border-zinc-200 shrink-0">
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
                <label htmlFor="ventureId" className="block text-sm font-medium text-zinc-700 mb-1">Project / Venture</label>
                <Select
                  id="ventureId"
                  {...fe.props('ventureId')}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white"
                  value={ventureId}
                  onChange={e => setVentureId(e.target.value)}
                  required
                >
                  <SelectOption value="">Select venture</SelectOption>
                  {ventures.map(v => (
                    <SelectOption key={v.id} value={v.id}>{v.name}</SelectOption>
                  ))}
                </Select>
                <FieldError id="ventureId" errors={fe.errors} />
              </div>

              <div>
                <label htmlFor="materialId" className="block text-sm font-medium text-zinc-700 mb-1">Material Needed</label>
                <Select
                  id="materialId"
                  {...fe.props('materialId')}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white"
                  value={materialId}
                  onChange={e => setMaterialId(e.target.value)}
                  required
                >
                  <SelectOption value="">Select material</SelectOption>
                  {materials.map(m => (
                    <SelectOption key={m.id} value={m.id}>{m.name} ({m.unitOfMeasure?.name})</SelectOption>
                  ))}
                </Select>
                <FieldError id="materialId" errors={fe.errors} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700 mb-1">Quantity Required</label>
                  <input
                    id="quantity"
                    {...fe.props('quantity')}
                    type="number" 
                    min="0.1"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                    placeholder="e.g. 100"
                  />
                  <FieldError id="quantity" errors={fe.errors} />
                </div>
                <div>
                  <label htmlFor="requiredDate" className="block text-sm font-medium text-zinc-700 mb-1">Required By Date</label>
                  <input
                    id="requiredDate"
                    {...fe.props('requiredDate')}
                    type="date" 
                    value={requiredDate}
                    onChange={e => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  />
                  <FieldError id="requiredDate" errors={fe.errors} />
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
                <label htmlFor="remarks" className="block text-sm font-medium text-zinc-700 mb-1">Reason / Notes</label>
                <textarea
                  id="remarks"
                  {...fe.props('remarks')}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Explain why these materials are needed..."
                />
                <FieldError id="remarks" errors={fe.errors} />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
              <button 
                type="button" 
                onClick={() => router.push(returnTo)}
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
