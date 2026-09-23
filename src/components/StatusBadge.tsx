'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, SyncIcon } from './icons';

export const STATUS_OPTIONS = [
  'New',
  'Draft Ready',
  'Linkedin Done',
  'Email Done',
  'Both Done',
  'Follow Up Done',
  'LinkedIn Send',
  'Enrichment Done',
  'Done',
  'Closed Won',
  'Closed Lost',
  'Hold',
];

interface StatusBadgeProps {
  status: string;
  onChangeStatus?: (newStatus: string) => Promise<void> | void;
  updating?: boolean;
}

export function getStatusDotClass(status: string): string {
  const normalized = (status || '').trim().toLowerCase();
  switch (normalized) {
    case 'both done':
    case 'done':
    case 'closed won':
    case 'connected':
    case 'replied':
      return 'bg-emerald-500';
    case 'linkedin send':
    case 'sent':
    case 'in outreach':
      return 'bg-teal-500';
    case 'draft ready':
    case 'job board':
      return 'bg-[#0a66c2]';
    case 'linkedin done':
      return 'bg-sky-500';
    case 'email done':
      return 'bg-amber-500';
    case 'follow up done':
    case 'follow up':
      return 'bg-purple-500';
    case 'closed lost':
      return 'bg-rose-500';
    case 'hold':
    case 'skip':
    case 'not interested':
      return 'bg-amber-400';
    default:
      return 'bg-slate-400';
  }
}

export function getStatusColorClasses(status: string): string {
  const normalized = (status || '').trim().toLowerCase();

  switch (normalized) {
    case 'new':
    case 'not started':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'draft':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'draft ready':
    case 'job board':
      return 'bg-blue-50 text-[#0a66c2] border-blue-200';
    case 'linkedin done':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'email done':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'enrichment done':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'both done':
    case 'done':
    case 'closed won':
    case 'connected':
    case 'replied':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'linkedin send':
    case 'sent':
    case 'in outreach':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'follow up done':
    case 'follow up':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'closed lost':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'skip':
    case 'hold':
    case 'not interested':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'no status':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-blue-50 text-[#0a66c2] border-blue-200';
  }
}

export function StatusBadge({ status, onChangeStatus, updating }: StatusBadgeProps) {
  const normalized = (status || '').trim() || 'No status';
  const colorClasses = getStatusColorClasses(normalized);
  const dotClass = getStatusDotClass(normalized);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!onChangeStatus) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${colorClasses}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span>{normalized}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs transition-all tap-bounce cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary ${colorClasses}`}
        title="Click to change status in Notion CRM"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {updating ? (
          <SyncIcon className="w-3 h-3 animate-spin" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        )}
        <span>{normalized}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Change lead status"
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[190px] bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-0.5 animate-fade-in"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Update Notion Status
          </div>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = normalized.toLowerCase() === opt.toLowerCase();
            const itemDot = getStatusDotClass(opt);

            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={async () => {
                  setIsOpen(false);
                  if (onChangeStatus && !isSelected) {
                    await onChangeStatus(opt);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors text-left tap-bounce ${
                  isSelected
                    ? 'bg-blue-50 text-primary font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${itemDot}`} />
                  <span>{opt}</span>
                </div>
                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-primary stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

