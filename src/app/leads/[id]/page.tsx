'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Lead, LeadDetailApiResponse } from '@/types/lead';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreBadge } from '@/components/ScoreBadge';
import { LinkedInAction } from '@/components/LinkedInAction';
import {
  ArrowLeftIcon,
  MailIcon,
  PhoneIcon,
  LinkIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  FileTextIcon,
  ExternalLinkIcon,
  SyncIcon,
  CopyIcon,
  CheckIcon,
} from '@/components/icons';
import { ErrorState } from '@/components/States';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads/${id}`, { cache: 'no-store' });
        const data: LeadDetailApiResponse = await res.json();
        if (data.error) {
          setError(data.error.message);
        } else if (data.lead) {
          setLead(data.lead);
        } else {
          setError('Lead not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load lead details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleCopyEmailDraft = () => {
    if (!lead?.emailBody) return;
    const textToCopy = lead.emailSubject
      ? `Subject: ${lead.emailSubject}\n\n${lead.emailBody}`
      : lead.emailBody;
    navigator.clipboard.writeText(textToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest border-b border-outline-variant px-4 md:px-8 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Leads</span>
          </Link>
        </header>

        <main className="pt-24 pb-16 max-w-4xl mx-auto px-4 md:px-8 space-y-6 animate-pulse">
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="h-5 w-1/2 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </main>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest border-b border-outline-variant px-4 md:px-8 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Leads</span>
          </Link>
        </header>

        <main className="pt-24 pb-16 max-w-4xl mx-auto px-4 md:px-8">
          <ErrorState
            message="Unable to load lead details"
            details={error || 'Lead not found'}
            onRetry={() => window.location.reload()}
          />
        </main>
      </div>
    );
  }

  const hasSubtitle = lead.postedBy || lead.company;

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest border-b border-outline-variant px-4 md:px-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline p-1.5 -ml-1.5 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Leads</span>
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary bg-surface-container px-2.5 py-1 rounded">
          {lead.verticalLabel}
        </span>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        {/* 1. Header Overview Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-blue-100/70 px-2.5 py-1 rounded">
                {lead.verticalLabel}
              </span>
              <StatusBadge status={lead.linkedInStatus} />
              {lead.stage && (
                <span className="text-xs font-medium text-secondary bg-gray-100 px-2 py-0.5 rounded">
                  Stage: {lead.stage}
                </span>
              )}
            </div>
            <ScoreBadge score={lead.score} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight leading-snug">
              {lead.role}
            </h1>
            {hasSubtitle && (
              <p className="text-base text-secondary mt-1">
                {lead.postedBy && (
                  <span className="font-bold text-on-surface">{lead.postedBy}</span>
                )}
                {lead.postedBy && lead.company && (
                  <span className="mx-2 text-outline-variant">·</span>
                )}
                {lead.company && <span className="font-semibold text-on-surface">{lead.company}</span>}
              </p>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-outline-variant/50 text-sm">
            {lead.location && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <MapPinIcon className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="truncate">{lead.location}</span>
              </div>
            )}
            {lead.engagementType && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <BriefcaseIcon className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>{lead.engagementType}</span>
              </div>
            )}
            {(lead.signalDate || lead.sendDate) && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <CalendarIcon className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>Posted: {lead.signalDate || lead.sendDate}</span>
              </div>
            )}
            {lead.sourceType && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="text-xs font-bold uppercase text-secondary">Source:</span>
                <span>{lead.sourceType}</span>
              </div>
            )}
          </div>
        </section>

        {/* 2. Direct Contact & Links */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">Contact &amp; Profiles</h2>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {lead.primaryContactEmail && (
              <a
                href={`mailto:${lead.primaryContactEmail}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-outline-variant/60"
              >
                <MailIcon className="w-4 h-4 text-primary" />
                <span className="font-medium">{lead.primaryContactEmail}</span>
              </a>
            )}

            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-outline-variant/60"
              >
                <PhoneIcon className="w-4 h-4 text-primary" />
                <span className="font-medium">{lead.phone}</span>
              </a>
            )}

            {lead.primaryContactLinkedIn && (
              <a
                href={lead.primaryContactLinkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-outline-variant/60"
              >
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="font-medium">Primary Contact LinkedIn</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-secondary" />
              </a>
            )}

            {lead.linkedInPostUrl && (
              <a
                href={lead.linkedInPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-outline-variant/60"
              >
                <LinkIcon className="w-4 h-4 text-secondary" />
                <span className="font-medium">Original Post Link</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-secondary" />
              </a>
            )}

            {lead.sourceLink && (
              <a
                href={lead.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors border border-outline-variant/60"
              >
                <LinkIcon className="w-4 h-4 text-secondary" />
                <span className="font-medium">Source Listing</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-secondary" />
              </a>
            )}
          </div>
        </section>

        {/* 3. Post Summary (if present) */}
        {lead.postSummary && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <FileTextIcon className="w-4 h-4 text-primary" />
              Post Summary
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant leading-relaxed bg-surface-container-low/40 p-4 rounded-lg border border-outline-variant/40">
              {lead.postSummary}
            </p>
          </section>
        )}

        {/* 4. Requirements & Expectations (if present) */}
        {lead.requirement && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4 text-primary" />
              Role Requirements &amp; Scope
            </h2>
            <div className="text-sm md:text-base text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low/40 p-4 rounded-lg border border-outline-variant/40">
              {lead.requirement}
            </div>
          </section>
        )}

        {/* 5. LinkedIn Direct Message (Outreach Draft) */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">LinkedIn DM Draft</h2>
            <span className="text-xs font-semibold text-secondary">
              Status: {lead.linkedInStatus}
            </span>
          </div>

          <div className="border-l-4 border-primary pl-4 py-3 bg-surface-container-low/60 rounded-r-lg">
            <p className="text-sm md:text-base text-on-surface whitespace-pre-line italic leading-relaxed">
              {lead.linkedInDm || 'No LinkedIn message draft currently generated.'}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <LinkedInAction
              message={lead.linkedInDm}
              linkedInUrl={lead.primaryContactLinkedIn}
            />
          </div>
        </section>

        {/* 6. Email Outreach Draft (if present) */}
        {lead.emailBody && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">Email Outreach Draft</h2>
              {lead.emailStatus && (
                <span className="text-xs font-medium bg-blue-50 text-primary px-2 py-0.5 rounded">
                  {lead.emailStatus}
                </span>
              )}
            </div>

            {lead.emailSubject && (
              <div className="text-sm font-semibold text-on-surface bg-surface-container-low p-3 rounded-lg border border-outline-variant/50">
                <span className="text-secondary font-normal">Subject: </span>
                {lead.emailSubject}
              </div>
            )}

            <div className="p-4 bg-surface-container-low/40 rounded-lg border border-outline-variant/40 text-sm whitespace-pre-line leading-relaxed text-on-surface-variant">
              {lead.emailBody}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCopyEmailDraft}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold rounded-lg transition-colors border border-outline-variant"
              >
                {copiedEmail ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <span>Email Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    <span>Copy Email Draft</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* 7. Verification & Research Notes (if present) */}
        {lead.notes && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-on-surface">Verification &amp; Research Notes</h2>
            <p className="text-sm text-secondary bg-surface-container-low/30 p-4 rounded-lg border border-outline-variant/30 leading-relaxed whitespace-pre-line">
              {lead.notes}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
