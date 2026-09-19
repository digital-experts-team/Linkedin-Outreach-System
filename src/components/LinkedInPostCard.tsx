'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LinkedInPost } from '@/types/post';
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  EditIcon,
  SyncIcon,
  TrashIcon,
  ImageIcon,
  UploadIcon,
  PlusIcon,
  XIcon,
  GlobeIcon,
} from './icons';

interface LinkedInPostCardProps {
  post: LinkedInPost;
  onShowNotice?: (msg: string) => void;
  onPostUpdated?: (updatedPost: LinkedInPost) => void;
  onPostDeleted?: (deletedPostId: string) => void;
}

function formatPostDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Unscheduled';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  if (match) {
    const [, , mm, dd] = match;
    const monthIndex = parseInt(mm, 10) - 1;
    const monthName = MONTH_ABBR[monthIndex] || mm;
    return `${parseInt(dd, 10)} ${monthName}`;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
  }
  return dateStr;
}

/**
 * Truncates text based on LinkedIn feed parameters (max 3 lines or ~180-210 characters).
 */
function getLinkedInSnippet(text: string, maxLines = 3, maxChars = 200): { isTruncated: boolean; snippet: string } {
  if (!text) return { isTruncated: false, snippet: '' };

  const lines = text.split('\n');
  if (lines.length > maxLines) {
    const firstLines = lines.slice(0, maxLines).join('\n');
    return {
      isTruncated: true,
      snippet: firstLines,
    };
  }

  if (text.length > maxChars) {
    let sliceIdx = text.lastIndexOf(' ', maxChars);
    if (sliceIdx < maxChars - 40) sliceIdx = maxChars;
    return {
      isTruncated: true,
      snippet: text.slice(0, sliceIdx).trim(),
    };
  }

  return { isTruncated: false, snippet: text };
}

