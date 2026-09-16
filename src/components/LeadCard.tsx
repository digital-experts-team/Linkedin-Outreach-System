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

  return (
    <article
      onClick={handleCardClick}
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          router.push(`/leads/${lead.id}`);
        }
      }}
      aria-label={`View details for ${lead.role}`}
    >
      {/* Top Header Row: Category Badge, Status Badge & Score Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-blue-100/70 px-2 py-0.5 rounded">
            {lead.verticalLabel}
          </span>
          <StatusBadge status={lead.linkedInStatus} />
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      {/* Role Heading and Subtitle */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
          {lead.role}
        </h3>
        {hasSubtitle && (
          <p className="text-sm text-secondary mt-0.5">
            {lead.postedBy && (
              <span className="font-bold text-on-surface">{lead.postedBy}</span>
            )}
            {lead.postedBy && lead.company && (
              <span className="mx-1 select-none text-outline-variant">·</span>
            )}
            {lead.company && <span>{lead.company}</span>}
          </p>
        )}
      </div>

      {/* Inset Message Quote Preview */}
      <div className="border-l-2 border-primary/30 pl-3 py-1.5 my-0.5 bg-surface-container-low/50 rounded-r-lg">
        <p className="text-sm text-on-surface-variant line-clamp-2 italic leading-relaxed">
          {lead.linkedInDm ? `"${lead.linkedInDm}"` : 'No LinkedIn message available.'}
        </p>
      </div>

      {/* Contact Links Row */}
      <div onClick={(e) => e.stopPropagation()}>
        <ContactLinks
          email={lead.primaryContactEmail}
          phone={lead.phone}
          linkedInUrl={lead.primaryContactLinkedIn}
        />
      </div>

      {/* Divider and Primary CTA */}
      <div
        className="pt-2 border-t border-outline-variant/60 flex justify-end"
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
