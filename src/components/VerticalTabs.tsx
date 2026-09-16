'use client';

import React from 'react';

export type CategoryTabId = 'all' | 'ai_video' | 'gtm' | 'aeo_geo' | 'ai_automation';

interface CategoryTab {
  id: CategoryTabId;
  label: string;
  enabled: boolean;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'All', enabled: true },
  { id: 'ai_video', label: 'AI Video & Hiring', enabled: true },
  { id: 'gtm', label: 'GTM & Sales', enabled: true },
  { id: 'aeo_geo', label: 'AEO/GEO', enabled: false },
  { id: 'ai_automation', label: 'AI Automation', enabled: false },
];

interface VerticalTabsProps {
  activeTab: CategoryTabId;
  onSelectTab: (tabId: CategoryTabId) => void;
  onShowNotice?: (message: string) => void;
}

export function VerticalTabs({ activeTab, onSelectTab, onShowNotice }: VerticalTabsProps) {
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
    <div className="sticky top-16 z-40 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
      <nav
        className="flex overflow-x-auto hide-scrollbar tab-fade-right px-4 md:px-8 border-b border-outline-variant"
        aria-label="Lead Categories"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeTab === cat.id;

          if (cat.enabled) {
            return (
              <button
                key={cat.id}
                onClick={() => handleTabClick(cat)}
                className={`flex-none px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${
                  isActive
                    ? 'text-primary'
                    : 'text-secondary hover:text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {cat.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={cat.id}
              onClick={() => handleTabClick(cat)}
              className="flex-none px-4 py-3.5 text-sm font-medium text-secondary/60 hover:text-secondary whitespace-nowrap transition-colors cursor-not-allowed group relative focus:outline-none"
              aria-disabled="true"
              title={`${cat.label} (Coming soon)`}
            >
              <span>{cat.label}</span>
              <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                Soon
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
