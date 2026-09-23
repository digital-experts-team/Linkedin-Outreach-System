'use client';

import React, { useState } from 'react';
import { ViralTrendPost } from '@/types/trend';
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  SparklesIcon,
  ImageIcon,
  GlobeIcon,
  LinkedInVerifiedIcon,
  ThumbUpIcon,
  ChatBubbleIcon,
  RepeatIcon,
  TagIcon,
  HelpCircleIcon,
  XIcon,
  RefreshCwIcon,
} from './icons';

interface ViralTrendCardProps {
  trend: ViralTrendPost;
  onRepurpose: (trend: ViralTrendPost) => void;
  onShowNotice: (msg: string) => void;
  isRepurposing?: boolean;
}

/**
 * Truncates text based on LinkedIn feed parameters (max 3 lines or ~180-210 characters),
 * matching the behavior of LinkedInPostCard on the content page.
 */
function getLinkedInSnippet(text: string, maxLines = 3, maxChars = 200): { isTruncated: boolean; snippet: string } {
  if (!text) return { isTruncated: false, snippet: '' };

  const lines = text.split('\n');
  if (lines.length > maxLines) {
    const firstLines = lines.slice(0, maxLines).join('\n');
    return {
      isTruncated: true,
      snippet: firstLines,
    };
  }

  if (text.length > maxChars) {
    let sliceIdx = text.lastIndexOf(' ', maxChars);
    if (sliceIdx < maxChars - 40) sliceIdx = maxChars;
    return {
      isTruncated: true,
      snippet: text.slice(0, sliceIdx).trim(),
    };
  }

  return { isTruncated: false, snippet: text };
}

