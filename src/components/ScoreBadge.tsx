import React from 'react';
import { ScoreInfo } from '@/types/lead';
import { StarIcon } from './icons';

interface ScoreBadgeProps {
  score: ScoreInfo | null;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (!score) {
    return null;
  }

  if (score.isHold) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 font-semibold text-xs font-sans tracking-tight">
        <span>Hold</span>
      </div>
    );
  }

  if (!score.isNumeric) {
    return (
      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold text-xs font-sans tracking-tight">
        <span>{score.formatted}</span>
      </div>
    );
  }

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  if (score.tier === 'green') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (score.tier === 'amber') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
  } else if (score.tier === 'red') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-xs border font-sans tracking-tight shadow-2xs ${colorClasses}`}
      title={`Signal Match Score: ${score.formatted}`}
    >
      <StarIcon className="w-3 h-3 fill-current opacity-90" />
      <span className="tabular-nums">{score.formatted}</span>
    </div>
  );
}
