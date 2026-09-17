'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types/lead';
import { StatusBadge } from './StatusBadge';
import { ScoreBadge } from './ScoreBadge';
import { ContactLinks } from './ContactLinks';
import { LinkedInAction } from './LinkedInAction';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter();
  const hasSubtitle = lead.postedBy || lead.company;

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

  const isAiVideo = lead.verticalId === 'ai_video';

  return (
    <article
      onClick={handleCardClick}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/leads/${lead.id}`);
        }
      }}
      aria-label={`View details for ${lead.role}`}
    >
      {/* 1. Top Tag Row: Category Pill, Status Badge & Score Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded ${
              isAiVideo
                ? 'text-indigo-700 bg-indigo-100/80'
                : 'text-primary bg-blue-100/70'
            }`}
          >
            {lead.verticalLabel}
          </span>
          <StatusBadge status={lead.linkedInStatus} />
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      {/* 2. Role-First Visual Anchor & Candidate/Company Metadata */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-on-surface leading-snug tracking-tight group-hover:text-primary transition-colors">
          {lead.role}
        </h3>
        {hasSubtitle && (
          <p className="text-sm text-secondary mt-1 font-normal">
            {lead.postedBy && (
              <span className="font-semibold text-on-surface">{lead.postedBy}</span>
            )}
            {lead.postedBy && lead.company && (
              <span className="mx-1.5 select-none text-outline-variant">·</span>
            )}
            {lead.company && <span>{lead.company}</span>}
          </p>
        )}
      </div>

      {/* 3. Insight / Scraped Trigger Hook */}
      {triggerHook && (
        <div className="border-l-2 border-primary/50 pl-3.5 py-2 my-0.5 bg-surface-container-low/70 rounded-r-lg">
          <p className="text-[15px] md:text-base text-on-surface line-clamp-2 font-medium leading-relaxed">
            "{triggerHook}"
          </p>
        </div>
      )}

      {/* 4. Single-Line Contact Availability (Icons & Labels Only) */}
      <div onClick={(e) => e.stopPropagation()}>
        <ContactLinks
          email={lead.primaryContactEmail}
          phone={lead.phone}
          linkedInUrl={lead.primaryContactLinkedIn}
        />
      </div>

      {/* 5. Card Action CTA (Outlined 2px Primary Blue Button) */}
      <div
        className="pt-2 border-t border-outline-variant/50 flex w-full"
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
