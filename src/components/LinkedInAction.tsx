'use client';

import React, { useState } from 'react';
import { SendIcon, CheckIcon, CopyIcon, ExternalLinkIcon, CloseIcon, AlertCircleIcon } from './icons';

interface LinkedInActionProps {
  message: string;
  linkedInUrl: string | null;
}

export function LinkedInAction({ message, linkedInUrl }: LinkedInActionProps) {
  const [copied, setCopied] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [feedbackText, setFeedbackText] = useState('Message copied');

  const hasMessage = Boolean(message && message.trim());
  const hasValidUrl = Boolean(linkedInUrl);

  const handleCombinedAction = async () => {
    if (!hasMessage && !hasValidUrl) return;

    let copySuccessful = false;

    // 1. Copy the message to clipboard first
    if (hasMessage) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(message);
          copySuccessful = true;
        } else {
          // Fallback if clipboard API not available in current context
          const textArea = document.createElement('textarea');
          textArea.value = message;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          copySuccessful = document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } catch {
        copySuccessful = false;
      }
    } else {
      copySuccessful = true;
    }

    if (copySuccessful) {
      setCopied(true);
      setFeedbackText('Message copied');
      setTimeout(() => setCopied(false), 3000);

      // 2. Redirect/Open LinkedIn only after successful copy
      if (hasValidUrl && linkedInUrl) {
        try {
          const openedWindow = window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
          if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === 'undefined') {
            setPopupBlocked(true);
          } else {
            setPopupBlocked(false);
          }
        } catch {
          setPopupBlocked(true);
        }
      }
    } else {
      // If automatic copy fails, show fallback modal for manual copy before opening
      setShowFallbackModal(true);
    }
  };

  const handleOnlyCopy = async () => {
    if (!hasMessage) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setFeedbackText('Message copied');
        setTimeout(() => setCopied(false), 3000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          setCopied(true);
          setFeedbackText('Message copied');
          setTimeout(() => setCopied(false), 3000);
        } else {
          setShowFallbackModal(true);
        }
      }
    } catch {
      setShowFallbackModal(true);
    }
  };

  // If both missing
  if (!hasMessage && !hasValidUrl) {
    return (
      <button
        disabled
        aria-disabled="true"
        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-400 font-semibold text-sm rounded-lg cursor-not-allowed"
      >
        <SendIcon className="w-4 h-4" />
        <span>No DM or LinkedIn Profile</span>
      </button>
    );
  }

  // If URL missing but message exists: provide Copy message action
  if (!hasValidUrl && hasMessage) {
    return (
      <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
        <button
          onClick={handleOnlyCopy}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
          }`}
          title="Profile URL missing. Click to copy message."
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>{feedbackText}</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
              <span>Copy Message (No Profile URL)</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // If message missing but valid URL exists
  if (!hasMessage && hasValidUrl) {
    return (
      <a
        href={linkedInUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
      >
        <ExternalLinkIcon className="w-4 h-4" />
        <span>Open LinkedIn Profile</span>
      </a>
    );
  }

  return (
    <>
      <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
        <button
          onClick={handleCombinedAction}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
          }`}
          aria-label="Copy message and open LinkedIn profile in a new tab"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>{feedbackText}</span>
            </>
          ) : (
            <>
              <SendIcon className="w-4 h-4" />
              <span>Copy &amp; Message on LinkedIn</span>
            </>
          )}
        </button>

        {popupBlocked && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Popup blocked.</span>
            <a
              href={linkedInUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-900"
            >
              Click here to open profile
            </a>
          </div>
        )}
      </div>

      {/* Manual copy fallback modal if browser clipboard is blocked */}
      {showFallbackModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="copy-fallback-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-outline-variant space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="copy-fallback-title" className="text-lg font-bold text-on-surface flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-primary" />
                Message Text
              </h3>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="p-1 rounded-full text-secondary hover:bg-gray-100 transition-colors"
                aria-label="Close dialog"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-secondary">
              Automatic clipboard copy was restricted by your browser. You can select and copy the text below:
            </p>

            <textarea
              readOnly
              rows={5}
              value={message}
              className="w-full p-3 text-sm bg-surface-container-low border border-outline-variant rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary select-all"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(message);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  } catch {}
                  setShowFallbackModal(false);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-on-surface font-semibold text-sm rounded-lg transition-colors"
              >
                Copy to Clipboard
              </button>
              {hasValidUrl && (
                <a
                  href={linkedInUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowFallbackModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity text-center"
                >
                  Open LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
