'use client';

import React, { useState } from 'react';
import { LinkedInPost } from '@/types/post';
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  SlidersIcon,
  CalendarIcon,
  TrendingUpIcon,
} from './icons';

interface LinkedInPostCardProps {
  post: LinkedInPost;
  onShowNotice?: (msg: string) => void;
}

function formatPostDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Unscheduled';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  if (match) {
    const [, , mm, dd] = match;
    const monthIndex = parseInt(mm, 10) - 1;
    const monthName = MONTH_ABBR[monthIndex] || mm;
    return `${parseInt(dd, 10)} ${monthName}`;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
  }
  return dateStr;
}

export function LinkedInPostCard({ post, onShowNotice }: LinkedInPostCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const displayDate = formatPostDisplayDate(post.scheduledDate || post.postedDate || post.weekOf);
  const isScheduled = (post.status || '').toLowerCase().includes('scheduled');
  const isDraft = (post.status || '').toLowerCase().includes('draft') || (post.status || '').toLowerCase().includes('idea');
  const isPublished = (post.status || '').toLowerCase().includes('published') || (post.status || '').toLowerCase().includes('done');

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.fullCopy) return;
    navigator.clipboard.writeText(post.fullCopy);
    setCopied(true);
    if (onShowNotice) {
      onShowNotice('LinkedIn post copy copied to clipboard');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  // Render text copy as it is in Notion
  const renderFormattedCopy = () => {
    if (!post.fullCopy) {
      return <p className="text-secondary italic">No post copy written yet.</p>;
    }

    return (
      <div className="text-[13.5px] sm:text-[14px] text-slate-900 leading-relaxed font-normal whitespace-pre-wrap break-words">
        {post.fullCopy}
      </div>
    );
  };

  const hasImages = post.images && post.images.length > 0;

  return (
    <>
      <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary/40">
        {/* 1. LinkedIn Author Header */}
        <div className="p-4 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {post.authorAvatarUrl ? (
              <img
                src={post.authorAvatarUrl}
                alt={post.authorName || 'Author avatar'}
                className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-slate-100 shadow-2xs"
                loading="lazy"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-blue-100 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                {(post.authorName || 'AV').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[14px] font-bold text-slate-900 truncate">
                  {post.authorName || 'Alex Vance'}
                </span>
                <span className="text-slate-400 text-xs shrink-0 font-normal">• You</span>
              </div>

              <p className="text-[12px] text-slate-500 truncate leading-tight mt-0.5">
                {post.authorHeadline || 'Founder & CEO at Outreach Pilot'}
              </p>

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1 font-medium">
                <span className="text-blue-600 font-semibold">{displayDate}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5" title="Public post">
                  🌐 Public
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {post.vertical && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 hidden sm:inline-block">
                {post.vertical}
              </span>
            )}
            <a
              href={post.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              title="Open in Notion"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2. Post Body Content */}
        <div className="px-4 py-1">{renderFormattedCopy()}</div>

        {/* 3. Media Graphic / Image Attachment */}
        {hasImages && (
          <div className="px-4 pt-3 pb-2">
            <div className="rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 relative group">
              <img
                src={post.images[0].url}
                alt={post.images[0].name || post.name}
                className="w-full h-auto max-h-[480px] object-cover block cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
                onClick={() => setLightboxImage(post.images[0].url)}
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(post.images[0].url)}
                className="absolute bottom-2.5 right-2.5 bg-black/70 hover:bg-black/85 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Zoom</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Social Reactions Simulation Mini Bar */}
        <div className="px-4 py-2 mt-1 flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 select-none">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1 items-center">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-2xs">
                👍
              </span>
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-2xs">
                💡
              </span>
            </div>
            <span className="font-medium text-slate-600">You and 42 others</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            {post.ctaKeyword && (
              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                Keyword: "{post.ctaKeyword}"
              </span>
            )}
            <span>14 comments expected</span>
          </div>
        </div>

        {/* 5. Streamlined Card Action Footer */}
        <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isScheduled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isPublished
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isScheduled ? 'bg-emerald-500' : isPublished ? 'bg-blue-500' : 'bg-gray-400'
                }`}
              />
              <span>{post.status || 'Draft'}</span>
            </span>

            {post.angleType && (
              <span className="text-[11px] font-medium text-secondary bg-white px-2 py-0.5 rounded border border-outline-variant/60 hidden sm:inline-block">
                {post.angleType}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all tap-bounce cursor-pointer"
              title="Copy post copy to clipboard"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
                  <span className="text-green-700">Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Copy Copy</span>
                </>
              )}
            </button>

            {hasImages && (
              <button
                type="button"
                onClick={() => setLightboxImage(post.images[0].url)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-all tap-bounce cursor-pointer"
                title="Preview full graphic"
              >
                <EyeIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Lightbox Modal for Image Zoom */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-semibold px-3 py-1 bg-white/20 rounded-full cursor-pointer"
            >
              ✕ Close
            </button>
            <img
              src={lightboxImage}
              alt="Full Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