export function ViralTrendCard({ trend, onRepurpose, onShowNotice, isRepurposing = false }: ViralTrendCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; title?: string } | null>(null);

  const { decisionInsights, originalAuthor, taggedEntities } = trend;

  const handleCopyText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(trend.fullCopy || trend.hook || trend.title);
      setCopied(true);
      onShowNotice('Post text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowNotice('Could not copy text to clipboard');
    }
  };

  const authorAvatarUrl = avatarError
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(originalAuthor.name)}&background=0a66c2&color=fff&bold=true`
    : originalAuthor.avatarUrl;

  const displayImage = imgError
    ? 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80'
    : trend.imageUrl;

  return (
    <>
      <article className="bg-white rounded-none border-y border-slate-200/90 shadow-none transition-all flex flex-col w-full">
        {/* 1. LinkedIn Author Header - Exactly matching LinkedInPostCard */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {authorAvatarUrl ? (
              <img
                src={authorAvatarUrl}
                alt={originalAuthor.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200/50 shadow-xs bg-slate-100"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0a66c2] font-bold text-sm shrink-0 flex items-center justify-center border border-blue-100">
                {originalAuthor.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[14.5px] font-semibold text-[#191919] leading-snug">
                  {originalAuthor.name}
                </span>
                {originalAuthor.isVerified && (
                  <LinkedInVerifiedIcon className="w-3.5 h-3.5 shrink-0 text-slate-700 inline-block" />
                )}
                <span className="text-slate-500 text-xs shrink-0 font-normal">
                  • {originalAuthor.handle}
                </span>
              </div>

              <p
                className="text-[12px] text-slate-500 truncate leading-snug font-normal mt-0.5"
                title={originalAuthor.headline}
              >
                {originalAuthor.headline}
              </p>

              {/* Date & Public Visibility Line (Authentic LinkedIn style) */}
              <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-normal mt-0.5">
                <span>Trending Viral</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <GlobeIcon className="w-3 h-3 text-slate-500" />
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Copy Icon + Open in LinkedIn/Source */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyText}
              className="p-2 rounded-xl text-slate-400 hover:text-[#0a66c2] hover:bg-blue-50 transition-all tap-bounce cursor-pointer border border-transparent hover:border-blue-100"
              title="Copy post text"
              aria-label="Copy post text"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>

            {trend.sourceUrl && (
              <a
                href={trend.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition tap-bounce cursor-pointer"
                title="View original LinkedIn post"
                aria-label="View original LinkedIn post"
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* 2. Post Body Content (Rendered BEFORE media, exactly matching LinkedIn & Content Page) */}
        <div className="px-4 pt-1 pb-3 font-sans">
          {(() => {
            const copy = trend.fullCopy || trend.hook || trend.title;
            if (!copy) {
              return <p className="text-secondary italic text-sm">No post copy available.</p>;
            }
            const { isTruncated, snippet } = getLinkedInSnippet(copy, 3, 200);

            if (isTruncated && !isExpanded) {
              return (
                <div className="space-y-1">
                  <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                    {snippet}
                    <span className="text-slate-500">... </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                      }}
                      className="text-slate-500 hover:text-[#0a66c2] font-semibold text-[13.5px] transition-colors cursor-pointer inline-flex items-center"
                    >
                      more
                    </button>
                  </div>
                </div>
              );
            }

            if (isTruncated && isExpanded) {
              return (
                <div className="space-y-1">
                  <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                    {copy}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }}
                      className="text-slate-500 hover:text-[#0a66c2] font-semibold text-xs py-0.5 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>less</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                {copy}
              </div>
            );
          })()}
        </div>

        {/* 3. Media Image Attachment - Full Width & Clean Like Content Page */}
        <div className="w-full relative group overflow-hidden bg-slate-950">
          <img
            src={displayImage}
            alt={trend.imageAlt || trend.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            onClick={() => setLightboxMedia({ url: displayImage, title: trend.title })}
            className="w-full h-auto max-h-[540px] object-cover block cursor-pointer rounded-none"
            loading="lazy"
          />

          {/* Archetype Pill Badge */}
          <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md pointer-events-none z-10 border border-white/10">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wide uppercase">{trend.photoArchetype}</span>
          </div>

          {/* Zoom Quick Action Overlay */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={() => setLightboxMedia({ url: displayImage, title: trend.title })}
              className="bg-black/75 hover:bg-black/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1 transition cursor-pointer shadow-sm border border-white/10"
              title="Zoom diagram"
            >
              <EyeIcon className="w-3.5 h-3.5" />
              <span>Zoom</span>
            </button>
          </div>
        </div>

        {/* 4. Action Footer: Tags on Left, Social Stats & Repurpose on Right */}
        <div className="px-4 py-2.5 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-2 flex-wrap sm:flex-nowrap">
          {/* Left: Tags (Viral Score, Vertical, Archetype, Social Stats) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            {/* Viral Score Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Score {trend.viralScore}</span>
            </span>

            {/* Vertical Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              {trend.vertical}
            </span>

            {/* Archetype Badge (Hidden on smallest mobile) */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
              {trend.photoArchetype}
            </span>

            {/* Social Metrics */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium pl-1">
              <span className="flex items-center gap-1" title="Estimated Likes">
                <ThumbUpIcon className="w-3 h-3 text-blue-600" />
                <span>{trend.likesCount.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1" title="Comments">
                <ChatBubbleIcon className="w-3 h-3 text-slate-400" />
                <span>{trend.commentsCount}</span>
              </span>
              {trend.repostsCount > 0 && (
                <span className="hidden md:flex items-center gap-1" title="Reposts">
                  <RepeatIcon className="w-3 h-3 text-slate-400" />
                  <span>{trend.repostsCount}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: AI Insights Toggle & Repurpose CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* AI Insights Button */}
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border shadow-2xs transition-all tap-bounce cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                showInsights
                  ? 'bg-blue-50 text-[#0a66c2] border-blue-200'
                  : 'bg-white text-slate-600 hover:text-[#0a66c2] hover:bg-blue-50/80 border-slate-200 hover:border-blue-200'
              }`}
              title="Explainable Decision Insights"
            >
              <HelpCircleIcon className="w-4 h-4 text-[#0a66c2]" />
              <span className="hidden sm:inline">{showInsights ? 'Hide Audit' : 'Why It Blew Up'}</span>
            </button>

            {/* Primary Repurpose CTA */}
            <button
              type="button"
              onClick={() => onRepurpose(trend)}
              disabled={isRepurposing}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-white text-xs font-semibold rounded-xl shadow-xs transition tap-bounce cursor-pointer ${
                isRepurposing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-[#0a66c2] hover:bg-[#004182]'
              }`}
            >
              {isRepurposing ? (
                <>
                  <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Repurposing...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Repurpose</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5. Explainable Decision Insights Drawer ("Why decisions were taken") */}
        {showInsights && (
          <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 font-display text-[11.5px] uppercase tracking-wider">
                <SparklesIcon className="w-3.5 h-3.5 text-[#0a66c2]" />
                Algorithmic & Psychological Audit
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Retention: {decisionInsights.visualStrategy.visualRetentionScore}/100
              </span>
            </div>

            <div className="space-y-1.5 text-[11.5px] text-slate-600 leading-normal">
              <div>
                <strong className="text-slate-900 font-semibold">Hook Trigger: </strong>
                {decisionInsights.hookPsychology.type} — {decisionInsights.hookPsychology.whyItWorks}
              </div>
              <div>
                <strong className="text-slate-900 font-semibold">Visual Photo Impact: </strong>
                {decisionInsights.visualStrategy.whyThisPhotoWorks} ({decisionInsights.hookPsychology.dwellTimeImpact})
              </div>
              <div>
                <strong className="text-slate-900 font-semibold">Strategic Tagging: </strong>
                {decisionInsights.taggingStrategy.rationale}
              </div>
            </div>

            {/* Strategic Tag Chips */}
            {taggedEntities && taggedEntities.length > 0 && (
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5 border-t border-slate-200/50">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <TagIcon className="w-3 h-3" /> Recommended @Tags:
                </span>
                {taggedEntities.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[10.5px] font-mono font-bold shadow-2xs"
                    title={tag.reason}
                  >
                    <span className="text-[#0a66c2]">{tag.handle}</span>
                    <span className="text-slate-400 font-sans font-normal text-[9.5px]">({tag.name})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </article>

      {/* Lightbox Modal for Image Zoom - Exactly matching LinkedInPostCard */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="bg-[#0a66c2] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  {trend.photoArchetype}
                </span>
                <span className="text-xs text-slate-300 truncate max-w-[280px] sm:max-w-md font-medium">
                  {lightboxMedia.title || trend.title}
                </span>
              </div>
              <button
                onClick={() => setLightboxMedia(null)}
                className="text-white hover:text-gray-200 text-sm font-semibold px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={lightboxMedia.url}
              alt={trend.title}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
