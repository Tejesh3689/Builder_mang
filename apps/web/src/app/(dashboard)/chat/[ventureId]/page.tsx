'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Send, ArrowLeft, Building2, User, MessageSquare } from 'lucide-react';

export default function StandaloneChatRoomPage({ params }: { params: Promise<{ ventureId: string }> }) {
  const resolvedParams = use(params);
  const { ventureId } = resolvedParams; // ventureId corresponds to the roomId in the database

  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRoomDetails = async () => {
    try {
      // Find room by matching the rooms list
      const res = await fetch('/api/chat/rooms');
      const data = await res.json();
      if (data.success) {
        const found = data.data.find((r: any) => r.id === ventureId);
        if (found) setRoom(found);
      }
    } catch (err) {
      console.error('Error fetching room details:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${ventureId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
    fetchMessages();

    // Auto-refresh chat feed every 8 seconds for a lively experience
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [ventureId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    try {
      const res = await fetch(`/api/chat/rooms/${ventureId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMsg('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Entering channel...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm text-sm">
      {/* Room Header */}
      <div className="h-16 border-b border-zinc-200 px-6 flex justify-between items-center bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors border border-zinc-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h3 className="font-extrabold text-zinc-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-700" /> #{room?.name || 'Venture Channel'}
            </h3>
            {room?.venture && (
              <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-600" /> Scoped to {room.venture.name}
              </span>
            )}
          </div>
        </div>
        <Link href="/chat" className="text-xs font-semibold text-amber-700 hover:underline">Exit Room</Link>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/20">
        {messages.map((msg) => {
          const senderName = msg.sender?.name || 'Anonymous';
          const senderInitials = senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
          const msgTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:42 AM';

          return (
            <div key={msg.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {senderInitials}
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-zinc-50 border border-zinc-200 text-xs max-w-md space-y-1">
                <div className="flex justify-between items-center gap-8 border-b border-zinc-200/50 pb-0.5 mb-1 text-[9px] font-mono text-zinc-400">
                  <span className="font-bold text-amber-700">{senderName} ({msg.sender?.role || 'Staff'})</span>
                  <span>{msgTime}</span>
                </div>
                <p className="text-zinc-800 leading-normal font-medium">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="text-center py-20 text-zinc-400 text-xs font-semibold">
            No messages sent yet. Send the first message to initialize channel dialogue!
          </div>
        )}
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 bg-zinc-50/30 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-black focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
        />
        <button
          type="submit"
          disabled={!newMsg.trim()}
          className="px-4 py-2.5 bg-[#d97706] hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
        >
          Send <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
