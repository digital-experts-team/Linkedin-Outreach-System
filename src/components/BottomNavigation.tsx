'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, GroupIcon, ArticleIcon, InboxIcon, SettingsIcon } from './icons';

interface BottomNavigationProps {
  onShowNotice?: (message: string) => void;
}

export function BottomNavigation({ onShowNotice }: BottomNavigationProps) {
  const pathname = usePathname();
  const isLeadsActive = pathname === '/' || pathname.startsWith('/leads');
  const isPostsActive = pathname === '/posts';

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
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Home (Coming soon)"
      >
        <HomeIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Home</span>
      </button>

      {/* 2. Leads (Active when on / or /leads/[id]) */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 w-full relative transition-colors tap-bounce ${
          isLeadsActive ? 'text-primary' : 'text-secondary/80 hover:text-on-surface'
        }`}
        aria-current={isLeadsActive ? 'page' : undefined}
      >
        {isLeadsActive && (
          <div className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
        )}
        <GroupIcon className={`w-5 h-5 ${isLeadsActive ? 'text-primary' : 'text-secondary'}`} filled={isLeadsActive} />
        <span className={`text-[11px] mt-1 ${isLeadsActive ? 'font-bold text-primary' : 'font-medium'}`}>
          Leads
        </span>
      </Link>

      {/* 3. Content / Posts (Active when on /posts) */}
      <Link
        href="/posts"
        className={`flex flex-col items-center justify-center py-1 w-full relative transition-colors tap-bounce ${
          isPostsActive ? 'text-primary' : 'text-secondary/80 hover:text-on-surface'
        }`}
        aria-current={isPostsActive ? 'page' : undefined}
      >
        {isPostsActive && (
          <div className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
        )}
        <ArticleIcon className={`w-5 h-5 ${isPostsActive ? 'text-primary' : 'text-secondary'}`} filled={isPostsActive} />
        <span className={`text-[11px] mt-1 ${isPostsActive ? 'font-bold text-primary' : 'font-medium'}`}>
          Content
        </span>
      </Link>

      {/* 4. Inbox (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Inbox')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Inbox (Coming soon)"
      >
        <InboxIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Inbox</span>
      </button>

      {/* 5. Settings (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Settings')}
        className="flex flex-col items-center justify-center text-secondary/80 hover:text-on-surface transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Settings (Coming soon)"
      >
        <SettingsIcon className="w-5 h-5 text-secondary" />
        <span className="text-[11px] font-medium mt-1">Settings</span>
      </button>
    </nav>
  );
}


