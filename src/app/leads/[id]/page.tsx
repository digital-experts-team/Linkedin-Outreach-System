'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Lead, LeadDetailApiResponse } from '@/types/lead';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreBadge } from '@/components/ScoreBadge';
import { LinkedInAction } from '@/components/LinkedInAction';
import { Toast } from '@/components/Toast';
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
  CopyIcon,
  CheckIcon,
  TagIcon,
  StarIcon,
} from '@/components/icons';
import { ErrorState } from '@/components/States';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedComment, setCopiedComment] = useState(false);

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

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    const oldStatus = lead.linkedInStatus;

    // Optimistic UI Update
    setLead((prev) => (prev ? { ...prev, linkedInStatus: newStatus } : prev));
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data: LeadDetailApiResponse = await res.json();
      if (data.error) {
        // Revert on error
        setLead((prev) => (prev ? { ...prev, linkedInStatus: oldStatus } : prev));
        setNotice(`Failed to update status: ${data.error.message}`);
      } else if (data.lead) {
        setLead(data.lead);
        setNotice(`Status updated to "${newStatus}" in Notion CRM`);
      }
    } catch (err: any) {
      // Revert on network error
      setLead((prev) => (prev ? { ...prev, linkedInStatus: oldStatus } : prev));
      setNotice('Network error: status could not be saved to Notion');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyEmailDraft = () => {
    if (!lead?.emailBody) return;
    const textToCopy = lead.emailSubject
      ? `Subject: ${lead.emailSubject}\n\n${lead.emailBody}`
      : lead.emailBody;
    navigator.clipboard.writeText(textToCopy);
    setCopiedEmail(true);
    setNotice('Email outreach draft copied to clipboard');
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const handleCopyCommentDraft = () => {
    if (!lead?.commentDraft) return;
    navigator.clipboard.writeText(lead.commentDraft);
    setCopiedComment(true);
    setNotice('Comment draft copied to clipboard');
    setTimeout(() => setCopiedComment(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-outline-variant/70 px-4 md:px-8 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Leads</span>
          </Link>
        </header>

        <main className="pt-20 pb-16 max-w-4xl mx-auto px-4 md:px-8 space-y-6 animate-pulse">
          <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
          <div className="h-5 w-1/2 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </main>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-outline-variant/70 px-4 md:px-8 flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Leads</span>
          </Link>
        </header>

        <main className="pt-20 pb-16 max-w-4xl mx-auto px-4 md:px-8">
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
  const isAiVideo = lead.verticalId === 'ai_video';

  // Strategic highlight: AI Video uses whySignalApt; GTM uses postSummary as the hero signal box
  const heroHighlight = lead.whySignalApt || lead.postSummary;
  const heroHighlightTitle = lead.whySignalApt ? 'Why Signal Apt' : 'Lead Summary & Strategic Signal';

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-md border-b border-outline-variant/70 px-4 md:px-8 flex items-center justify-between shadow-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline p-1.5 -ml-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tap-bounce"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Leads</span>
        </Link>
        <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
          isAiVideo ? 'text-indigo-700 bg-indigo-100' : 'text-primary bg-blue-100/80'
        }`}>
          {lead.verticalLabel}
        </span>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 max-w-4xl mx-auto px-3.5 sm:px-6 md:px-8 space-y-4 sm:space-y-6">
        {/* 1. Header Overview Card with Interactive Status Picker */}
        <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                isAiVideo ? 'text-indigo-700 bg-indigo-100/80' : 'text-primary bg-blue-100/70'
              }`}>
                {lead.verticalLabel}
              </span>

              {/* Interactive Status Changer Dropdown */}
              <StatusBadge
                status={lead.linkedInStatus}
                onChangeStatus={handleStatusChange}
                updating={updatingStatus}
              />

              {lead.stage && (
                <span className="text-xs font-medium text-secondary bg-gray-100 px-2 py-0.5 rounded">
                  Stage: {lead.stage}
                </span>
              )}
              {lead.signalType && (
                <span className="text-xs font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {lead.signalType}
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
            {(lead.posted || lead.signalDate || lead.sendDate) && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <CalendarIcon className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>Posted: {lead.posted || lead.signalDate || lead.sendDate}</span>
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

        {/* 2. Hero Signal / Summary Highlight Box (Uniform for AI Video & GTM) */}
        {heroHighlight && (
          <section className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2.5">
            <h2 className="text-base font-bold text-blue-950 flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-primary fill-current" />
              {heroHighlightTitle}
            </h2>
            <p className="text-sm md:text-base text-blue-950 leading-relaxed font-medium">
              {heroHighlight}
            </p>
          </section>
        )}

        {/* 3. Signal Snippet (if present and distinct from hero) */}
        {lead.signalSnippet && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <FileTextIcon className="w-3.5 h-3.5" />
              Signal Snippet
            </h2>
            <blockquote className="text-sm md:text-[15px] font-medium text-on-surface border-l-2 border-primary/50 pl-3.5 py-1.5 bg-surface-container-low/60 rounded-r-lg">
              "{lead.signalSnippet}"
            </blockquote>
          </section>
        )}

        {/* 4. Role Requirements & Scope (if present) */}
        {lead.requirement && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4 text-primary" />
              Role Requirements &amp; Scope
            </h2>
            <div className="text-sm md:text-base text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/40 font-normal">
              {lead.requirement}
            </div>
          </section>
        )}

        {/* 5. Identified Skills / Capabilities (GTM specific) */}
        {lead.skills && lead.skills.length > 0 && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-primary" />
              Target Capabilities &amp; Skills
            </h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {lead.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50/80 text-primary border border-blue-200/70 rounded-lg text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 6. Identified Pain Points (AI Video specific) */}
        {lead.painPoints && lead.painPoints.length > 0 && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-primary" />
              Identified Pain Points
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-on-surface-variant">
              {lead.painPoints.map((point, index) => (
                <li key={index} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 7. Direct Contact & Profile Links */}
        <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-on-surface">Contact &amp; Profiles</h2>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-sm">
            {lead.primaryContactEmail && (
              <a
                href={`mailto:${lead.primaryContactEmail}`}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl transition-colors border border-outline-variant/60 tap-bounce"
              >
                <MailIcon className="w-4 h-4 text-primary" />
                <span className="font-medium">{lead.primaryContactEmail}</span>
              </a>
            )}

            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl transition-colors border border-outline-variant/60 tap-bounce"
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
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl transition-colors border border-outline-variant/60 tap-bounce"
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
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl transition-colors border border-outline-variant/60 tap-bounce"
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
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl transition-colors border border-outline-variant/60 tap-bounce"
              >
                <LinkIcon className="w-4 h-4 text-secondary" />
                <span className="font-medium">Source Listing</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 text-secondary" />
              </a>
            )}
          </div>
        </section>

        {/* 8. LinkedIn Direct Message (Outreach Draft) */}
        <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface">LinkedIn DM Draft</h2>
            <StatusBadge
              status={lead.linkedInStatus}
              onChangeStatus={handleStatusChange}
              updating={updatingStatus}
            />
          </div>

          <div className="border-l-4 border-primary pl-4 py-3 bg-surface-container-low/70 rounded-r-xl">
            <p className="text-sm md:text-base text-on-surface whitespace-pre-line font-medium leading-relaxed">
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

        {/* 9. Email Outreach Draft (if present) */}
        {lead.emailBody && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">Email Outreach Draft</h2>
              {lead.emailStatus && (
                <span className="text-xs font-medium bg-blue-50 text-primary px-2 py-0.5 rounded">
                  {lead.emailStatus}
                </span>
              )}
            </div>

            {lead.emailSubject && (
              <div className="text-sm font-semibold text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/50">
                <span className="text-secondary font-normal">Subject: </span>
                {lead.emailSubject}
              </div>
            )}

            <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/40 text-sm whitespace-pre-line leading-relaxed text-on-surface">
              {lead.emailBody}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCopyEmailDraft}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl transition-all border border-outline-variant tap-bounce shadow-xs"
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

        {/* 10. Comment Draft (GTM specific) */}
        {lead.commentDraft && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-on-surface">Post Comment Draft</h2>
              {lead.commentStatus && (
                <span className="text-xs font-medium bg-gray-100 text-secondary px-2 py-0.5 rounded">
                  Status: {lead.commentStatus}
                </span>
              )}
            </div>

            <div className="p-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/40 text-sm whitespace-pre-line leading-relaxed text-on-surface">
              {lead.commentDraft}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCopyCommentDraft}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl transition-all border border-outline-variant tap-bounce shadow-xs"
              >
                {copiedComment ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <span>Comment Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    <span>Copy Comment Draft</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* 11. Enrichment & Research Notes */}
        {(lead.notes || lead.enrichmentNotes) && (
          <section className="bg-white border border-outline-variant/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-on-surface">Verification &amp; Research Notes</h2>
            {lead.enrichmentNotes && (
              <p className="text-sm text-on-surface bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/40 leading-relaxed whitespace-pre-line">
                {lead.enrichmentNotes}
              </p>
            )}
            {lead.notes && (
              <p className="text-sm text-secondary bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/30 leading-relaxed whitespace-pre-line">
                {lead.notes}
              </p>
            )}
          </section>
        )}
      </main>

      {/* Accessible Toast Announcements */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

