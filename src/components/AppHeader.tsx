'use client';

import React, { useState } from 'react';
import { MenuIcon } from './icons';

interface AppHeaderProps {
  onShowNotice?: (message: string) => void;
}

export function AppHeader({ onShowNotice }: AppHeaderProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const handleMenuClick = () => {
    if (onShowNotice) {
      onShowNotice('Menu & navigation drawer coming soon');
    } else {
      setTooltip('Menu coming soon');
      setTimeout(() => setTooltip(null), 2500);
    }
  };

  const handleAddLeadClick = () => {
    if (onShowNotice) {
      onShowNotice('Lead creation form coming in Phase 2');
    } else {
      setTooltip('Lead creation coming in Phase 2');
      setTimeout(() => setTooltip(null), 2500);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={handleMenuClick}
          className="text-primary hover:bg-surface-container transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <MenuIcon className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">
          Outreach Pilot
        </h1>
      </div>

      <div className="relative">
        <button
          onClick={handleAddLeadClick}
          className="bg-primary-container text-on-primary-container font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2"
          aria-label="Add new lead (coming in Phase 2)"
        >
          ADD LEAD
        </button>

        {tooltip && (
          <div className="absolute right-0 top-12 bg-on-surface text-surface text-xs font-medium px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-50 animate-fade-in">
            {tooltip}
          </div>
        )}
      </div>
    </header>
  );
}
