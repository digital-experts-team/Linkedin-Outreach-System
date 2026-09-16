import React from 'react';
import { AlertCircleIcon, SyncIcon } from './icons';

export function LeadCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm animate-pulse flex flex-col gap-3">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
      </div>

      {/* Role and Subtitle */}
      <div className="space-y-2 mt-1">
        <div className="h-6 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>

      {/* Inset message preview */}
      <div className="border-l-2 border-gray-300 pl-3 py-2 bg-gray-50 rounded-r-lg space-y-1.5">
        <div className="h-3.5 w-full bg-gray-200 rounded" />
        <div className="h-3.5 w-4/5 bg-gray-200 rounded" />
      </div>

      {/* Contact row */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-3.5 w-16 bg-gray-200 rounded" />
        <div className="h-3.5 w-16 bg-gray-200 rounded" />
        <div className="h-3.5 w-20 bg-gray-200 rounded" />
      </div>

      {/* CTA row */}
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <div className="h-10 w-48 bg-gray-200 rounded-lg" />
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
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-secondary">
        <AlertCircleIcon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">No leads found</h3>
        <p className="text-sm text-secondary mt-1 max-w-md mx-auto">
          There are currently no leads in the connected Notion view.
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold rounded-lg transition-colors"
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
    <div className="bg-surface-container-lowest border border-primary/30 rounded-xl p-6 md:p-8 space-y-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-full bg-blue-50 text-primary flex-shrink-0">
          <AlertCircleIcon className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-on-surface">Notion Configuration Required</h3>
          <p className="text-sm text-secondary leading-relaxed">
            The app is connected to the <strong>GTM Automation - CRM</strong> database, but requires a Notion Integration Token at runtime to fetch live leads.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant text-sm space-y-3">
        <p className="font-semibold text-on-surface">Quick Setup Steps:</p>
        <ol className="list-decimal list-inside space-y-2 text-on-surface-variant">
          <li>
            Create a Notion internal integration at{' '}
            <a
              href="https://www.notion.so/profile/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline font-medium"
            >
              notion.so/profile/integrations
            </a>
          </li>
          <li>
            In Notion, open the <strong>GTM Automation - CRM</strong> database, click <strong>••• &gt; Connections &gt; Add connections</strong>, and select your integration.
          </li>
          <li>
            Add your token to <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-xs">.env.local</code>:
            <pre className="bg-white p-2.5 mt-1 rounded border border-gray-300 font-mono text-xs overflow-x-auto">
              NOTION_TOKEN=ntn_your_integration_token_here
            </pre>
          </li>
        </ol>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-secondary">
          Target Database: <code className="font-mono text-xs">3d67f6ba-af95-80a3-8e5d-d540076d4370</code>
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
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
    <div className="bg-surface-container-lowest border border-error/30 rounded-xl p-6 md:p-8 space-y-4 shadow-sm text-center">
      <div className="w-12 h-12 rounded-full bg-error-container mx-auto flex items-center justify-center text-error">
        <AlertCircleIcon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface">{message}</h3>
        {details && (
          <p className="text-sm text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
            {details}
          </p>
        )}
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <SyncIcon className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}
    </div>
  );
}
