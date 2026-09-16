import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').trim();

  let colorClasses = 'bg-gray-100 text-gray-700';

  switch (normalized.toLowerCase()) {
    case 'not started':
      colorClasses = 'bg-secondary-fixed text-on-secondary-fixed';
      break;
    case 'draft':
      colorClasses = 'bg-orange-100 text-orange-700';
      break;
    case 'draft ready':
      colorClasses = 'bg-blue-100 text-primary';
      break;
    case 'done':
      colorClasses = 'bg-green-100 text-[#16A34A]';
      break;
    case 'linkedin send':
      colorClasses = 'bg-green-100 text-[#16A34A]';
      break;
    case 'follow up':
      colorClasses = 'bg-purple-100 text-purple-700';
      break;
    case 'no status':
      colorClasses = 'bg-gray-100 text-gray-500';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700';
      break;
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${colorClasses}`}
    >
      {normalized || 'No status'}
    </span>
  );
}
