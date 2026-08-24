'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Building2, Plus, Sparkles } from 'lucide-react';

export default function ChatRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedVentureId, setSelectedVentureId] = useState('');
  const [ventures, setVentures] = useState<any[]>([]);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVentures = async () => {
    try {
      const res = await fetch('/api/ventures');
      const data = await res.json();
      if (data.success) {
        setVentures(data.data);
      }
    } catch (err) {
      console.error('Failed to load ventures:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchVentures();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          ventureId: selectedVentureId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewRoomName('');
        setSelectedVentureId('');
        setShowAddModal(false);
        fetchRooms();
      }
    } catch (err) {
      console.error('Failed to create chat room:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Loading Chat Rooms...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full text-sm">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Venture Chat Rooms</h1>
          <p className="text-xs text-zinc-500 mt-1">Engage in secure real-time operational discussion scoped by construction project</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Channel
        </button>
      </div>

      {/* Grid of rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/chat/${room.id}`}
            className="p-5 rounded-xl bg-white border border-zinc-200 space-y-3 block hover:border-amber-500/50 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-zinc-900 group-hover:text-amber-700 transition-colors truncate">
                  #{room.name}
                </h3>
                {room.venture && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono mt-1">
                    <Building2 className="w-3 h-3 text-amber-600 shrink-0" /> <span className="truncate">{room.venture.name}</span>
                  </span>
                )}
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2 mt-1"></span>
            </div>
            
            <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono pt-3 border-t border-zinc-100">
              <span>{room._count?.messages || 0} messages</span>
              <span className="text-amber-700 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                Join →
              </span>
            </div>
          </Link>
        ))}

        {rooms.length === 0 && (
          <div className="col-span-full text-center py-16 text-zinc-400 text-xs">
            No active discussion rooms found. Click "Create Channel" to start a new workspace.
          </div>
        )}
      </div>

      {/* Modal: Create Chat Room */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <form onSubmit={handleCreateRoom} className="bg-white rounded-t-2xl sm:rounded-2xl border border-zinc-200 shadow-xl p-5 sm:p-6 w-full sm:max-w-md space-y-4 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider font-mono">Create Scoped Channel</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Channel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concrete Casting updates"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full border border-zinc-200 p-2 rounded-lg text-black focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Venture Association (Optional)</label>
                <select
                  value={selectedVentureId}
                  onChange={(e) => setSelectedVentureId(e.target.value)}
                  className="w-full border border-zinc-200 p-2 bg-zinc-50 rounded-lg text-black focus:outline-none"
                >
                  <option value="">None (Global Channel)</option>
                  {ventures.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newRoomName.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg shadow-xs"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
