'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LinkedInPost, PostDetailApiResponse } from '@/types/post';
import { LinkedInPostCard } from '@/components/LinkedInPostCard';
import { Toast } from '@/components/Toast';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SyncIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  EditIcon,
} from '@/components/icons';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [post, setPost] = useState<LinkedInPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [fullCopy, setFullCopy] = useState('');
  const [status, setStatus] = useState('Drafted');
  const [scheduledDate, setScheduledDate] = useState('');
  const [vertical, setVertical] = useState('GTM');

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${id}`, { cache: 'no-store' });
        const data: PostDetailApiResponse = await res.json();
        if (data.error) {
          setError(data.error.message);
        } else if (data.post) {
          setPost(data.post);
          setName(data.post.name || '');
          setFullCopy(data.post.fullCopy || '');
          setStatus(data.post.status || 'Drafted');
          setScheduledDate(data.post.scheduledDate || '');
          setVertical(data.post.vertical || 'GTM');
        } else {
          setError('Post not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load post details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handleSaveToNotion = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          fullCopy,
          status,
          scheduledDate: scheduledDate || null,
        }),
      });

      const data: PostDetailApiResponse = await res.json();
      if (data.error) {
        setNotice(`Failed to save to Notion: ${data.error.message}`);
      } else if (data.post) {
        setPost(data.post);
        setNotice('Changes saved to Notion successfully!');
      }
    } catch (err: any) {
      setNotice('Network error: failed to update Notion database');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = () => {
    if (!fullCopy) return;
    navigator.clipboard.writeText(fullCopy);
    setCopied(true);
    setNotice('Post copy copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
  };

  // Construct updated post object for live preview
  const previewPost: LinkedInPost | null = post
    ? {
        ...post,
        name,
        fullCopy,
        status,
        scheduledDate: scheduledDate || null,
        vertical,
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <SyncIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading post details...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-sm space-y-4 shadow-xs">
          <div className="text-red-500 text-3xl">⚠️</div>
          <h2 className="font-bold text-slate-900">Failed to load post</h2>
          <p className="text-xs text-slate-500">{error || 'Post not found'}</p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Content Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition tap-bounce"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Direct Notion Link */}
            {post.notionUrl && (
              <a
                href={post.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                title="Open in Notion"
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-32 space-y-4">
        {activeTab === 'edit' ? (
          <div className="space-y-4">
            {/* 1. Status Dropdown Card */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <label htmlFor="post-status-select" className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Post Status</span>
              </label>
              <div className="relative">
                <select
                  id="post-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none pr-10"
                >
                  <option value="Drafted">Drafted</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Posted">Published / Posted</option>
                  <option value="Archived">Archived</option>
                  <option value="Idea">Idea</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </section>

            {/* 2. Scheduled Date Card */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scheduled Date</span>
                </label>
                {scheduledDate && (
                  <button
                    type="button"
                    onClick={() => setScheduledDate('')}
                    className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white text-slate-800 font-medium"
              />

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(7)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Next Week
                </button>
              </div>
            </section>

            {/* 3. Post Content (Full Copy) */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                  <span>Post Copy (LinkedIn Text)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={fullCopy}
                onChange={(e) => setFullCopy(e.target.value)}
                rows={Math.max(10, fullCopy.split('\n').length + 2)}
                className="w-full p-3.5 text-[14px] text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white leading-relaxed font-normal resize-y whitespace-pre-wrap select-text font-sans"
                placeholder="Write or paste your LinkedIn post copy here..."
              />

              {/* Character & Word Metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  {fullCopy.trim().split(/\s+/).filter(Boolean).length} words • {fullCopy.length} characters
                </span>
                <span className="italic">Preserves exact Notion formatting</span>
              </div>
            </section>

            {/* 6. Attached Media Display (Read-only) */}
            {post.images && post.images.length > 0 && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
                <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                  <span>Attached Graphic</span>
                </label>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={post.images[0].url}
                    alt={post.images[0].name || post.name}
                    className="w-full h-auto max-h-72 object-cover"
                  />
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Live LinkedIn Card Preview Tab */
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/70 text-xs text-[#0a66c2] flex items-center justify-between font-medium">
              <span>This is how your post appears in the feed with your current edits.</span>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="font-bold underline hover:text-[#004182] ml-2 cursor-pointer"
              >
                Continue editing
              </button>
            </div>
            {previewPost && (
              <LinkedInPostCard
                post={previewPost}
                onShowNotice={setNotice}
                onPostUpdated={(updated) => {
                  setPost(updated);
                  setName(updated.name || '');
                  setFullCopy(updated.fullCopy || '');
                  setStatus(updated.status || 'Drafted');
                  setScheduledDate(updated.scheduledDate || '');
                  setVertical(updated.vertical || 'GTM');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-3 px-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3 justify-between">
          <button
            type="button"
            onClick={() => router.push('/posts')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold font-display text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition tap-bounce cursor-pointer"
          >
            Back to Feed
          </button>

          <button
            type="button"
            onClick={handleSaveToNotion}
            disabled={saving}
            className="flex-1 py-2.5 px-5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs sm:text-sm font-semibold font-display shadow-xs hover:shadow transition tap-bounce flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <SyncIcon className="w-4 h-4 animate-spin" />
                <span>Saving to Notion...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Save to Notion</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Toast Notice */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
