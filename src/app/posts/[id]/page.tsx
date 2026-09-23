'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LinkedInPost, PostDetailApiResponse, PostMediaItem } from '@/types/post';
import { LinkedInPostCard } from '@/components/LinkedInPostCard';
import { Toast } from '@/components/Toast';
import { ImageGenerationFlow } from '@/components/ImageGenerationFlow';
import { resolveImageUrl, isVideoMedia, getVideoMimeType } from '@/lib/image-utils';
import { getAuthorForVertical } from '@/lib/notion/mapper';
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SyncIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ImageIcon,
  UploadIcon,
  PlusIcon,
  XIcon,
  SparklesIcon,
  VideoIcon,
  PlayIcon,
} from '@/components/icons';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [post, setPost] = useState<LinkedInPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [fullCopy, setFullCopy] = useState('');
  const [status, setStatus] = useState('Drafted');
  const [scheduledDate, setScheduledDate] = useState('');
  const [vertical, setVertical] = useState('GTM');

  // Images State (Files Column)
  const [images, setImages] = useState<PostMediaItem[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isVideo: boolean; title?: string } | null>(null);
  const [imageToRemove, setImageToRemove] = useState<number | null>(null);
  const [addMediaMode, setAddMediaMode] = useState<'upload' | 'url'>('upload');

  // Replace Image State
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [replaceMode, setReplaceMode] = useState<'upload' | 'url'>('upload');
  const [replaceUrlInput, setReplaceUrlInput] = useState('');
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [isDragOverReplace, setIsDragOverReplace] = useState(false);

  // AI Visual Director Flow State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalInitialStep, setAiModalInitialStep] = useState<'menu' | 'directions' | 'upload' | 'url_input'>('menu');

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${id}`, { cache: 'no-store' });
        const data: PostDetailApiResponse = await res.json();
        if (data.error) {
          setError(data.error.message);
        } else if (data.post) {
          setPost(data.post);
          setName(data.post.name || '');
          setFullCopy(data.post.fullCopy || '');
          setStatus(data.post.status || 'Drafted');
          setScheduledDate(data.post.scheduledDate || '');
          setVertical(data.post.vertical || 'GTM');
          setImages(data.post.images || []);
        } else {
          setError('Post not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load post details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handleSaveToNotion = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          fullCopy,
          status,
          scheduledDate: scheduledDate || null,
          images,
        }),
      });

      const data: PostDetailApiResponse = await res.json();
      if (data.error) {
        setNotice(`Failed to save to Notion: ${data.error.message}`);
      } else if (data.post) {
        setPost(data.post);
        setImages(data.post.images || []);
        setNotice('Changes saved to Notion successfully!');
      }
    } catch (err: any) {
      setNotice('Network error: failed to update Notion database');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = () => {
    if (!fullCopy) return;
    navigator.clipboard.writeText(fullCopy);
    setCopied(true);
    setNotice('Post copy copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      setNotice('Please choose a valid image file (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setNotice(`Upload failed: ${data.error?.message || 'Server error'}`);
      } else {
        const newMediaItem: PostMediaItem = {
          url: data.url,
          name: data.name || file.name,
          type: 'image',
        };
        setImages((prev) => [...prev, newMediaItem]);
        setNotice('Image uploaded! Click "Save Changes to Notion" to update your database.');
      }
    } catch (err: any) {
      setNotice('Network error uploading image file');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      setNotice('Please enter a valid image URL starting with https://');
      return;
    }
    const cleanName = trimmed.split('/').pop()?.split('?')[0] || 'attached_image.png';
    const newMediaItem: PostMediaItem = {
      url: trimmed,
      name: cleanName.length > 30 ? cleanName.slice(0, 30) + '...' : cleanName,
      type: 'image',
    };
    setImages((prev) => [...prev, newMediaItem]);
    setImageUrlInput('');
    setNotice('Image URL attached! Click "Save Changes to Notion" to update your database.');
  };

  const handleReplaceUploadFile = async (files: FileList | null, indexToReplace: number) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i)) {
      setNotice('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsReplacingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setNotice(`Upload failed: ${data.error?.message || 'Server error'}`);
      } else {
        const replacementItem: PostMediaItem = {
          url: data.url,
          name: data.name || file.name,
          type: 'image',
        };
        setImages((prev) => prev.map((img, i) => (i === indexToReplace ? replacementItem : img)));
        setReplacingIndex(null);
        setNotice('Image replaced! Click "Save Changes to Notion" to update your database.');
      }
    } catch (err: any) {
      setNotice('Network error uploading replacement image');
    } finally {
      setIsReplacingImage(false);
    }
  };

  const handleReplaceWithUrl = (indexToReplace: number) => {
    const trimmed = replaceUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      setNotice('Please enter a valid image URL starting with https://');
      return;
    }
    const cleanName = trimmed.split('/').pop()?.split('?')[0] || 'replaced_image.png';
    const replacementItem: PostMediaItem = {
      url: trimmed,
      name: cleanName.length > 30 ? cleanName.slice(0, 30) + '...' : cleanName,
      type: 'image',
    };
    setImages((prev) => prev.map((img, i) => (i === indexToReplace ? replacementItem : img)));
    setReplacingIndex(null);
    setReplaceUrlInput('');
    setNotice('Image replaced! Click "Save Changes to Notion" to update your database.');
  };

  const handleConfirmRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImageToRemove(null);
    setNotice('Image removed. Click "Save Changes to Notion" to persist.');
  };

  const handleAttachImageFromFlow = async (mediaItem: { url: string; name?: string }) => {
    const newMedia: PostMediaItem = {
      url: mediaItem.url,
      name: mediaItem.name || 'image.jpg',
      type: 'image',
    };
    const nextImages = [newMedia];
    setImages(nextImages);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: nextImages,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setNotice(`Failed to save image to Notion: ${data.error?.message || 'Server error'}`);
        throw new Error(data.error?.message || 'Failed to save to Notion');
      } else {
        if (data.post) {
          setPost(data.post);
        }
        setShowAiModal(false);
        setNotice('Image successfully attached and synced with Notion!');
      }
    } catch (err: any) {
      setNotice(err?.message || 'Failed to save image to Notion');
      throw err;
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setNotice(`Failed to delete post: ${data.error?.message || 'Server error'}`);
      } else {
        setShowDeleteModal(false);
        setNotice('Post successfully deleted from Notion');
        setTimeout(() => {
          router.push('/posts');
        }, 300);
      }
    } catch (err: any) {
      setNotice('Network error: failed to delete post from Notion');
    } finally {
      setDeleting(false);
    }
  };

  // Construct updated post object for live preview
  const authorProfile = getAuthorForVertical(vertical);
  const previewPost: LinkedInPost | null = post
    ? {
        ...post,
        name,
        fullCopy,
        status,
        scheduledDate: scheduledDate || null,
        vertical,
        images,
        authorName: authorProfile.name,
        authorHeadline: authorProfile.headline,
        authorAvatarUrl: authorProfile.avatarUrl,
        authorIsVerified: authorProfile.isVerified,
        authorRelationship: authorProfile.relationship,
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <SyncIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading post details...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-sm space-y-4 shadow-xs">
          <div className="text-red-500 text-3xl">⚠️</div>
          <h2 className="font-bold text-slate-900">Failed to load post</h2>
          <p className="text-xs text-slate-500">{error || 'Post not found'}</p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Content Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition tap-bounce"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Direct Notion Link */}
            {post.notionUrl && (
              <a
                href={post.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                title="Open in Notion"
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-32 space-y-4">
        {activeTab === 'edit' ? (
          <div className="space-y-4">
            {/* Notion Metadata Indicators */}
            {(post.vertical || post.angleType) && (
              <div className="flex items-center gap-2 flex-wrap px-0.5">
                {post.vertical && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200/80 text-slate-700">
                    {post.vertical}
                  </span>
                )}
                {post.angleType && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70">
                    {post.angleType}
                  </span>
                )}
              </div>
            )}

            {/* 1. Status Dropdown Card */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <label htmlFor="post-status-select" className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Post Status</span>
              </label>
              <div className="relative">
                <select
                  id="post-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none pr-10"
                >
                  <option value="Drafted">Drafted</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Posted">Published / Posted</option>
                  <option value="Archived">Archived</option>
                  <option value="Idea">Idea</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </section>

            {/* 2. Scheduled Date Card */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scheduled Date</span>
                </label>
                {scheduledDate && (
                  <button
                    type="button"
                    onClick={() => setScheduledDate('')}
                    className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white text-slate-800 font-medium"
              />

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(7)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer shrink-0"
                >
                  Next Week
                </button>
              </div>
            </section>

            {/* 3. Post Content (Full Copy) */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-display text-slate-700 flex items-center gap-1.5">
                  <span>Post Copy (LinkedIn Text)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={fullCopy}
                onChange={(e) => setFullCopy(e.target.value)}
                rows={Math.max(10, fullCopy.split('\n').length + 2)}
                className="w-full p-3.5 text-[14px] text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white leading-relaxed font-normal resize-y whitespace-pre-wrap select-text font-sans"
                placeholder="Write or paste your LinkedIn post copy here..."
              />

              {/* Character & Word Metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  {fullCopy.trim().split(/\s+/).filter(Boolean).length} words • {fullCopy.length} characters
                </span>
                <span className="italic">Preserves exact Notion formatting</span>
              </div>
            </section>

            {/* 6. Attached Images (Notion Files Column) */}
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#0a66c2]" />
                    <h3 className="text-xs font-bold font-display text-slate-800 uppercase tracking-wider">
                      Attached Images (Files Column)
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {images.length === 1 ? '1 Image' : `${images.length} Images`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Synced with Notion Content Hub <code className="text-slate-700 font-semibold">Image</code> files property (referenced from row with existing image).
                  </p>
                </div>

                {/* Unsaved indicator & quick sync button */}
                {JSON.stringify(images.map((img) => img.url)) !== JSON.stringify((post.images || []).map((img) => img.url)) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Unsaved Changes
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveToNotion}
                      disabled={saving}
                      className="text-xs font-semibold text-white bg-[#0a66c2] hover:bg-[#004182] px-2.5 py-1 rounded-lg transition tap-bounce flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Save changes to Notion files column"
                    >
                      {saving ? (
                        <SyncIcon className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckIcon className="w-3 h-3" />
                      )}
                      <span>Sync</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Current Images List / Gallery */}
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Image Preview</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiModalInitialStep('directions');
                          setShowAiModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer tap-bounce"
                        title="Generate visual directions tailored to this post"
                      >
                        <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>✦ Generate New Version</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiModalInitialStep('menu');
                          setShowAiModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer tap-bounce"
                        title="Replace current image"
                      >
                        <UploadIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Replace Image</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        className="group relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden transition hover:shadow-md hover:border-slate-300"
                      >
                        {/* Media View: Video or Image */}
                        {isVideoMedia(img) ? (
                          <div className="relative aspect-video max-h-[440px] bg-black overflow-hidden flex items-center justify-center">
                            <video
                              src={resolveImageUrl(img.url)}
                              controls
                              preload="metadata"
                              playsInline
                              className="w-full h-full max-h-[440px] object-contain"
                            >
                              <source src={resolveImageUrl(img.url)} type={getVideoMimeType(img.url, img.name)} />
                              Your browser does not support the video tag.
                            </video>
                            <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md pointer-events-none z-10 border border-white/10">
                              <VideoIcon className="w-3 h-3 text-blue-400" />
                              <span>VIDEO</span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                type="button"
                                onClick={() => setLightboxMedia({ url: resolveImageUrl(img.url), isVideo: true, title: img.name })}
                                className="px-2.5 py-1 rounded-md bg-black/75 hover:bg-black/90 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer border border-white/10"
                                title="Preview video full screen"
                              >
                                <EyeIcon className="w-3 h-3" />
                                <span>Expand</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAiModalInitialStep('menu');
                                  setShowAiModal(true);
                                }}
                                className="px-2.5 py-1 rounded-md bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Replace media"
                              >
                                <UploadIcon className="w-3 h-3" />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageToRemove(idx)}
                                className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Remove video"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative aspect-video max-h-[440px] bg-slate-900/5 overflow-hidden flex items-center justify-center">
                            <img
                              src={resolveImageUrl(img.url)}
                              alt={img.name || `Attached image ${idx + 1}`}
                              className="w-full h-full object-cover transition duration-200 group-hover:scale-[1.01] cursor-pointer"
                              onClick={() => setLightboxMedia({ url: resolveImageUrl(img.url), isVideo: false, title: img.name })}
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                const rawUrl = img.url || '';
                                if (rawUrl.includes('/uploads/') && !target.src.includes('/api/uploads/')) {
                                  const filename = rawUrl.split('/uploads/').pop();
                                  if (filename) target.src = `/api/uploads/${filename}`;
                                }
                              }}
                            />
                            {/* Hover action overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              <button
                                type="button"
                                onClick={() => setLightboxMedia({ url: resolveImageUrl(img.url), isVideo: false, title: img.name })}
                                className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Preview full image"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAiModalInitialStep('directions');
                                  setShowAiModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Generate new AI visual based on post copy"
                              >
                                <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                                <span>✦ AI Version</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAiModalInitialStep('menu');
                                  setShowAiModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Replace this image"
                              >
                                <UploadIcon className="w-3.5 h-3.5" />
                                <span>Replace</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageToRemove(idx)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                title="Remove image from post"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card Info & Actions Footer */}
                        <div className="p-2.5 flex items-center justify-between gap-2 bg-white border-t border-slate-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-700 truncate" title={img.name || img.url}>
                              {img.name || `Image ${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {img.url.startsWith('data:') ? 'Embedded image' : img.url}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setAiModalInitialStep('directions');
                                setShowAiModal(true);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                              title="Generate new AI version"
                            >
                              <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                              <span>✦ AI Version</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiModalInitialStep('menu');
                                setShowAiModal(true);
                              }}
                              className="text-xs font-semibold text-slate-700 hover:text-[#0a66c2] hover:bg-blue-50/80 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                              title="Replace this image"
                            >
                              <UploadIcon className="w-3.5 h-3.5 text-slate-500" />
                              <span>Replace</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageToRemove(idx)}
                              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                              title="Remove image from Notion files column"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0a66c2] flex items-center justify-center mx-auto mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No image attached</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-4 max-w-sm mx-auto">
                    Create an AI visual based on this post or upload an existing image.
                  </p>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setAiModalInitialStep('directions');
                        setShowAiModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center gap-1.5 cursor-pointer tap-bounce"
                    >
                      <SparklesIcon className="w-4 h-4 text-amber-300" />
                      <span>✦ Generate Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiModalInitialStep('upload');
                        setShowAiModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer tap-bounce"
                    >
                      <UploadIcon className="w-4 h-4 text-slate-500" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Add Image Options */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Add New Image
                  </label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setAddMediaMode('upload')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        addMediaMode === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <UploadIcon className="w-3 h-3" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMediaMode('url')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        addMediaMode === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <PlusIcon className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>
                  </div>
                </div>

                {addMediaMode === 'upload' ? (
                  /* 1. Drag & Drop / File Upload */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleFileUpload(e.dataTransfer.files);
                    }}
                    className={`p-4 rounded-xl border-2 border-dashed transition text-center ${
                      isDragOver
                        ? 'border-[#0a66c2] bg-blue-50/60'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="file"
                      id="post-image-file-input"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {isUploadingImage ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#0a66c2] py-2">
                          <SyncIcon className="w-4 h-4 animate-spin" />
                          <span>Uploading image...</span>
                        </div>
                      ) : (
                        <>
                          <UploadIcon className="w-6 h-6 text-slate-400 mb-0.5" />
                          <div className="text-xs text-slate-600">
                            <label
                              htmlFor="post-image-file-input"
                              className="font-bold text-[#0a66c2] hover:underline cursor-pointer"
                            >
                              Click to browse
                            </label>{' '}
                            or drag & drop your image here
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Supports PNG, JPG, WEBP, GIF, SVG up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 2. Add via Image URL */
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Attach image from web link:</span>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          placeholder="https://images.unsplash.com/... or hosted image URL"
                          className="w-full pl-3 pr-8 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white"
                        />
                        {imageUrlInput && (
                          <button
                            type="button"
                            onClick={() => setImageUrlInput('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={!imageUrlInput.trim()}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-40 transition tap-bounce flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Attach URL</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* Live LinkedIn Card Preview Tab */
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/70 text-xs text-[#0a66c2] flex items-center justify-between font-medium">
              <span>This is how your post appears in the feed with your current edits.</span>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="font-bold underline hover:text-[#004182] ml-2 cursor-pointer"
              >
                Continue editing
              </button>
            </div>
            {previewPost && (
              <LinkedInPostCard
                post={previewPost}
                onShowNotice={setNotice}
                onPostUpdated={(updated) => {
                  setPost(updated);
                  setName(updated.name || '');
                  setFullCopy(updated.fullCopy || '');
                  setStatus(updated.status || 'Drafted');
                  setScheduledDate(updated.scheduledDate || '');
                  setVertical(updated.vertical || 'GTM');
                }}
                onPostDeleted={() => {
                  setNotice('Post deleted');
                  router.push('/posts');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-3 px-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-2.5 justify-between">
          <button
            type="button"
            onClick={() => router.push('/posts')}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold font-display text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition tap-bounce cursor-pointer"
          >
            Back to Feed
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold font-display text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition tap-bounce cursor-pointer flex items-center gap-1.5"
            title="Delete this post from Notion and feed"
          >
            <TrashIcon className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToNotion}
            disabled={saving}
            className="flex-1 py-2.5 px-4 sm:px-5 bg-[#0a66c2] hover:bg-[#004182] text-white rounded-xl text-xs sm:text-sm font-semibold font-display shadow-xs hover:shadow transition tap-bounce flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <SyncIcon className="w-4 h-4 animate-spin" />
                <span>Saving to Notion...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Save to Notion</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Delete Confirmation Popup Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !deleting && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-detail-dialog-title"
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
                  id="delete-detail-dialog-title"
                  className="text-base font-bold font-display text-slate-900"
                >
                  Delete LinkedIn Post?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this post? This will permanently remove it from your Content Hub feed and archive it in your connected Notion database.
                </p>
              </div>
            </div>

            {name && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 font-semibold truncate">
                {name}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold font-display text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition tap-bounce cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePost}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-display text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition tap-bounce cursor-pointer disabled:opacity-60"
              >
                {deleting ? (
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

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                {lightboxMedia.isVideo && (
                  <span className="bg-[#0a66c2] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                    VIDEO
                  </span>
                )}
                <span className="text-xs text-slate-300 truncate max-w-[280px] sm:max-w-md font-medium">
                  {lightboxMedia.title || 'Media Preview'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
                aria-label="Close preview"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            {lightboxMedia.isVideo ? (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                playsInline
                className="max-h-[82vh] max-w-full rounded-xl shadow-2xl bg-black border border-white/10"
              />
            ) : (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.title || 'Enlarged image preview'}
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            )}
          </div>
        </div>
      )}

      {/* Remove Media Confirmation Modal */}
      {imageToRemove !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setImageToRemove(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-slate-900">
                  {images[imageToRemove] && isVideoMedia(images[imageToRemove]) ? 'Remove Attached Video?' : 'Remove Attached Image?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to remove this {images[imageToRemove] && isVideoMedia(images[imageToRemove]) ? 'video' : 'image'} from the post? It will be removed from your Notion database files column once you save changes.
                </p>
              </div>
            </div>

            {images[imageToRemove] && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                {isVideoMedia(images[imageToRemove]) ? (
                  <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                    <VideoIcon className="w-6 h-6" />
                  </div>
                ) : (
                  <img
                    src={images[imageToRemove].url}
                    alt={images[imageToRemove].name || 'Image to remove'}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {images[imageToRemove].name || (isVideoMedia(images[imageToRemove]) ? 'Attached video' : 'Attached image')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageToRemove(null)}
                className="px-4 py-2 text-xs font-semibold font-display text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition tap-bounce cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRemoveImage(imageToRemove)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-display text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition tap-bounce cursor-pointer"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>{images[imageToRemove] && isVideoMedia(images[imageToRemove]) ? 'Remove Video' : 'Remove Image'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Image Modal */}
      {replacingIndex !== null && images[replacingIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isReplacingImage && setReplacingIndex(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 font-sans animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0a66c2] flex items-center justify-center flex-shrink-0">
                  <UploadIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-slate-900">
                    Replace Attached Image
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Choose a new image to replace the current image.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isReplacingImage}
                onClick={() => setReplacingIndex(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Current Image Being Replaced */}
            <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200/70 rounded-xl">
              <img
                src={images[replacingIndex].url}
                alt={images[replacingIndex].name || 'Current image'}
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Image
                </span>
                <span className="text-xs font-semibold text-slate-700 truncate block">
                  {images[replacingIndex].name || `Image ${replacingIndex + 1}`}
                </span>
              </div>
            </div>

            {/* Segmented Mode Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setReplaceMode('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  replaceMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadIcon className="w-3.5 h-3.5" />
                <span>Upload Replacement</span>
              </button>
              <button
                type="button"
                onClick={() => setReplaceMode('url')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  replaceMode === 'url'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {replaceMode === 'upload' ? (
              /* Drag & Drop File Replacement */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverReplace(true);
                }}
                onDragLeave={() => setIsDragOverReplace(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverReplace(false);
                  if (replacingIndex !== null) {
                    handleReplaceUploadFile(e.dataTransfer.files, replacingIndex);
                  }
                }}
                className={`p-6 rounded-xl border-2 border-dashed transition text-center ${
                  isDragOverReplace
                    ? 'border-[#0a66c2] bg-blue-50/60'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <input
                  type="file"
                  id={`replace-file-${replacingIndex}`}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={(e) => {
                    if (replacingIndex !== null) {
                      handleReplaceUploadFile(e.target.files, replacingIndex);
                    }
                  }}
                  className="hidden"
                  disabled={isReplacingImage}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {isReplacingImage ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0a66c2] py-3">
                      <SyncIcon className="w-4 h-4 animate-spin" />
                      <span>Uploading replacement image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0a66c2] flex items-center justify-center">
                        <UploadIcon className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-slate-700">
                        <label
                          htmlFor={`replace-file-${replacingIndex}`}
                          className="font-bold text-[#0a66c2] hover:underline cursor-pointer"
                        >
                          Click to browse
                        </label>{' '}
                        or drop new image file here
                      </div>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, WEBP, GIF, SVG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* URL Replacement */
              <div className="space-y-3 py-2">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Paste Replacement Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={replaceUrlInput}
                    onChange={(e) => setReplaceUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (replacingIndex !== null) {
                          handleReplaceWithUrl(replacingIndex);
                        }
                      }
                    }}
                    placeholder="https://images.unsplash.com/... or image link"
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:bg-white"
                    disabled={isReplacingImage}
                    autoFocus
                  />
                  {replaceUrlInput && (
                    <button
                      type="button"
                      onClick={() => setReplaceUrlInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isReplacingImage}
                    onClick={() => setReplacingIndex(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition tap-bounce cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isReplacingImage || !replaceUrlInput.trim()}
                    onClick={() => {
                      if (replacingIndex !== null) {
                        handleReplaceWithUrl(replacingIndex);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0a66c2] hover:bg-[#004182] rounded-lg shadow-xs transition tap-bounce cursor-pointer disabled:opacity-50"
                  >
                    <span>Replace Image</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Visual Director & Media Modal Flow */}
      <ImageGenerationFlow
        post={{
          id,
          name,
          title: name,
          fullCopy,
          vertical,
          images,
        }}
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        isReplacing={images.length > 0}
        initialStep={aiModalInitialStep}
        onAttachImage={handleAttachImageFromFlow}
      />

      {/* Toast Notice */}
      <Toast message={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
