'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  VideoIcon,
  TrendingUpIcon,
  GlobeIcon,
  CpuIcon,
  StarIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
} from './icons';

export type CategoryTabId = 'ai_video' | 'gtm' | 'aeo_geo' | 'ai_automation';
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
  {
    id: 'aeo_geo',
    label: 'AEO/GEO',
    enabled: false,
    icon: <GlobeIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'ai_automation',
    label: 'AI Automation',
    enabled: false,
    icon: <CpuIcon className="w-3.5 h-3.5" />,
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
    <div className="sticky top-14 z-40 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
      <div
        className="flex items-center gap-2 overflow-x-auto hide-scrollbar tab-fade-right px-4 md:px-8 py-2.5"
        aria-label="Filter & Sort"
      >
        {/* Single Sort Dropdown Container */}
        <div className="relative flex-none" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border border-primary text-primary bg-blue-50/70 shadow-xs hover:bg-blue-100/70 focus:outline-none focus:ring-2 focus:ring-primary select-none"
            title="Sort leads"
          >
            {sortBy === 'date' ? (
              <>
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                <span>Sort: Date ↓</span>
              </>
            ) : (
              <>
                <StarIcon className="w-3.5 h-3.5 text-primary fill-primary/20" />
                <span>Sort: Score ↓</span>
              </>
            )}
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${
                isSortOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {isSortOpen && (
            <div
              role="listbox"
              aria-label="Sort options"
              className="absolute left-0 top-full mt-1.5 z-50 min-w-[210px] bg-white rounded-xl shadow-xl border border-outline-variant/80 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
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
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
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
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
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

        {/* Category Pills (Without 'All' button) */}
        {CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.id;

          if (cat.enabled) {
            return (
              <button
                key={cat.id}
                onClick={() => handleTabClick(cat)}
                className={`flex-none inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  isActive
                    ? 'border border-primary text-primary bg-blue-50/70 shadow-xs font-bold'
                    : 'border border-outline-variant/80 bg-white text-secondary hover:text-on-surface hover:border-outline'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-primary' : 'text-secondary'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          }

          return (
            <button
              key={cat.id}
              onClick={() => handleTabClick(cat)}
              className="flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-secondary/60 bg-gray-50/80 border border-outline-variant/50 whitespace-nowrap transition-colors cursor-not-allowed group focus:outline-none"
              aria-disabled="true"
              title={`${cat.label} (Coming soon)`}
            >
              <span className="opacity-60">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-gray-200/70 text-gray-500">
                Soon
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

