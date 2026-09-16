'use client';

import React from 'react';
import { HomeIcon, GroupIcon, InboxIcon, SyncIcon, SettingsIcon } from './icons';

interface BottomNavigationProps {
  onShowNotice?: (message: string) => void;
}

export function BottomNavigation({ onShowNotice }: BottomNavigationProps) {
  const handleDisabledClick = (label: string) => {
    if (onShowNotice) {
      onShowNotice(`${label} module coming soon in Phase 2`);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around items-center px-2 sm:px-4 h-16 bg-surface-container-lowest border-t border-outline-variant select-none"
      aria-label="Main Navigation"
    >
      {/* 1. Home (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Home')}
        className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low transition-colors pt-[6px] pb-1 w-full rounded focus:outline-none"
        aria-disabled="true"
        title="Home (Coming soon)"
      >
        <HomeIcon className="w-5 h-5 text-secondary" />
        <span className="text-xs font-medium text-secondary mt-0.5">Home</span>
      </button>

      {/* 2. Leads (Active) */}
      <div
        className="flex flex-col items-center justify-center text-primary border-t-2 border-primary pt-[4px] pb-1 w-full"
        aria-current="page"
      >
        <GroupIcon className="w-5 h-5 text-primary" filled={true} />
        <span className="text-xs font-bold text-primary mt-0.5">Leads</span>
      </div>

      {/* 3. Inbox (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Inbox')}
        className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low transition-colors pt-[6px] pb-1 w-full rounded focus:outline-none"
        aria-disabled="true"
        title="Inbox (Coming soon)"
      >
        <InboxIcon className="w-5 h-5 text-secondary" />
        <span className="text-xs font-medium text-secondary mt-0.5">Inbox</span>
      </button>

      {/* 4. Sync (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Sync')}
        className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low transition-colors pt-[6px] pb-1 w-full rounded focus:outline-none"
        aria-disabled="true"
        title="Sync (Coming soon)"
      >
        <SyncIcon className="w-5 h-5 text-secondary" />
        <span className="text-xs font-medium text-secondary mt-0.5">Sync</span>
      </button>

      {/* 5. Settings (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Settings')}
        className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low transition-colors pt-[6px] pb-1 w-full rounded focus:outline-none"
        aria-disabled="true"
        title="Settings (Coming soon)"
      >
        <SettingsIcon className="w-5 h-5 text-secondary" />
        <span className="text-xs font-medium text-secondary mt-0.5">Settings</span>
      </button>
    </nav>
  );
}
