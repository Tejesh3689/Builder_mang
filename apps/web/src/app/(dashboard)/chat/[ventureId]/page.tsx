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
  const [accessDenied, setAccessDenied] = useState(false);
  const [sendError, setSendError] = useState('');

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
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAccessDenied(false);
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
    setSendError('');

    try {
      const res = await fetch(`/api/chat/rooms/${ventureId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setSendError('You are not a member of this room and cannot send messages.');
        return;
      }
      if (data.success) {
        setNewMsg('');
        fetchMessages();
      } else {
        setSendError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setSendError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 text-xs animate-pulse">
        Entering channel...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-9rem)] sm:h-[calc(100vh-10rem)] rounded-2xl border border-red-200 bg-red-50 text-center p-12 space-y-3">
        <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>
        <h2 className="text-base font-extrabold text-red-700">Access Denied</h2>
        <p className="text-xs text-red-500 max-w-xs">You are not a member of this chat room. Contact your Project Manager to be added.</p>
        <Link href="/chat" className="mt-2 text-xs font-semibold text-red-700 underline">← Back to Channels</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] sm:h-[calc(100vh-10rem)] rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm text-sm">
      {/* Room Header */}
      <div className="h-14 sm:h-16 border-b border-zinc-200 px-3 sm:px-6 flex justify-between items-center gap-3 bg-zinc-50/50">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/chat" className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-black transition-colors border border-zinc-200 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h3 className="font-extrabold text-zinc-950 flex items-center gap-1.5 min-w-0">
              <MessageSquare className="w-4 h-4 text-amber-700 shrink-0" /> <span className="truncate">#{room?.name || 'Venture Channel'}</span>
            </h3>
            {room?.venture && (
              <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 min-w-0">
                <Building2 className="w-3 h-3 text-amber-600 shrink-0" /> <span className="truncate">Scoped to {room.venture.name}</span>
              </span>
            )}
          </div>
        </div>
        <Link href="/chat" className="text-xs font-semibold text-amber-700 hover:underline shrink-0">Exit Room</Link>
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
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 bg-zinc-50/30 flex flex-col gap-2">
        {sendError && (
          <div className="text-xs text-red-600 font-medium px-1">{sendError}</div>
        )}
        <div className="flex items-center space-x-3">
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12zm0 0h7.5" />
            </svg>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