export function LinkedInPostCard({
  post,
  onShowNotice,
  onPostUpdated,
  onPostDeleted,
}: LinkedInPostCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(post.fullCopy || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick media shortcut state (attach/replace from outside card)
  const [showQuickMediaModal, setShowQuickMediaModal] = useState(false);
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [isUploadingQuickMedia, setIsUploadingQuickMedia] = useState(false);
  const [quickMediaMode, setQuickMediaMode] = useState<'upload' | 'url'>('upload');
  const [isDragOverQuick, setIsDragOverQuick] = useState(false);
  const [showRemoveImageModal, setShowRemoveImageModal] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  const displayDate = formatPostDisplayDate(post.scheduledDate || post.postedDate || post.weekOf);
  const isScheduled = (post.status || '').toLowerCase().includes('scheduled');
  const isDraft = (post.status || '').toLowerCase().includes('draft') || (post.status || '').toLowerCase().includes('idea');
  const isPublished = (post.status || '').toLowerCase().includes('published') || (post.status || '').toLowerCase().includes('done');

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (onShowNotice) {
          onShowNotice(`Failed to delete post: ${data.error?.message || 'Server error'}`);
        }
      } else {
        setShowDeleteModal(false);
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }
        if (onShowNotice) {
          onShowNotice('Post successfully deleted from database and UI');
        }
      }
    } catch (err: any) {
      if (onShowNotice) {
        onShowNotice('Network error: failed to delete post from Notion');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickUploadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      if (onShowNotice) onShowNotice('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsUploadingQuickMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/posts/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        if (onShowNotice) onShowNotice(`Upload failed: ${uploadData.error?.message || 'Server error'}`);
        return;
      }

      const newMediaItem = {
        url: uploadData.url,
        name: uploadData.name || file.name,
        type: 'image' as const,
      };

      const patchRes = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [newMediaItem],
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok || patchData.error) {
        if (onShowNotice) onShowNotice(`Failed to update Notion: ${patchData.error?.message || 'Server error'}`);
      } else {
        const updatedPost = patchData.post || { ...post, images: [newMediaItem] };
        if (onPostUpdated) onPostUpdated(updatedPost);
        setShowQuickMediaModal(false);
        if (onShowNotice) onShowNotice('Image attached & synced with Notion!');
      }
    } catch (err: any) {
      if (onShowNotice) onShowNotice('Network error while attaching image');
    } finally {
      setIsUploadingQuickMedia(false);
    }
  };

  const handleQuickAddUrl = async () => {
    const trimmed = quickImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      if (onShowNotice) onShowNotice('Please enter a valid image URL starting with https://');
      return;
    }

    setIsUploadingQuickMedia(true);
    try {
      const cleanName = trimmed.split('/').pop()?.split('?')[0] || 'attached_image.png';
      const newMediaItem = {
        url: trimmed,
        name: cleanName.length > 30 ? cleanName.slice(0, 30) + '...' : cleanName,
        type: 'image' as const,
      };

      const patchRes = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [newMediaItem],
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok || patchData.error) {
        if (onShowNotice) onShowNotice(`Failed to update Notion: ${patchData.error?.message || 'Server error'}`);
      } else {
        const updatedPost = patchData.post || { ...post, images: [newMediaItem] };
        if (onPostUpdated) onPostUpdated(updatedPost);
        setShowQuickMediaModal(false);
        setQuickImageUrl('');
        if (onShowNotice) onShowNotice('Image attached & synced with Notion!');
      }
    } catch (err: any) {
      if (onShowNotice) onShowNotice('Network error while attaching image');
    } finally {
      setIsUploadingQuickMedia(false);
    }
  };

  const handleQuickRemoveImage = async () => {
    setIsRemovingImage(true);
    try {
      const patchRes = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [],
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok || patchData.error) {
        if (onShowNotice) onShowNotice(`Failed to remove image in Notion: ${patchData.error?.message || 'Server error'}`);
      } else {
        const updatedPost = patchData.post || { ...post, images: [] };
        if (onPostUpdated) onPostUpdated(updatedPost);
        setShowRemoveImageModal(false);
        if (onShowNotice) onShowNotice('Image removed and updated in Notion!');
      }
    } catch (err: any) {
      if (onShowNotice) onShowNotice('Network error removing image');
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = isEditing ? currentText : post.fullCopy;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onShowNotice) {
      onShowNotice('Post text copied to clipboard');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotion = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullCopy: currentText,
        }),
      });

      const data = await res.json();
      if (data.error) {
        if (onShowNotice) {
          onShowNotice(`Failed to save to Notion: ${data.error.message}`);
        }
      } else if (data.post) {
        setIsEditing(false);
        if (onPostUpdated) {
          onPostUpdated(data.post);
        }
        if (onShowNotice) {
          onShowNotice('Post content updated and saved in Notion!');
        }
      }
    } catch (err: any) {
      if (onShowNotice) {
        onShowNotice('Network error: failed to update Notion');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentText(post.fullCopy || '');
    setIsEditing(false);
  };

  const hasImages = post.images && post.images.length > 0;

  return (
    <>
      <article className="bg-white rounded-none border-y border-slate-200/90 shadow-none transition-all flex flex-col w-full">
        {/* 1. LinkedIn Author Header */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {post.authorAvatarUrl ? (
              <img
                src={post.authorAvatarUrl}
                alt={post.authorName || 'Author avatar'}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0a66c2] font-bold text-sm shrink-0 flex items-center justify-center">
                {(post.authorName || 'AV').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[14.5px] font-semibold text-[#191919] leading-snug">
                  {post.authorName || 'Alex Vance'}
                </span>
                <span className="text-slate-500 text-xs shrink-0 font-normal">• 1st</span>
              </div>

              <p className="text-[12px] text-slate-500 truncate leading-snug font-normal mt-0.5">
                {post.authorHeadline || 'Founder & CEO at Outreach Pilot'}
              </p>

              {/* Date & Public Visibility Line (Authentic LinkedIn style) */}
              <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-normal mt-0.5">
                <span>{displayDate}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <GlobeIcon className="w-3 h-3 text-slate-500" />
                </span>
              </div>
            </div>
          </div>

          {/* Top Actions: Copy Icon + Open in Notion */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Top Copy Icon Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="p-2 rounded-xl text-slate-400 hover:text-[#0a66c2] hover:bg-blue-50 transition-all tap-bounce cursor-pointer border border-transparent hover:border-blue-100"
              title="Copy post text"
              aria-label="Copy post text"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>

            {/* Open in Notion Link */}
            <a
              href={post.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition tap-bounce cursor-pointer"
              title="Open in Notion"
              aria-label="Open in Notion"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2. Post Body Content (Directly selectable & editable) */}
        <div className="px-4 pt-1 pb-3 font-sans">
          {isEditing ? (
            <div className="space-y-2.5 animate-fade-in">
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                rows={Math.max(6, currentText.split('\n').length + 1)}
                className="w-full p-3 text-[14px] text-[#191919] bg-slate-50/80 border border-primary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white leading-[1.45] font-normal resize-y font-sans"
                placeholder="Write your LinkedIn post copy here..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition tap-bounce cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveToNotion}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-xs transition tap-bounce cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <SyncIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Notion...</span>
                    </>
                  ) : (
                    <span>Save to Notion</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            (() => {
              if (!post.fullCopy) {
                return <p className="text-secondary italic text-sm">No post copy written yet.</p>;
              }
              const { isTruncated, snippet } = getLinkedInSnippet(post.fullCopy, 3, 200);

              if (isTruncated && !isExpanded) {
                return (
                  <div className="space-y-1">
                    <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                      {snippet}
                      <span className="text-slate-500">... </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(true);
                        }}
                        className="text-slate-500 hover:text-[#0a66c2] font-semibold text-[13.5px] transition-colors cursor-pointer inline-flex items-center"
                      >
                        more
                      </button>
                    </div>
                  </div>
                );
              }

              if (isTruncated && isExpanded) {
                return (
                  <div className="space-y-1">
                    <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                      {post.fullCopy}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsExpanded(false);
                        }}
                        className="text-slate-500 hover:text-[#0a66c2] font-semibold text-xs py-0.5 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>less</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="text-[14px] sm:text-[14.5px] text-[#191919] leading-[1.45] font-normal whitespace-pre-wrap break-words select-text font-sans">
                  {post.fullCopy}
                </div>
              );
            })()
          )}
        </div>

        {/* 3. Media Image Attachment or Quick Attach Shortcut */}
        {hasImages ? (
          <div className="w-full relative group overflow-hidden bg-slate-100">
            <img
              src={post.images[0].url}
              alt={post.images[0].name || post.name}
              className="w-full h-auto max-h-[540px] object-cover block cursor-pointer rounded-none"
              onClick={() => setLightboxImage(post.images[0].url)}
              loading="lazy"
            />
            {/* Media Quick Actions Overlay */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setLightboxImage(post.images[0].url)}
                className="bg-black/75 hover:bg-black/90 text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="View full image"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Zoom</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQuickMediaModal(true)}
                className="bg-black/75 hover:bg-[#0a66c2] text-white px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Replace image directly"
              >
                <UploadIcon className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRemoveImageModal(true)}
                className="bg-black/75 hover:bg-rose-600 text-white px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Remove image"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-1 pb-3">
            <button
              type="button"
              onClick={() => setShowQuickMediaModal(true)}
              className="w-full py-2.5 px-3 rounded-none border border-dashed border-slate-300 hover:border-[#0a66c2]/60 hover:bg-blue-50/30 text-slate-500 hover:text-[#0a66c2] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer group"
              title="Quickly attach image without leaving the feed"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0a66c2] transition-colors" />
              <span>Attach Image</span>
            </button>
          </div>
        )}

        {/* 4. Action Footer: All Tags on the Left, Big Action Icons on the Right */}
        <div className="px-4 py-2.5 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-2">
          {/* Left: All Post Tags (Status, Vertical, Angle Type) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                isScheduled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isPublished
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isScheduled ? 'bg-emerald-500' : isPublished ? 'bg-blue-500' : 'bg-amber-500'
                }`}
              />
              <span>{post.status || 'Draft'}</span>
            </span>

            {/* Vertical Badge */}
            {post.vertical && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {post.vertical}
              </span>
            )}

            {/* Post Type / Angle Badge */}
            {post.angleType && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
                {post.angleType}
              </span>
            )}
          </div>

          {/* Right: Big Icon-only Buttons for Edit & Delete */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href={`/posts/${post.id}`}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-[#0a66c2] bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-200 shadow-2xs transition-all tap-bounce cursor-pointer flex items-center justify-center group"
              title="Edit post in Notion"
              aria-label="Edit post"
            >
              <EditIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600 group-hover:text-[#0a66c2] transition-colors" />
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 sm:p-2.5 rounded-xl text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-200 shadow-2xs transition-all tap-bounce cursor-pointer flex items-center justify-center group"
              title="Delete post"
              aria-label="Delete post"
            >
              <TrashIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-500 group-hover:text-rose-600 transition-colors" />
            </button>
          </div>
        </div>
      </article>

      {/* Delete Confirmation Popup Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-modal-title-${post.id}`}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 font-sans animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  id={`delete-modal-title-${post.id}`}
                  className="text-base font-bold font-display text-slate-900"
                >
                  Delete LinkedIn Post?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this post? This will remove it from the UI feed and archive it in your connected Notion database.
                </p>
              </div>
            </div>

            {post.fullCopy && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 line-clamp-3 italic leading-relaxed">
                "{post.fullCopy.slice(0, 160)}..."
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold font-display text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition tap-bounce cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePost}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-display text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition tap-bounce cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <SyncIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Media Shortcut Modal (Attach / Replace from Feed) */}
      {showQuickMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isUploadingQuickMedia && setShowQuickMediaModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 max-w-md w-full space-y-4 font-sans animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0a66c2] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-slate-900">
                    {hasImages ? 'Replace Image in Notion' : 'Attach Image to Notion'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Updates Notion's <code className="font-semibold text-slate-700">Image</code> files property instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUploadingQuickMedia}
                onClick={() => setShowQuickMediaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setQuickMediaMode('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  quickMediaMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadIcon className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickMediaMode('url')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  quickMediaMode === 'url'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {/* Upload File Panel */}
            {quickMediaMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverQuick(true);
                }}
                onDragLeave={() => setIsDragOverQuick(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverQuick(false);
                  handleQuickUploadFile(e.dataTransfer.files);
                }}
                className={`p-6 rounded-xl border-2 border-dashed transition text-center ${
                  isDragOverQuick
                    ? 'border-[#0a66c2] bg-blue-50/60'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  id={`quick-file-${post.id}`}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(e) => handleQuickUploadFile(e.target.files)}
                  className="hidden"
                  disabled={isUploadingQuickMedia}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {isUploadingQuickMedia ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0a66c2] py-4">
                      <SyncIcon className="w-4 h-4 animate-spin" />
                      <span>Syncing image with Notion...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0a66c2] flex items-center justify-center">
                        <UploadIcon className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-700">
                        <label
                          htmlFor={`quick-file-${post.id}`}
                          className="font-bold text-[#0a66c2] hover:underline cursor-pointer"
                        >
                          Click to browse
                        </label>{' '}
                        or drop image file here
                      </div>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, WEBP, GIF, SVG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Image URL Panel */
              <div className="space-y-3 py-2">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Paste Web Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={quickImageUrl}
                    onChange={(e) => setQuickImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddUrl();
                      }
                    }}
                    placeholder="https://images.unsplash.com/... or image link"
                    className="w-full px-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white"
                    disabled={isUploadingQuickMedia}
                    autoFocus
                  />
                  {quickImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQuickImageUrl('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isUploadingQuickMedia}
                    onClick={() => setShowQuickMediaModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition tap-bounce cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUploadingQuickMedia || !quickImageUrl.trim()}
                    onClick={handleQuickAddUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0a66c2] hover:bg-[#004182] rounded-lg shadow-xs transition tap-bounce cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingQuickMedia ? (
                      <>
                        <SyncIcon className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Attach & Sync</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Remove Image Confirmation Modal */}
      {showRemoveImageModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isRemovingImage && setShowRemoveImageModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 font-sans animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-900">
                  Remove Image from Notion?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to remove the image from this post? It will be removed from your Notion database files column immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isRemovingImage}
                onClick={() => setShowRemoveImageModal(false)}
                className="px-4 py-2 text-xs font-semibold font-display text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition tap-bounce cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingImage}
                onClick={handleQuickRemoveImage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-display text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition tap-bounce cursor-pointer disabled:opacity-60"
              >
                {isRemovingImage ? (
                  <>
                    <SyncIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Remove Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Image Zoom */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-semibold px-3 py-1 bg-white/20 rounded-full cursor-pointer"
            >
              ✕ Close
            </button>
            <img
              src={lightboxImage}
              alt="Full Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
