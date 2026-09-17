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
      className="fixed bottom-0 left-0 right-0 w-full z-40 flex justify-around items-center px-2 sm:px-4 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] bg-white/95 backdrop-blur-lg border-t border-outline-variant/70 shadow-lg select-none"
      aria-label="Main Navigation"
    >
      {/* 1. Home (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Home')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none"
        aria-disabled="true"
        title="Home (Coming soon)"
      >
        <HomeIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Home</span>
      </button>

      {/* 2. Leads (Active) */}
      <div
        className="flex flex-col items-center justify-center text-primary py-1 w-full relative"
        aria-current="page"
      >
        <div className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
        <GroupIcon className="w-5 h-5 text-primary" filled={true} />
        <span className="text-[11px] font-bold text-primary mt-1">Leads</span>
      </div>

      {/* 3. Inbox (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Inbox')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none"
        aria-disabled="true"
        title="Inbox (Coming soon)"
      >
        <InboxIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Inbox</span>
      </button>

      {/* 4. Sync (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Sync')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none"
        aria-disabled="true"
        title="Sync (Coming soon)"
      >
        <SyncIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Sync</span>
      </button>

      {/* 5. Settings (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Settings')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none"
        aria-disabled="true"
        title="Settings (Coming soon)"
      >
        <SettingsIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Settings</span>
      </button>
    </nav>
  );
}

