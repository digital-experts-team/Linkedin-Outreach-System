'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  VideoIcon,
  TrendingUpIcon,
  StarIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
  SlidersIcon,
} from './icons';

export type CategoryTabId = 'ai_video' | 'gtm';
export type SortOption = 'score' | 'date';

interface CategoryTab {
  id: CategoryTabId;
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryTab[] = [
  {
    id: 'ai_video',
    label: 'AI Video & Hiring',
    enabled: true,
    icon: <VideoIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'gtm',
    label: 'GTM & Sales',
    enabled: true,
    icon: <TrendingUpIcon className="w-3.5 h-3.5" />,
  },
];

interface VerticalTabsProps {
  activeTab: CategoryTabId;
  onSelectTab: (tabId: CategoryTabId) => void;
  sortBy: SortOption;
  onSelectSort: (sort: SortOption) => void;
  onShowNotice?: (message: string) => void;
}

export function VerticalTabs({
  activeTab,
  onSelectTab,
  sortBy,
  onSelectSort,
  onShowNotice,
}: VerticalTabsProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSortOpen(false);
      }
    }

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  const handleTabClick = (cat: CategoryTab) => {
    if (cat.enabled) {
      onSelectTab(cat.id);
    } else {
      if (onShowNotice) {
        onShowNotice(`"${cat.label}" vertical coming soon in Phase 2`);
      }
    }
  };

  const handleSortSelect = (option: SortOption) => {
    onSelectSort(option);
    setIsSortOpen(false);
  };

  return (
    <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md shadow-xs border-b border-outline-variant/60">
      <div
        className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar tab-fade-right px-4 md:px-8 py-2.5"
        aria-label="Filter & Sort"
      >
        {/* Completely Redesigned Sort Control Widget (Distinct from Category Pills) */}
        <div className="relative flex-none" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-slate-900 hover:bg-slate-800 text-white shadow-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 select-none tap-bounce"
            title="Sort leads"
          >
            <SlidersIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Sort</span>
              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-700/80">
                {sortBy === 'date' ? 'Date ↓' : 'Score ↓'}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isSortOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isSortOpen && (
            <div
              role="listbox"
              aria-label="Sort options"
              className="absolute left-0 top-full mt-2 z-50 min-w-[210px] bg-white rounded-2xl shadow-xl border border-outline-variant/80 p-1.5 space-y-1 animate-fade-in"
            >
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary/70 border-b border-outline-variant/40 mb-1">
                Sort Leads By
              </div>

              {/* Option 1: Date */}
              <button
                type="button"
                role="option"
                aria-selected={sortBy === 'date'}
                onClick={() => handleSortSelect('date')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left tap-bounce ${
                  sortBy === 'date'
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-on-surface hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon
                    className={`w-4 h-4 ${sortBy === 'date' ? 'text-primary' : 'text-secondary'}`}
                  />
                  <div>
                    <div className="leading-snug">Date (Newest first)</div>
                    <div className="text-[10px] text-secondary font-normal">Recent signal / post date</div>
                  </div>
                </div>
                {sortBy === 'date' && <CheckIcon className="w-4 h-4 text-primary stroke-[2.5] flex-shrink-0" />}
              </button>

              {/* Option 2: Score */}
              <button
                type="button"
                role="option"
                aria-selected={sortBy === 'score'}
                onClick={() => handleSortSelect('score')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left tap-bounce ${
                  sortBy === 'score'
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-on-surface hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <StarIcon
                    className={`w-4 h-4 ${
                      sortBy === 'score' ? 'text-primary fill-primary/20' : 'text-secondary'
                    }`}
                  />
                  <div>
                    <div className="leading-snug">Score (Highest first)</div>
                    <div className="text-[10px] text-secondary font-normal">Lead match fit score</div>
                  </div>
                </div>
                {sortBy === 'score' && <CheckIcon className="w-4 h-4 text-primary stroke-[2.5] flex-shrink-0" />}
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-outline-variant/60 flex-none mx-0.5" aria-hidden="true" />

        {/* Category Pills: Filled Solid Blue for Selected Active Tab */}
        {CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleTabClick(cat)}
              className={`flex-none inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-primary tap-bounce ${
                isActive
                  ? 'bg-primary text-white border border-primary shadow-xs font-bold'
                  : 'bg-white text-secondary hover:text-on-surface hover:border-outline border border-outline-variant/80'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={isActive ? 'text-white' : 'text-secondary'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



