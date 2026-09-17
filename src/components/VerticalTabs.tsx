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
  ArrowDownIcon,
} from './icons';

export type CategoryTabId = 'ai_video' | 'gtm';
export type SortOption = 'status' | 'date' | 'score';

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

interface SortItemConfig {
  id: SortOption;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

const SORT_OPTIONS: SortItemConfig[] = [
  {
    id: 'status',
    label: 'Status',
    subtitle: 'Sort by pipeline stage',
    icon: <SlidersIcon className="w-4 h-4" />,
  },
  {
    id: 'date',
    label: 'Date',
    subtitle: 'Sort by latest post & signal date',
    icon: <CalendarIcon className="w-4 h-4" />,
  },
  {
    id: 'score',
    label: 'Score',
    subtitle: 'Sort by highest match score',
    icon: <StarIcon className="w-4 h-4" />,
  },
];

function getSortBadgeLabel(sortBy: SortOption): string {
  switch (sortBy) {
    case 'status':
      return 'Status';
    case 'date':
      return 'Date';
    case 'score':
      return 'Score';
    default:
      return 'Date';
  }
}

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
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-xs border-b border-outline-variant/60">
      <div
        className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar tab-fade-right px-4 md:px-8 py-2.5"
        aria-label="Filter & Sort"
      >
        {/* Simple & Clean Minimalist Sort Button (No heavy fill, no bulky button) */}
        <div className="relative flex-none" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300/80 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary select-none tap-bounce"
            title="Sort leads"
          >
            <SlidersIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-secondary font-medium">Sort:</span>
            <span className="font-bold text-on-surface">{getSortBadgeLabel(sortBy)}</span>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                isSortOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu (Optimized for Mobile & Desktop) */}
          {isSortOpen && (
            <div
              role="listbox"
              aria-label="Sort options"
              className="absolute left-0 top-full mt-2 z-50 w-64 max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-outline-variant/80 p-1.5 space-y-1 animate-fade-in max-h-[75vh] overflow-y-auto hide-scrollbar"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary/70 border-b border-outline-variant/40 mb-1">
                Sort Leads By
              </div>

              {SORT_OPTIONS.map((item) => {
                const isSelected = sortBy === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSortSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left tap-bounce ${
                      isSelected
                        ? 'bg-blue-50 text-primary font-bold'
                        : 'text-on-surface hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isSelected ? 'text-primary' : 'text-secondary'}>
                        {item.icon}
                      </span>
                      <div>
                        <div className="leading-snug">{item.label}</div>
                        <div className="text-[10px] text-secondary font-normal">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-primary stroke-[2.5] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
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




