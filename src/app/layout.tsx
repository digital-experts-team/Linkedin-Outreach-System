import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Outreach Pilot - Leads',
  description: 'Responsive Notion-backed lead management application for outreach.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-surface min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
