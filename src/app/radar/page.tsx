'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ViralTrendPost, TrendsApiResponse } from '@/types/trend';
import { ViralTrendCard } from '@/components/ViralTrendCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/Toast';
import {
  SyncIcon,
  PlusIcon,
  SparklesIcon,
  ImageIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  VideoIcon,
  FlameIcon,
} from '@/components/icons';
import { QuickCreatePostModal, RepurposeInitialData } from '@/components/QuickCreatePostModal';
import { ScrapeControlsModal } from '@/components/ScrapeControlsModal';

type RadarVertical = 'All' | 'GTM' | 'AI Video' | 'Growth Stacks';

export default function ViralRadarPage() {
  const [trends, setTrends] = useState<ViralTrendPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVertical, setSelectedVertical] = useState<RadarVertical>('All');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [repurposingId, setRepurposingId] = useState<string | null>(null);

  // Modal & Notification State
  const [notice, setNotice] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isScraperModalOpen, setIsScraperModalOpen] = useState<boolean>(false);
  const [repurposeData, setRepurposeData] = useState<RepurposeInitialData | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVertical !== 'All') params.set('vertical', selectedVertical);
      if (selectedArchetype !== 'All') params.set('archetype', selectedArchetype);
      if (searchQuery.trim()) params.set('query', searchQuery.trim());

      const res = await fetch(`/api/trends?${params.toString()}`, { cache: 'no-store' });
      const data: TrendsApiResponse = await res.json();
      if (data.trends) {
        setTrends(data.trends);
      }
    } catch (err) {
      console.warn('Failed to load viral radar trends:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedVertical, selectedArchetype, searchQuery]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleAutoDiscover = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedVertical !== 'All' ? selectedVertical : 'B2B GTM and AI Creative',
          vertical: selectedVertical !== 'All' ? selectedVertical : 'GTM',
        }),
      });
      const data = await res.json();
      if (data.trend) {
        setTrends((prev) => [data.trend, ...prev]);
        setNotice(`Discovered viral format: "${data.trend.title.slice(0, 35)}..."!`);
      } else {
        setNotice('No new trend format discovered.');
      }
    } catch (err: any) {
      setNotice('Could not complete auto-discovery.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRepurpose = async (trend: ViralTrendPost) => {
    setRepurposingId(trend.id);
    try {
      const res = await fetch('/api/trends/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendId: trend.id,
          targetVertical: trend.vertical,
          authorName: trend.vertical === 'Growth Stacks' ? 'Growth Stacks' : 'Tibin Jacob',
          authorHandle: trend.vertical === 'Growth Stacks' ? '@growthstacks' : '@tibinjacob',
        }),
      });
      const data = await res.json();
      const rep = data.blueprint;

      setRepurposeData({
        name: `Repurposed: ${trend.title}`,
        fullCopy: rep?.fullCopy || trend.fullCopy,
        hook: rep?.hook || trend.hook,
        vertical: rep?.vertical || trend.vertical,
        ctaKeyword:
          rep?.ctaKeyword ||
          (trend.vertical === 'Growth Stacks' ? 'GROWTH' : trend.vertical === 'AI Video' ? 'PROMPT' : 'STACK'),
        photoDirection: rep?.photoDirection || trend.photoDescription,
        taggedEntities: rep?.taggedEntities || trend.taggedEntities || [],
        decisionInsights: rep?.decisionInsights || trend.decisionInsights,
        images:
          rep?.media && rep.media.length > 0
            ? rep.media
            : [
                {
                  url: trend.imageUrl,
                  name: `${trend.photoArchetype.replace(/\s+/g, '_').toLowerCase()}.jpg`,
                  type: 'image',
                },
              ],
        originalMedia: {
          url: trend.imageUrl,
          title: trend.title,
          archetype: trend.photoArchetype,
        },
        diagramSpec: rep?.diagramSpec,
        visualInsights: rep?.visualInsights,
      });
      setIsCreateModalOpen(true);
      setNotice(`Ready to adapt "${trend.title.slice(0, 30)}..." into your posts!`);
    } catch (err) {
      console.warn('Fallback to local blueprint:', err);
      const blueprint = trend.repurposeBlueprint;
      setRepurposeData({
        name: `Repurposed: ${trend.title}`,
        fullCopy: blueprint?.recommendedCopy || trend.fullCopy,
        hook: blueprint?.recommendedHook || trend.hook,
        vertical: trend.vertical,
        ctaKeyword:
          blueprint?.ctaTrigger ||
          (trend.vertical === 'Growth Stacks' ? 'GROWTH' : trend.vertical === 'AI Video' ? 'PROMPT' : 'STACK'),
        photoDirection: blueprint?.photoConcept || trend.photoDescription,
        taggedEntities: trend.taggedEntities || [],
        decisionInsights: trend.decisionInsights,
        images: [
          {
            url: trend.imageUrl,
            name: `${trend.photoArchetype.replace(/\s+/g, '_').toLowerCase()}.jpg`,
            type: 'image',
          },
        ],
        originalMedia: {
          url: trend.imageUrl,
          title: trend.title,
          archetype: trend.photoArchetype,
        },
      });
      setIsCreateModalOpen(true);
    } finally {
      setRepurposingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f2ef] text-slate-900 antialiased font-sans">
      <main className="flex-1 flex flex-col w-full pb-28 px-0 max-w-lg mx-auto">
        {/* Top Header & Fast Switcher */}
        <header className="px-3.5 sm:px-4 pt-3.5 pb-2.5 bg-white border-b border-slate-200/70 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0a66c2] flex items-center justify-center font-black">
                <FlameIcon className="w-4 h-4 text-[#0a66c2]" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-display text-slate-900 tracking-tight leading-tight">
                  Viral Radar
                </h1>
                <p className="text-[11px] text-slate-500">
                  Swipe files, format breakdowns & 1-click repurposing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsScraperModalOpen(true)}
                className="px-3 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer tap-bounce font-display"
                title="Scrape real LinkedIn posts with your criteria"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Live Scrape</span>
              </button>

              <button
                onClick={fetchTrends}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 shadow-2xs tap-bounce cursor-pointer"
                title="Refresh radar"
                aria-label="Refresh radar"
              >
                <SyncIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0a66c2]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Identity / Vertical Switcher */}
          <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold select-none">
            {[
              { id: 'All' as RadarVertical, label: 'All' },
              { id: 'GTM' as RadarVertical, label: 'GTM' },
              { id: 'AI Video' as RadarVertical, label: 'AI Video' },
              { id: 'Growth Stacks' as RadarVertical, label: 'Growth Stacks' },
            ].map((tab) => {
              const isSelected = selectedVertical === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedVertical(tab.id)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer tap-bounce truncate ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Sticky Sub-filters: Archetype Chips */}
        <section className="sticky top-0 z-30 px-3.5 sm:px-4 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs mb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            {[
              'All',
              'Architecture Diagram',
              'Workflow Screenshot',
              'Comparison Grid',
              'Cheat Sheet Infographic',
            ].map((arch) => {
              const active = selectedArchetype === arch;
              return (
                <button
                  key={arch}
                  type="button"
                  onClick={() => setSelectedArchetype(arch)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {arch}
                </button>
              );
            })}
          </div>
        </section>

        {/* Feed Stream */}
        <div className="space-y-2 w-full">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border-y border-slate-200 p-4 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-14 bg-slate-100 rounded" />
                  <div className="h-48 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : trends.length === 0 ? (
            <div className="mx-4 bg-white rounded-2xl p-8 text-center space-y-3 border border-slate-200">
              <p className="text-sm font-bold text-slate-700">No swipe posts found for this filter</p>
              <button
                type="button"
                onClick={handleAutoDiscover}
                className="px-4 py-2 bg-[#0a66c2] text-white text-xs font-bold rounded-xl"
              >
                Scan for Trending Posts
              </button>
            </div>
          ) : (
            trends.map((trend) => (
              <ViralTrendCard
                key={trend.id}
                trend={trend}
                onRepurpose={handleRepurpose}
                onShowNotice={setNotice}
                isRepurposing={repurposingId === trend.id}
              />
            ))
          )}
        </div>
      </main>

      <BottomNavigation onShowNotice={setNotice} />

      <ScrapeControlsModal
        isOpen={isScraperModalOpen}
        onClose={() => setIsScraperModalOpen(false)}
        initialVertical={selectedVertical !== 'All' ? selectedVertical : 'GTM'}
        onScrapeSuccess={(scrapedTrends, message) => {
          if (scrapedTrends && scrapedTrends.length > 0) {
            setTrends((prev) => [...scrapedTrends, ...prev]);
          }
          setNotice(message);
        }}
        onShowNotice={setNotice}
      />

      <QuickCreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setRepurposeData(null);
        }}
        initialVertical={repurposeData?.vertical || (selectedVertical !== 'All' ? selectedVertical : 'GTM')}
        initialData={repurposeData}
        onPostCreated={() => {
          setNotice('Post created and added to your Content Hub!');
        }}
        onShowNotice={setNotice}
      />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
