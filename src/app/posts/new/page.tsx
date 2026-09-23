'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/icons';
import { QuickCreatePostModal } from '@/components/QuickCreatePostModal';
import { Toast } from '@/components/Toast';

export default function NewPostPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/posts"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Content Hub</span>
          </Link>
          <h1 className="text-sm font-bold text-slate-800 font-display">New LinkedIn Post</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Embedded Create Modal opened by default */}
      <QuickCreatePostModal
        isOpen={true}
        onClose={() => router.push('/posts')}
        onPostCreated={(post) => {
          setNotice('Post created successfully!');
          setTimeout(() => {
            router.push(`/posts/${post.id}`);
          }, 800);
        }}
        onShowNotice={setNotice}
      />

      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
