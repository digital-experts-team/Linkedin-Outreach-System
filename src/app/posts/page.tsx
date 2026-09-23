'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LinkedInPost, PostsApiResponse } from '@/types/post';
import { LinkedInPostCard } from '@/components/LinkedInPostCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/Toast';
import { SyncIcon, PlusIcon } from '@/components/icons';
import { QuickCreatePostModal } from '@/components/QuickCreatePostModal';

type PostFilterTab = 'All' | 'Scheduled' | 'Drafts' | 'Published';

export default function PostsPage() {
  const [activeVertical, setActiveVertical] = useState<string>('All');
  const [activeFilter, setActiveFilter] = useState<PostFilterTab>('All');
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [counts, setCounts] = useState<{ all: number; scheduled: number; drafts: number; published: number }>({
    all: 0,
    scheduled: 0,
    drafts: 0,
    published: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Notification State
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Fetch Notion posts
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f2ef] text-slate-900 antialiased font-sans">
      <main className="flex-1 flex flex-col w-full pb-28 px-0 max-w-lg mx-auto">
        {/* Top Header Bar */}
        <header className="px-3.5 sm:px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-200/70 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-bold font-display text-slate-900 tracking-tight leading-tight">
                LinkedIn Posts
              </h1>
              <p className="text-[11px] text-slate-500">
                Scheduled & draft posts synced with Notion Content Hub
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer tap-bounce font-display"
                title="Create new LinkedIn post"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>New Post</span>
              </button>

              <button
                onClick={() => fetchPosts(activeVertical, activeFilter)}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 shadow-2xs tap-bounce cursor-pointer"
                title="Refresh feed"
                aria-label="Refresh feed"
              >
                <SyncIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0a66c2]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Persona / Vertical Switcher */}
          <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold select-none">
            {[
              { id: 'All', label: 'All' },
              { id: 'GTM', label: 'Tibin · GTM' },
              { id: 'AI Video', label: 'Tibin · Video' },
              { id: 'Growth Stacks', label: 'Growth Stacks' },
            ].map((v) => {
              const isSelected = activeVertical.toLowerCase() === v.id.toLowerCase();
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVertical(v.id)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer tap-bounce truncate ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Sticky Status Filter Tabs */}
        <section className="sticky top-0 z-30 px-3.5 sm:px-4 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs mb-2">
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center text-xs font-semibold select-none border border-slate-200/50">
            {(['All', 'Scheduled', 'Drafts', 'Published'] as PostFilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce font-display ${
                  activeFilter === tab
                    ? 'bg-white text-[#0a66c2] font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab} {tab === 'All' && counts.all > 0 ? `(${counts.all})` : ''}
                {tab === 'Scheduled' && counts.scheduled > 0 ? `(${counts.scheduled})` : ''}
                {tab === 'Drafts' && counts.drafts > 0 ? `(${counts.drafts})` : ''}
                {tab === 'Published' && counts.published > 0 ? `(${counts.published})` : ''}
              </button>
            ))}
          </div>
        </section>

        {/* FEED CONTENT */}
        {loading && (
          <div className="space-y-2 w-full animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-4 border-y border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-100" />
                <div className="h-48 bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mx-3.5 sm:mx-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-5 text-center space-y-3 mt-4">
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

        {!loading && !error && posts.length === 0 && (
          <div className="mx-3.5 sm:mx-4 bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3 my-6 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-primary mx-auto flex items-center justify-center font-bold text-lg">
              📝
            </div>
            <h3 className="font-bold text-slate-900 text-base">No posts found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              No posts matched {activeVertical !== 'All' ? `"${activeVertical}"` : 'any vertical'} with status "{activeFilter}".
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Create Post Now</span>
              </button>
            </div>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-2 w-full">
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

      <BottomNavigation onShowNotice={setNotice} />

      <QuickCreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialVertical={activeVertical !== 'All' ? activeVertical : 'GTM'}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          setCounts((prev) => ({
            ...prev,
            all: prev.all + 1,
            drafts: (newPost.status || '').toLowerCase().includes('draft') ? prev.drafts + 1 : prev.drafts,
            scheduled: (newPost.status || '').toLowerCase().includes('scheduled') ? prev.scheduled + 1 : prev.scheduled,
          }));
          setNotice('Post created successfully!');
        }}
        onShowNotice={setNotice}
      />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
