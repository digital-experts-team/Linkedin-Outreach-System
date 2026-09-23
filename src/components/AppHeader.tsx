'use client';

import React, { useState } from 'react';
import { MenuIcon, CloseIcon, SyncIcon, SettingsIcon, GroupIcon, InboxIcon, StarIcon } from './icons';

interface AppHeaderProps {
  onShowNotice?: (message: string) => void;
}

export function AppHeader({ onShowNotice }: AppHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAddLeadClick = () => {
    if (onShowNotice) {
      onShowNotice('Quick Lead Intake form coming in Phase 2');
    }
  };

  const handleDrawerAction = (feature: string) => {
    setDrawerOpen(false);
    if (onShowNotice) {
      onShowNotice(`${feature} is synchronized with your live Notion CRM`);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 flex justify-between items-center px-4 md:px-8 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
        {/* Left: Brand / Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 -ml-2 rounded-xl transition-colors tap-bounce focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0a66c2] flex items-center justify-center text-white font-black text-xs shadow-2xs font-display">
              OP
            </div>
            <span className="font-display font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Outreach Pilot
            </span>
          </div>
        </div>

        {/* Right: Bold 'ADD LEAD' Button */}
        <button
          onClick={handleAddLeadClick}
          className="bg-[#0a66c2] hover:bg-[#004182] active:scale-95 text-white font-semibold font-display text-xs md:text-sm px-3.5 py-1.5 rounded-xl transition-all shadow-xs hover:shadow focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:ring-offset-2 tap-bounce cursor-pointer flex items-center gap-1.5"
          aria-label="Add new lead"
        >
          <span>+ Add Lead</span>
        </button>
      </header>

      {/* Mobile Slide-in Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-5 animate-slide-left rounded-r-3xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0a66c2] flex items-center justify-center text-white font-black text-sm shadow-2xs">
                    OP
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-slate-900">Outreach Pilot</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Notion Live Sync</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 tap-bounce"
                  aria-label="Close drawer"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleDrawerAction('Leads Dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-[#0a66c2] tap-bounce text-left"
                >
                  <GroupIcon className="w-5 h-5 text-[#0a66c2]" filled={true} />
                  <span>Leads Pipeline</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Inbox')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 tap-bounce text-left"
                >
                  <InboxIcon className="w-5 h-5 text-slate-400" />
                  <span>Outreach Inbox</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Sync Manager')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 tap-bounce text-left"
                >
                  <SyncIcon className="w-5 h-5 text-slate-400" />
                  <span>Sync Manager</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Settings')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 tap-bounce text-left"
                >
                  <SettingsIcon className="w-5 h-5 text-slate-400" />
                  <span>Settings & Notion Config</span>
                </button>
              </nav>

              {/* Live Notion Status Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900">CRM Connected</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Real-time synchronization active with GTM & AI Video databases.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-medium">Outreach Pilot v2.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

