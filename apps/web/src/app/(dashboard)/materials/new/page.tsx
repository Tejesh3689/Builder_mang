'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

export default function NewMaterialPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryName, setCategoryName] = useState('Structural');
  const [uomName, setUomName] = useState('Bags');
  const [reorderLevel, setReorderLevel] = useState('50');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/materials?meta=true');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
          setUoms(data.uoms || []);
        }
      } catch (err) {
        console.error('Failed loading materials metadata:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          categoryName,
          uomName,
          reorderLevel: parseFloat(reorderLevel) || 0
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed saving material.');
      }

      router.push('/materials');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Loading Materials Builder...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-sm">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="space-y-1">
          <Link href="/materials" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Materials
          </Link>
          <h1 className="text-lg font-extrabold text-black tracking-tight mt-1">Add Master Material</h1>
          <p className="text-xs text-zinc-500">Define code, description, category, and threshold for a new stock resource</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
          Error: {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Material Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black text-xs focus:outline-none focus:border-amber-500"
              placeholder="e.g. TMT Steel Rebars 16mm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Material Code / SKU</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black text-xs focus:outline-none focus:border-amber-500 font-mono"
              placeholder="e.g. MAT-STL-16"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="Structural">Structural (Cement, Steel)</option>
              <option value="Finishing">Finishing (Tiles, Paints)</option>
              <option value="Plumbing">Plumbing (Pipes, Joints)</option>
              <option value="Electrical">Electrical (Wires, Switches)</option>
              {categories
                .filter(c => !['Structural', 'Finishing', 'Plumbing', 'Electrical'].includes(c.name))
                .map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Unit of Measure</label>
            <select
              value={uomName}
              onChange={(e) => setUomName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="Bags">Bags (50kg)</option>
              <option value="Tons">Tons</option>
              <option value="Boxes">Boxes</option>
              <option value="Meters">Meters</option>
              <option value="Liters">Liters</option>
              <option value="Units">Units</option>
              {uoms
                .filter(u => !['Bags', 'Tons', 'Boxes', 'Meters', 'Liters', 'Units'].includes(u.name))
                .map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">Reorder Level Threshold</label>
          <input
            type="number"
            required
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-black text-xs focus:outline-none focus:border-amber-500 font-mono"
            placeholder="e.g. 50"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" /> {submitting ? 'Saving Material...' : 'Save Material'}
          </button>
        </div>
      </form>
    </div>
  );
}
