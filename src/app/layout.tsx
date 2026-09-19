import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkedIn Outreach System',
  description: 'Responsive Notion-backed CRM & LinkedIn Outreach Lead Management application with Content Hub studio.',
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
