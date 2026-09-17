'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LinkedInPost, PostsApiResponse } from '@/types/post';
import { LinkedInPostCard } from '@/components/LinkedInPostCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/Toast';
import { SyncIcon, ExternalLinkIcon } from '@/components/icons';

type PostFilterTab = 'All' | 'Scheduled' | 'Drafts' | 'Published';

export default function PostsPage() {
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
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPosts = useCallback(async (filter: PostFilterTab) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter !== 'All') {
        params.set('status', filter);
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
      setError(err?.message || 'Failed to connect to Notion Content Hub.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeFilter);
  }, [activeFilter, fetchPosts]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Main Flow Container */}
      <main className="flex-1 flex flex-col w-full pb-28 px-3.5 sm:px-4 max-w-lg mx-auto gap-4">
        {/* Top Notion Sync & Segmented Filter Bar */}
        <section className="sticky top-0 z-30 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 pt-3 pb-2.5 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/70 flex flex-col gap-2.5">
          {/* Status Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Synced with Notion Content Hub</span>
            </div>

            <a
              href="https://app.notion.com/p/a724a9edba084af0b407862ca6dbff41?v=b8f637e46fe14182a5abb7ba21a2ecd0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
              title="Open database in Notion"
            >
              <span>Content Hub</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Segmented Filter Control */}
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-medium select-none shadow-2xs">
            <button
              onClick={() => setActiveFilter('All')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce ${
                activeFilter === 'All'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All {counts.all > 0 ? `(${counts.all})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Scheduled')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce ${
                activeFilter === 'Scheduled'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled {counts.scheduled > 0 ? `(${counts.scheduled})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Drafts')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce ${
                activeFilter === 'Drafts'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drafts {counts.drafts > 0 ? `(${counts.drafts})` : ''}
            </button>

            <button
              onClick={() => setActiveFilter('Published')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer tap-bounce ${
                activeFilter === 'Published'
                  ? 'bg-white text-blue-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published {counts.published > 0 ? `(${counts.published})` : ''}
            </button>
          </div>
        </section>

        {/* Loading State Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse pt-2">
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
            <p className="font-semibold text-sm">Failed to load posts from Notion</p>
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={() => fetchPosts(activeFilter)}
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
              No posts matched the <span className="font-semibold">"{activeFilter}"</span> filter in your Notion Content Hub database.
            </p>
            <button
              onClick={() => fetchPosts(activeFilter)}
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
              <LinkedInPostCard key={post.id} post={post} onShowNotice={setNotice} />
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
