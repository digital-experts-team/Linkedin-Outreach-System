import React from 'react';
import { MailIcon, PhoneIcon, LinkIcon } from './icons';

interface ContactLinksProps {
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
}

export function ContactLinks({ email, phone, linkedInUrl }: ContactLinksProps) {
  const items: React.ReactNode[] = [];

  if (email) {
    items.push(
      <a
        key="email"
        href={`mailto:${email}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-primary border border-slate-200/70 transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary tap-bounce"
        title={`Send email to ${email}`}
      >
        <MailIcon className="w-3.5 h-3.5 opacity-80" />
        <span>Email</span>
      </a>
    );
  }

  if (phone) {
    items.push(
      <a
        key="phone"
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-primary border border-slate-200/70 transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary tap-bounce"
        title={`Call ${phone}`}
      >
        <PhoneIcon className="w-3.5 h-3.5 opacity-80" />
        <span>Phone</span>
      </a>
    );
  }

  if (linkedInUrl) {
    items.push(
      <a
        key="linkedin"
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-primary border border-slate-200/70 transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary tap-bounce"
        title="Open LinkedIn profile"
      >
        <LinkIcon className="w-3.5 h-3.5 opacity-80" />
        <span>LinkedIn</span>
      </a>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 whitespace-nowrap">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}
