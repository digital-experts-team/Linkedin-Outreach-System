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

export type CategoryTabId = 'ai_video' | 'gtm' | 'growth_stacks';
export type SortOption = 'status' | 'date' | 'score';

interface CategoryTab {
  id: CategoryTabId;
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryTab[] = [
  {
    id: 'gtm',
    label: 'Tibin · GTM',
    enabled: true,
    icon: <TrendingUpIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'ai_video',
    label: 'Tibin · AI Video',
    enabled: true,
    icon: <VideoIcon className="w-3.5 h-3.5" />,
  },
  {
    id: 'growth_stacks',
    label: 'Growth Stacks (Co.)',
    enabled: true,
    icon: (
      <span className="w-3.5 h-3.5 rounded-xs bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">
        GS
      </span>
    ),
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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
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
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80">
      <div
        className="flex items-center justify-between gap-3 px-3.5 sm:px-6 md:px-8 py-2.5 max-w-5xl mx-auto"
        aria-label="Filter & Sort"
      >
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl flex-1 sm:flex-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleTabClick(cat)}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-[#0a66c2] tap-bounce cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-[#0a66c2]' : 'text-slate-400'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clean Sort Button */}
        <div className="relative flex-none" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0a66c2] select-none tap-bounce cursor-pointer"
            title="Sort leads"
          >
            <SlidersIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <span className="font-bold text-slate-800">{getSortBadgeLabel(sortBy)}</span>
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
              className="absolute right-0 top-full mt-2 z-50 w-60 max-w-[85vw] bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-1 animate-fade-in"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left tap-bounce cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-primary font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isSelected ? 'text-[#0a66c2]' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <div>
                        <div className="leading-snug">{item.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-[#0a66c2] stroke-[2.5] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




