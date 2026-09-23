'use client';

import React, { useState } from 'react';
import { XIcon, SparklesIcon, RefreshCwIcon, SlidersIcon, ExternalLinkIcon } from '@/components/icons';

interface ScrapeControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVertical: 'GTM' | 'AI Video' | 'Growth Stacks';
  onScrapeSuccess: (scrapedTrends: any[], message: string) => void;
  onShowNotice: (msg: string) => void;
}

export function ScrapeControlsModal({
  isOpen,
  onClose,
  initialVertical,
  onScrapeSuccess,
  onShowNotice,
}: ScrapeControlsModalProps) {
  const [vertical, setVertical] = useState<'GTM' | 'AI Video' | 'Growth Stacks'>(initialVertical);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [minLikes, setMinLikes] = useState<number>(200);
  const [minComments, setMinComments] = useState<number>(30);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'any'>('month');
  const [maxPosts, setMaxPosts] = useState<number>(10);
  const [saveToNotion, setSaveToNotion] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/trends/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical,
          keywordQuery: keywordQuery.trim() || undefined,
          minLikes,
          minComments,
          dateRange,
          maxPosts,
          saveToNotion,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Scraper run failed. Check parameters and token quota.');
      }

      onScrapeSuccess(data.trends || [], data.message || `Successfully scraped ${data.qualifiedCount} viral posts!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete scrape.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0a66c2] flex items-center justify-center font-bold">
              <SparklesIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
                Live LinkedIn Scraper (Apify)
              </h2>
              <p className="text-xs text-slate-500">
                Run targeted scrape with custom filters. Never runs automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* 1. Target Vertical / Persona */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Target Vertical
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'GTM' as const, label: 'GTM Outbound' },
                { id: 'AI Video' as const, label: 'AI Video & Creative' },
                { id: 'Growth Stacks' as const, label: 'Growth Stacks (Co.)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVertical(v.id)}
                  className={`py-2 px-2 rounded-xl border text-center font-bold transition cursor-pointer tap-bounce truncate ${
                    vertical === v.id
                      ? 'bg-blue-50/80 border-[#0a66c2] text-[#0a66c2] ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Custom Keywords / Hashtags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                2. Search Query / Keywords
              </label>
              <span className="text-[11px] text-slate-400">Leave blank for smart vertical defaults</span>
            </div>
            <input
              type="text"
              value={keywordQuery}
              onChange={(e) => setKeywordQuery(e.target.value)}
              placeholder={
                vertical === 'GTM'
                  ? 'e.g. clay b2b outbound architecture workflow'
                  : vertical === 'AI Video'
                  ? 'e.g. ai video runway luma midjourney prompt'
                  : 'e.g. saas growth stack cold outbound automation'
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
            />
          </div>

          {/* 3. Engagement Thresholds (Min Likes & Comments) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Min Likes (Reactions)
              </label>
              <select
                value={minLikes}
                onChange={(e) => setMinLikes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              >
                <option value={50}>50+ Likes</option>
                <option value={100}>100+ Likes</option>
                <option value={200}>200+ Likes (Recommended)</option>
                <option value={500}>500+ Likes (High Virality)</option>
                <option value={1000}>1,000+ Likes (Mega Viral)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Min Comments
              </label>
              <select
                value={minComments}
                onChange={(e) => setMinComments(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              >
                <option value={10}>10+ Comments</option>
                <option value={30}>30+ Comments (Recommended)</option>
                <option value={60}>60+ Comments (High Discussion)</option>
                <option value={100}>100+ Comments (Lead Magnets)</option>
              </select>
            </div>
          </div>

          {/* 4. Date Range & Max Quantity (Cost Control) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Time Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              >
                <option value="week">Past 7 Days (Fresh)</option>
                <option value="month">Past 30 Days (Top Hits)</option>
                <option value="any">All Time (Proven Evergreen)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Batch Size
                </label>
                <span className="text-[10px] text-emerald-600 font-bold">~${(maxPosts * 0.002).toFixed(3)} cost</span>
              </div>
              <select
                value={maxPosts}
                onChange={(e) => setMaxPosts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
              >
                <option value={5}>5 Posts (Fastest ~ $0.01)</option>
                <option value={10}>10 Posts (Recommended ~ $0.02)</option>
                <option value={20}>20 Posts (~ $0.04)</option>
              </select>
            </div>
          </div>

          {/* 5. Auto Save to Notion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <p className="font-bold text-slate-800 text-xs">Save to Notion Swipe File</p>
              <p className="text-[11px] text-slate-500">
                Pushes scraped posts to Notion Database ae25432a...
              </p>
            </div>
            <input
              type="checkbox"
              checked={saveToNotion}
              onChange={(e) => setSaveToNotion(e.target.checked)}
              className="w-4 h-4 text-[#0a66c2] rounded cursor-pointer"
            />
          </div>

          {/* Apify Cost Breakdown Card */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0a66c2] text-[11px] uppercase tracking-wide">
                Apify Cost & Safety
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                Manual trigger only
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Each scrape costs approx <strong>$0.01 to $0.03</strong> (billed against Apify's $5.00/mo free monthly credit = ~250 free scrapes/month). It will <strong>never run automatically</strong> in the background.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 tap-bounce"
            >
              {isLoading ? (
                <>
                  <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Scraping LinkedIn via Apify...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Start Live Scrape</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
