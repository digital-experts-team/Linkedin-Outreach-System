'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, SyncIcon } from './icons';

export const STATUS_OPTIONS = [
  'Draft Ready',
  'LinkedIn Send',
  'Follow Up',
  'Done',
  'Not Started',
  'Hold',
];

interface StatusBadgeProps {
  status: string;
  onChangeStatus?: (newStatus: string) => Promise<void> | void;
  updating?: boolean;
}

export function getStatusColorClasses(status: string): string {
  const normalized = (status || '').trim().toLowerCase();

  switch (normalized) {
    case 'not started':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'draft':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'draft ready':
      return 'bg-blue-50 text-primary border-blue-200';
    case 'done':
    case 'connected':
    case 'replied':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'linkedin send':
    case 'sent':
    case 'in outreach':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'follow up':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'hold':
    case 'not interested':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'no status':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-blue-50 text-primary border-blue-200';
  }
}

export function StatusBadge({ status, onChangeStatus, updating }: StatusBadgeProps) {
  const normalized = (status || '').trim() || 'No status';
  const colorClasses = getStatusColorClasses(normalized);
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
        className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${colorClasses}`}
      >
        {normalized}
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-2xs transition-all tap-bounce cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary ${colorClasses}`}
        title="Click to change status in Notion CRM"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {updating ? (
          <SyncIcon className="w-3.5 h-3.5 animate-spin" />
        ) : null}
        <span>{normalized}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Change lead status"
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[180px] bg-white rounded-xl shadow-xl border border-outline-variant/80 p-1 space-y-0.5 animate-fade-in"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary/70 border-b border-outline-variant/40 mb-1">
            Update Notion Status
          </div>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = normalized.toLowerCase() === opt.toLowerCase();
            const optColor = getStatusColorClasses(opt);

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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left tap-bounce ${
                  isSelected
                    ? 'bg-blue-50 text-primary font-bold'
                    : 'text-on-surface hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full border ${optColor}`} />
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

