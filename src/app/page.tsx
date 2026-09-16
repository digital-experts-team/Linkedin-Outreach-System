'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lead, LeadsApiResponse } from '@/types/lead';
import { AppHeader } from '@/components/AppHeader';
import { VerticalTabs, CategoryTabId } from '@/components/VerticalTabs';
import { LeadCard } from '@/components/LeadCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { LoadingState, EmptyState, ConfigRequiredState, ErrorState } from '@/components/States';
import { Toast } from '@/components/Toast';
import { SyncIcon } from '@/components/icons';

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<CategoryTabId>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<LeadsApiResponse['error'] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchLeads = useCallback(async (cursor?: string | null) => {
    const isInitial = !cursor;
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const url = cursor ? `/api/leads?cursor=${encodeURIComponent(cursor)}` : '/api/leads';
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
    fetchLeads();
  }, [fetchLeads]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchLeads(nextCursor);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* 1. Fixed Top Header */}
      <AppHeader onShowNotice={setNotice} />

      {/* 2. Main Content Area with padding offsets */}
      <div className="pt-16 pb-24 flex-1 flex flex-col">
        {/* Sticky Sub-Header with Category Tabs */}
        <VerticalTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onShowNotice={setNotice}
        />

        {/* Lead List Canvas */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-6 space-y-4">
          {loading && <LoadingState />}

          {!loading && error?.code === 'CONFIG_REQUIRED' && (
            <ConfigRequiredState onRetry={() => fetchLeads()} />
          )}

          {!loading && error && error.code !== 'CONFIG_REQUIRED' && (
            <ErrorState
              message={error.message}
              details={error.details}
              onRetry={() => fetchLeads()}
            />
          )}

          {!loading && !error && leads.length === 0 && (
            <EmptyState onRetry={() => fetchLeads()} />
          )}

          {!loading && !error && leads.length > 0 && (
            <>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>

              {hasMore && (
                <div className="pt-4 pb-2 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm rounded-lg transition-colors border border-outline-variant disabled:opacity-60 shadow-sm"
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

      {/* 3. Fixed Bottom Navigation */}
      <BottomNavigation onShowNotice={setNotice} />

      {/* 4. Accessible Toast Announcements */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
