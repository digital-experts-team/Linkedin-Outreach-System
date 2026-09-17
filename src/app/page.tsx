'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadsApiResponse } from '@/types/lead';
import { AppHeader } from '@/components/AppHeader';
import { VerticalTabs, CategoryTabId, SortOption } from '@/components/VerticalTabs';
import { LeadCard } from '@/components/LeadCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { LoadingState, EmptyState, ConfigRequiredState, ErrorState } from '@/components/States';
import { Toast } from '@/components/Toast';
import { SyncIcon } from '@/components/icons';

function getLeadTimestamp(lead: Lead): number {
  const dateStr = lead.posted || lead.signalDate || lead.sendDate || lead.commentDate;
  if (!dateStr) return 0;
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<CategoryTabId>('ai_video');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<LeadsApiResponse['error'] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchLeads = useCallback(async (tab: CategoryTabId, cursor?: string | null) => {
    const isInitial = !cursor;
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('vertical', tab);
      if (cursor) {
        params.set('cursor', cursor);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/leads${queryString}`;
      const res = await fetch(url, {
        cache: 'no-store',
      });
      const data: LeadsApiResponse = await res.json();

      if (data.error) {
        setError(data.error);
        if (isInitial) {
          setLeads([]);
        }
      } else {
        setLeads((prev) => (isInitial ? data.leads : [...prev, ...data.leads]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        setError(null);
      }
    } catch (err: any) {
      setError({
        code: 'FETCH_ERROR',
        message: 'Failed to connect to the backend server.',
        details: err?.message || 'Check your network connection and retry.',
      });
      if (isInitial) {
        setLeads([]);
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchLeads(activeTab);
  }, [activeTab, fetchLeads]);

  const handleTabChange = (tabId: CategoryTabId) => {
    setActiveTab(tabId);
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchLeads(activeTab, nextCursor);
    }
  };

  // Sort leads based on active sort mode (Date, Score, Status Up/Down)
  const displayedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      if (sortBy === 'date_desc') {
        const dateA = getLeadTimestamp(a);
        const dateB = getLeadTimestamp(b);
        if (dateB !== dateA) return dateB - dateA;
      } else if (sortBy === 'date_asc') {
        const dateA = getLeadTimestamp(a);
        const dateB = getLeadTimestamp(b);
        if (dateA !== dateB) return dateA - dateB;
      } else if (sortBy === 'score_desc') {
        const scoreA = a.score?.isNumeric ? parseFloat(a.score.raw) : a.score?.isHold ? 0 : -1;
        const scoreB = b.score?.isNumeric ? parseFloat(b.score.raw) : b.score?.isHold ? 0 : -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
      } else if (sortBy === 'score_asc') {
        const scoreA = a.score?.isNumeric ? parseFloat(a.score.raw) : a.score?.isHold ? 0 : 999;
        const scoreB = b.score?.isNumeric ? parseFloat(b.score.raw) : b.score?.isHold ? 0 : 999;
        if (scoreA !== scoreB) return scoreA - scoreB;
      } else if (sortBy === 'status_asc') {
        const statA = (a.linkedInStatus || '').toLowerCase();
        const statB = (b.linkedInStatus || '').toLowerCase();
        const cmp = statA.localeCompare(statB);
        if (cmp !== 0) return cmp;
      } else if (sortBy === 'status_desc') {
        const statA = (a.linkedInStatus || '').toLowerCase();
        const statB = (b.linkedInStatus || '').toLowerCase();
        const cmp = statB.localeCompare(statA);
        if (cmp !== 0) return cmp;
      }

      // Default tiebreaker: Score descending
      const scoreA = a.score?.isNumeric ? parseFloat(a.score.raw) : a.score?.isHold ? 0 : -1;
      const scoreB = b.score?.isNumeric ? parseFloat(b.score.raw) : b.score?.isHold ? 0 : -1;
      return scoreB - scoreA;
    });
  }, [leads, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* 1. Minimalist Utility-Driven Top Header (No Brand Title) */}
      <AppHeader onShowNotice={setNotice} />

      {/* 2. Main Content Area with padding offsets */}
      <div className="pt-14 pb-28 sm:pb-24 flex-1 flex flex-col">
        {/* Sticky Filter & Sort Row */}
        <VerticalTabs
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          sortBy={sortBy}
          onSelectSort={setSortBy}
          onShowNotice={setNotice}
        />

        {/* Lead List Canvas */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 md:px-8 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
          {loading && <LoadingState />}

          {!loading && error?.code === 'CONFIG_REQUIRED' && (
            <ConfigRequiredState onRetry={() => fetchLeads(activeTab)} />
          )}

          {!loading && error && error.code !== 'CONFIG_REQUIRED' && (
            <ErrorState
              message={error.message}
              details={error.details}
              onRetry={() => fetchLeads(activeTab)}
            />
          )}

          {!loading && !error && displayedLeads.length === 0 && (
            <EmptyState onRetry={() => fetchLeads(activeTab)} />
          )}

          {!loading && !error && displayedLeads.length > 0 && (
            <>
              <div className="space-y-3.5 sm:space-y-4">
                {displayedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>

              {hasMore && (
                <div className="pt-4 pb-2 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-surface-container text-on-surface font-semibold text-sm rounded-xl transition-all border border-outline-variant/80 disabled:opacity-60 shadow-xs tap-bounce"
                  >
                    {loadingMore ? (
                      <>
                        <SyncIcon className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading more leads...</span>
                      </>
                    ) : (
                      <span>Load More Leads</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Fixed Bottom Navigation Bar */}
      <BottomNavigation onShowNotice={setNotice} />

      {/* 4. Accessible Toast Announcements */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
