'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LinkedInPost, PostsApiResponse } from '@/types/post';
import { LinkedInPostCard } from '@/components/LinkedInPostCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/Toast';
import { SyncIcon } from '@/components/icons';

type PostFilterTab = 'All' | 'Scheduled' | 'Drafts' | 'Published';

interface VerticalItem {
  name: string;
  count: number;
}

export default function PostsPage() {
  const [activeVertical, setActiveVertical] = useState<string>('All');
  const [activeFilter, setActiveFilter] = useState<PostFilterTab>('All');
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [verticalsList, setVerticalsList] = useState<VerticalItem[]>([]);
  const [counts, setCounts] = useState<{ all: number; scheduled: number; drafts: number; published: number }>({
    all: 0,
    scheduled: 0,
    drafts: 0,
    published: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPosts = useCallback(async (vertical: string, statusFilter: PostFilterTab) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (vertical !== 'All') {
        params.set('vertical', vertical);
      }
      if (statusFilter !== 'All') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/posts?${params.toString()}`, { cache: 'no-store' });
      const data: PostsApiResponse = await res.json();

      if (data.error) {
        setError(data.error.message);
        setPosts([]);
      } else {
        setPosts(data.posts || []);
        if (data.counts) {
          setCounts(data.counts);
        }
        if (data.verticals && data.verticals.length > 0) {
          setVerticalsList(data.verticals);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Content Hub database.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeVertical, activeFilter);
  }, [activeVertical, activeFilter, fetchPosts]);

  // Compute total count across verticals
  const totalAllVerticals = verticalsList.reduce((acc, v) => acc + v.count, 0);

  // Available vertical choices: "All" + each distinct vertical from Notion
  const verticalOptions = [
    { name: 'All', count: totalAllVerticals || counts.all },
    ...verticalsList,
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Main Flow Container */}
      <main className="flex-1 flex flex-col w-full pb-28 px-3.5 sm:px-4 max-w-lg mx-auto gap-4">
        {/* Top Sticky Filter Controls: Parent Verticals Toggle + Child Status Filter */}
        <section className="sticky top-0 z-30 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 pt-3 pb-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex flex-col gap-2.5">
          {/* Page Title & Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
                Content Hub
              </h1>
              <p className="text-xs text-slate-500">
                Scheduled & draft posts synced with Notion
              </p>
            </div>
            <button
              onClick={() => fetchPosts(activeVertical, activeFilter)}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 shadow-2xs tap-bounce cursor-pointer"
              title="Refresh posts"
              aria-label="Refresh posts"
            >
              <SyncIcon className={`w-4 h-4 ${loading ? 'animate-spin text-[#0a66c2]' : ''}`} />
            </button>
          </div>

          {/* 1. Parent Toggle: Verticals */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            {verticalOptions.map((v) => {
              const isSelected = activeVertical.toLowerCase() === v.name.toLowerCase();
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setActiveVertical(v.name)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer tap-bounce flex items-center justify-center gap-1.5 font-display ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs font-bold border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span className="truncate">{v.name}</span>
                  {v.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-[#0a66c2]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {v.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. Child Filter: Status (All, Scheduled, Drafts, Published) */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center text-xs font-semibold select-none border border-slate-200/50">
            <button
              onClick={() => setActiveFilter('All')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce font-display ${
                activeFilter === 'All'
                  ? 'bg-white text-[#0a66c2] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All {counts.all > 0 ? `(${counts.all})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Scheduled')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce font-display ${
                activeFilter === 'Scheduled'
                  ? 'bg-white text-[#0a66c2] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled {counts.scheduled > 0 ? `(${counts.scheduled})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Drafts')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce font-display ${
                activeFilter === 'Drafts'
                  ? 'bg-white text-[#0a66c2] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drafts {counts.drafts > 0 ? `(${counts.drafts})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Published')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce font-display ${
                activeFilter === 'Published'
                  ? 'bg-white text-[#0a66c2] font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published {counts.published > 0 ? `(${counts.published})` : ''}
            </button>
          </div>
        </section>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse pt-1">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-200 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-48 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-5 text-center space-y-3 mt-4">
            <p className="font-semibold text-sm">Failed to load posts</p>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => fetchPosts(activeVertical, activeFilter)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3 my-6 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-primary mx-auto flex items-center justify-center font-bold text-lg">
              📝
            </div>
            <h3 className="font-bold text-slate-900 text-base">No posts found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              No posts matched{' '}
              {activeVertical !== 'All' ? (
                <span className="font-semibold">"{activeVertical}" vertical</span>
              ) : (
                'any vertical'
              )}{' '}
              with status <span className="font-semibold">"{activeFilter}"</span>.
            </p>
            <button
              onClick={() => fetchPosts(activeVertical, activeFilter)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <SyncIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Posts</span>
            </button>
          </div>
        )}

        {/* Posts Feed */}
        {!loading && !error && posts.length > 0 && (
          <div className="space-y-4 pt-1">
            {posts.map((post) => (
              <LinkedInPostCard
                key={post.id}
                post={post}
                onShowNotice={setNotice}
                onPostUpdated={(updatedPost) =>
                  setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
                }
                onPostDeleted={(deletedId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== deletedId));
                  setCounts((prev) => ({
                    ...prev,
                    all: Math.max(0, prev.all - 1),
                  }));
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNavigation onShowNotice={setNotice} />

      {/* Toast Notification */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
