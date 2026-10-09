'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string; count?: number | string; alert?: boolean };
type NavGroup = { group: string | null; items: NavItem[] };

export default function GlobalSearch({ navGroups }: { navGroups: NavGroup[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all searchable items
  const allItems = navGroups.flatMap(g =>
    g.items.map(item => ({
      ...item,
      group: g.group || 'General'
    }))
  );

  const filteredItems = query.trim() === ''
    ? []
    : allItems.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.group.toLowerCase().includes(query.toLowerCase())
    );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <div className="relative hidden sm:block z-50" ref={containerRef}>
      <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200/80 rounded-full px-4 py-1.5 w-64 text-xs text-zinc-700 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
        <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="text"
          placeholder="Search screens, menus..."
          className="bg-transparent border-none outline-none w-full placeholder-zinc-400"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && filteredItems.length > 0 && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden py-2 max-h-96 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase font-mono">
            Recommended Screens
          </div>
          {filteredItems.map((item, idx) => (
            <button
              key={`${item.href}-${idx}`}
              onClick={() => handleSelect(item.href)}
              className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 flex flex-col transition-colors border-l-2 border-transparent hover:border-black"
            >
              <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
              <span className="text-[10px] font-mono text-zinc-500">{item.group} &rarr; {item.href}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() !== '' && filteredItems.length === 0 && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg p-4 text-center">
          <p className="text-xs text-zinc-500">No matching screens found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
