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
      <header className="fixed top-0 left-0 right-0 w-full z-40 flex justify-between items-center px-4 md:px-8 h-14 bg-white/90 backdrop-blur-md border-b border-outline-variant/70 shadow-xs select-none">
        {/* Left: Hamburger Menu Icon */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-primary hover:bg-blue-50/80 active:bg-blue-100 p-2 -ml-2 rounded-full transition-colors tap-bounce focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <MenuIcon className="w-6 h-6 text-primary" />
        </button>

        {/* Right: Bold Solid Blue 'ADD LEAD' Button */}
        <button
          onClick={handleAddLeadClick}
          className="bg-primary hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-xs md:text-sm px-4 py-2 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 tracking-wide tap-bounce"
          aria-label="Add new lead"
        >
          ADD LEAD
        </button>
      </header>

      {/* Mobile Slide-in Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-5 animate-slide-left">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                    OP
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-on-surface">Outreach Pilot</h2>
                    <p className="text-[11px] text-secondary font-medium">Notion Live Sync</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-secondary tap-bounce"
                  aria-label="Close drawer"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => handleDrawerAction('Leads Dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-primary tap-bounce"
                >
                  <GroupIcon className="w-5 h-5 text-primary" filled={true} />
                  <span>Leads Pipeline</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Inbox')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:bg-gray-50 tap-bounce"
                >
                  <InboxIcon className="w-5 h-5" />
                  <span>Outreach Inbox</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Sync Manager')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:bg-gray-50 tap-bounce"
                >
                  <SyncIcon className="w-5 h-5" />
                  <span>Sync Manager</span>
                </button>
                <button
                  onClick={() => handleDrawerAction('Settings')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:bg-gray-50 tap-bounce"
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span>Settings & Notion Config</span>
                </button>
              </nav>

              {/* Live Notion Status Card */}
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-on-surface">CRM Connected</span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  Real-time synchronization active with GTM & AI Video databases.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-outline-variant/60 text-center">
              <p className="text-[11px] text-secondary font-medium">Outreach Pilot v2.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

