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
        className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded py-0.5"
        title="Email available"
      >
        <MailIcon className="w-3.5 h-3.5" />
        <span>Email</span>
      </a>
    );
  }

  if (phone) {
    items.push(
      <a
        key="phone"
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded py-0.5"
        title="Phone available"
      >
        <PhoneIcon className="w-3.5 h-3.5" />
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
        className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded py-0.5"
        title="LinkedIn profile available"
      >
        <LinkIcon className="w-3.5 h-3.5" />
        <span>LinkedIn</span>
      </a>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-0.5 text-secondary text-xs whitespace-nowrap">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-outline-variant select-none" aria-hidden="true">•</span>}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}
