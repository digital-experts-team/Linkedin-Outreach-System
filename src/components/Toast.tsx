'use client';

import React, { useEffect } from 'react';
import { CloseIcon, AlertCircleIcon } from './icons';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/95 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xl border border-slate-800 backdrop-blur-md max-w-sm w-auto animate-fade-in font-sans"
    >
      <AlertCircleIcon className="w-4 h-4 text-blue-400 shrink-0" />
      <span className="truncate">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
        aria-label="Dismiss notice"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
