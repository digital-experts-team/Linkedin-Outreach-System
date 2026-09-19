import React from 'react';
import { AlertCircleIcon, SyncIcon } from './icons';

export function LeadCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card animate-pulse flex flex-col gap-3.5">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-slate-200 rounded-lg" />
          <div className="h-5 w-20 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-5 w-12 bg-slate-200 rounded-full" />
      </div>

      {/* Role and Subtitle */}
      <div className="space-y-2 mt-1">
        <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
        <div className="h-4 w-1/2 bg-slate-100 rounded" />
      </div>

      {/* Inset message preview */}
      <div className="border-l-3 border-slate-300 pl-3.5 py-2.5 bg-slate-50/80 rounded-r-xl space-y-2">
        <div className="h-3.5 w-full bg-slate-200/80 rounded" />
        <div className="h-3.5 w-4/5 bg-slate-200/70 rounded" />
      </div>

      {/* Contact row */}
      <div className="flex items-center gap-2.5 pt-1">
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
        <div className="h-7 w-24 bg-slate-100 rounded-lg" />
      </div>

      {/* CTA row */}
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <div className="h-10 w-48 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading leads">
      <LeadCardSkeleton />
      <LeadCardSkeleton />
      <LeadCardSkeleton />
    </div>
  );
}

interface EmptyStateProps {
  onRetry?: () => void;
}

export function EmptyState({ onRetry }: EmptyStateProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-4 shadow-card">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
        <AlertCircleIcon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold font-display text-slate-900">No leads found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          There are currently no leads in the connected Notion view for this filter.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold font-display rounded-xl transition-colors tap-bounce cursor-pointer shadow-2xs"
        >
          <SyncIcon className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      )}
    </div>
  );
}

interface ConfigRequiredStateProps {
  onRetry?: () => void;
}

export function ConfigRequiredState({ onRetry }: ConfigRequiredStateProps) {
  return (
    <div className="bg-white border border-blue-200/80 rounded-2xl p-6 md:p-8 space-y-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0a66c2] shrink-0 border border-blue-100">
          <AlertCircleIcon className="w-6 h-6 text-[#0a66c2]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-display text-slate-900">Notion Configuration Required</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            The app is connected to the <strong>GTM Automation - CRM</strong> database, but requires a Notion Integration Token at runtime to fetch live leads.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-sm space-y-3">
        <p className="font-semibold font-display text-slate-900">Quick Setup Steps:</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-700">
          <li>
            Create a Notion internal integration at{' '}
            <a
              href="https://www.notion.so/profile/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0a66c2] hover:underline font-medium"
            >
              notion.so/profile/integrations
            </a>
          </li>
          <li>
            In Notion, open the <strong>GTM Automation - CRM</strong> database, click <strong>••• &gt; Connections &gt; Add connections</strong>, and select your integration.
          </li>
          <li>
            Add your token to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-xs text-slate-800">.env.local</code>:
            <pre className="bg-white p-2.5 mt-1 rounded-lg border border-slate-200 font-mono text-xs overflow-x-auto text-slate-800">
              NOTION_TOKEN=ntn_your_integration_token_here
            </pre>
          </li>
        </ol>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">
          Target Database: <code className="font-mono text-xs text-slate-500">3d67f6ba-af95-80a3-8e5d-d540076d4370</code>
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a66c2] text-white font-semibold font-display text-xs sm:text-sm rounded-xl hover:bg-[#004182] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <SyncIcon className="w-4 h-4" />
            <span>Check Connection</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, details, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-white border border-rose-200/80 rounded-2xl p-6 md:p-8 space-y-4 shadow-card text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center text-rose-600">
        <AlertCircleIcon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold font-display text-slate-900">{message}</h3>
        {details && (
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {details}
          </p>
        )}
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a66c2] text-white font-semibold font-display text-xs sm:text-sm rounded-xl hover:bg-[#004182] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <SyncIcon className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
}
