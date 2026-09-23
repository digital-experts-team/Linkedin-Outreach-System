'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { ScoreBadge } from './ScoreBadge';
import { ContactLinks } from './ContactLinks';
import { LinkedInAction } from './LinkedInAction';
import { CalendarIcon } from './icons';

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

function formatCardDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, , mm, dd] = match;
    const monthIndex = parseInt(mm, 10) - 1;
    const monthName = MONTH_ABBR[monthIndex] || mm;
    const day = parseInt(dd, 10);
    return `${day} ${monthName}`;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const day = d.getDate();
    const monthName = MONTH_ABBR[d.getMonth()] || String(d.getMonth() + 1);
    return `${day} ${monthName}`;
  }
  return dateStr;
}

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter();
  const hasSubtitle = lead.postedBy || lead.company;
  const rawDate = lead.posted || lead.signalDate || lead.sendDate || lead.commentDate;
  const displayDate = formatCardDate(rawDate);

  const handleCardClick = (e: React.MouseEvent) => {
    // If user clicked inside an interactive button, link, or input, don't navigate
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, [role="button"]')) {
      return;
    }
    router.push(`/leads/${lead.id}`);
  };

  // Determine insight / scraped trigger hook text
  const triggerHook =
    lead.signalSnippet ||
    (lead.verticalId === 'ai_video' ? lead.whySignalApt : null) ||
    lead.linkedInDm ||
    lead.postSummary ||
    '';

  return (
    <article
      onClick={handleCardClick}
      className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-card-hover hover:border-blue-300/80 transition-all duration-200 flex flex-col gap-3.5 cursor-pointer group select-none relative"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/leads/${lead.id}`);
        }
      }}
      aria-label={`View details for ${lead.role}`}
    >
      {/* 1. Top Row: Score on left, Status, and Date on right */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ScoreBadge score={lead.score} />
          <StatusBadge status={lead.linkedInStatus} />
        </div>
        {displayDate && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200/70 flex-shrink-0">
            <CalendarIcon className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span>{displayDate}</span>
          </span>
        )}
      </div>

      {/* 2. Role-First Visual Anchor & Candidate/Company Metadata */}
      <div>
        <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-snug tracking-tight group-hover:text-[#0a66c2] transition-colors">
          {lead.role}
        </h3>
        {hasSubtitle && (
          <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
            {lead.postedBy && (
              <span className="font-semibold text-slate-800">{lead.postedBy}</span>
            )}
            {lead.postedBy && lead.company && (
              <span className="text-slate-300 select-none">·</span>
            )}
            {lead.company && (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                {lead.company}
              </span>
            )}
          </p>
        )}
      </div>

      {/* 3. Insight / Scraped Trigger Hook */}
      {triggerHook && (
        <div className="bg-slate-50/80 border-l-[3px] border-[#0a66c2] px-3.5 py-2.5 rounded-r-xl">
          <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 font-normal leading-relaxed italic">
            "{triggerHook}"
          </p>
        </div>
      )}

      {/* 4. Single-Line Contact Availability */}
      <div onClick={(e) => e.stopPropagation()}>
        <ContactLinks
          email={lead.primaryContactEmail}
          phone={lead.phone}
          linkedInUrl={lead.primaryContactLinkedIn}
        />
      </div>

      {/* 5. Card Action CTA */}
      <div
        className="pt-2.5 border-t border-slate-100 flex w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <LinkedInAction
          message={lead.linkedInDm}
          linkedInUrl={lead.primaryContactLinkedIn}
        />
      </div>
    </article>
  );
}
