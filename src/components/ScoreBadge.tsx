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
      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
        <span>Hold</span>
      </div>
    );
  }

  if (!score.isNumeric) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
        <span>{score.formatted}</span>
      </div>
    );
  }

  let colorClasses = 'bg-gray-100 text-gray-700';
  if (score.tier === 'green') {
    colorClasses = 'bg-green-100 text-[#16A34A]';
  } else if (score.tier === 'amber') {
    colorClasses = 'bg-yellow-100 text-[#CA8A04]';
  } else if (score.tier === 'red') {
    colorClasses = 'bg-red-100 text-[#DC2626]';
  }

  return (
    <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${colorClasses}`}>
      <StarIcon className="w-3.5 h-3.5 fill-current" />
      <span>{score.formatted}</span>
    </div>
  );
}
