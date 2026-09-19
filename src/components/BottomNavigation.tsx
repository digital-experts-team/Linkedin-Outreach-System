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
      className="fixed bottom-0 left-0 right-0 w-full z-40 flex justify-around items-center px-2 sm:px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.6rem)] bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(15,23,42,0.03)] select-none"
      aria-label="Main Navigation"
    >
      {/* 1. Home (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Home')}
        className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Home (Coming soon)"
      >
        <HomeIcon className="w-5 h-5 text-slate-400" />
        <span className="text-[11px] font-medium mt-1">Home</span>
      </button>

      {/* 2. Leads (Active when on / or /leads/[id]) */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 w-full relative transition-colors tap-bounce ${
          isLeadsActive ? 'text-[#0a66c2]' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-current={isLeadsActive ? 'page' : undefined}
      >
        {isLeadsActive && (
          <div className="absolute -top-2 w-7 h-1 bg-[#0a66c2] rounded-full" />
        )}
        <GroupIcon className={`w-5 h-5 ${isLeadsActive ? 'text-[#0a66c2]' : 'text-slate-400'}`} filled={isLeadsActive} />
        <span className={`text-[11px] mt-1 font-display ${isLeadsActive ? 'font-bold text-[#0a66c2]' : 'font-medium'}`}>
          Leads
        </span>
      </Link>

      {/* 3. Content / Posts (Active when on /posts) */}
      <Link
        href="/posts"
        className={`flex flex-col items-center justify-center py-1 w-full relative transition-colors tap-bounce ${
          isPostsActive ? 'text-[#0a66c2]' : 'text-slate-500 hover:text-slate-800'
        }`}
        aria-current={isPostsActive ? 'page' : undefined}
      >
        {isPostsActive && (
          <div className="absolute -top-2 w-7 h-1 bg-[#0a66c2] rounded-full" />
        )}
        <ArticleIcon className={`w-5 h-5 ${isPostsActive ? 'text-[#0a66c2]' : 'text-slate-400'}`} filled={isPostsActive} />
        <span className={`text-[11px] mt-1 font-display ${isPostsActive ? 'font-bold text-[#0a66c2]' : 'font-medium'}`}>
          Content
        </span>
      </Link>

      {/* 4. Inbox (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Inbox')}
        className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Inbox (Coming soon)"
      >
        <InboxIcon className="w-5 h-5 text-slate-400" />
        <span className="text-[11px] font-medium mt-1">Inbox</span>
      </button>

      {/* 5. Settings (Unavailable) */}
      <button
        onClick={() => handleDisabledClick('Settings')}
        className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors py-1 w-full rounded-xl tap-bounce focus:outline-none cursor-pointer"
        aria-disabled="true"
        title="Settings (Coming soon)"
      >
        <SettingsIcon className="w-5 h-5 text-slate-400" />
        <span className="text-[11px] font-medium mt-1">Settings</span>
      </button>
    </nav>
  );
}


