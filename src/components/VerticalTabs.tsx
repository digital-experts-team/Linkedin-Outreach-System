'use client';

import React from 'react';
import {
  LayersIcon,
  VideoIcon,
  TrendingUpIcon,
  GlobeIcon,
  CpuIcon,
  ArrowDownIcon,
  StarIcon,
} from './icons';

export type CategoryTabId = 'all' | 'ai_video' | 'gtm' | 'aeo_geo' | 'ai_automation';

interface CategoryTab {
  id: CategoryTabId;
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryTab[] = [
  {
    id: 'all',
    label: 'All',
    enabled: true,
    icon: <LayersIcon className="w-3.5 h-3.5" />,
  },
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
  isScoreSorted?: boolean;
  onToggleScoreSort?: () => void;
  onShowNotice?: (message: string) => void;
}

export function VerticalTabs({
  activeTab,
  onSelectTab,
  isScoreSorted = true,
  onToggleScoreSort,
  onShowNotice,
}: VerticalTabsProps) {
  const handleTabClick = (cat: CategoryTab) => {
    if (cat.enabled) {
      onSelectTab(cat.id);
    } else {
      if (onShowNotice) {
        onShowNotice(`"${cat.label}" vertical coming soon in Phase 2`);
      }
    }
  };

  return (
    <div className="sticky top-14 z-40 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
      <div
        className="flex items-center gap-2 overflow-x-auto hide-scrollbar tab-fade-right px-4 md:px-8 py-2.5"
        aria-label="Filter & Sort"
      >
        {/* First Item: Active 'Sort: Score ↓' filter pill with primary accent border */}
        <button
          onClick={onToggleScoreSort}
          className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
            isScoreSorted
              ? 'border border-primary text-primary bg-blue-50/60 shadow-xs'
              : 'border border-outline-variant bg-white text-secondary hover:text-on-surface'
          }`}
          title="Toggle Score Sorting"
          aria-label="Sort by score descending"
        >
          <StarIcon className="w-3.5 h-3.5 text-primary fill-primary/20" />
          <span>Sort: Score</span>
          <ArrowDownIcon className="w-3 h-3 text-primary stroke-[2.5]" />
        </button>

        <div className="h-4 w-[1px] bg-outline-variant/60 flex-none mx-0.5" aria-hidden="true" />

        {/* Category Pills with Contextual Icons */}
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
