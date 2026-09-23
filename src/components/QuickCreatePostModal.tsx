'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { LinkedInPost, PostMediaItem } from '@/types/post';
import { LinkedInPostCard } from './LinkedInPostCard';
import { getAuthorForVertical } from '@/lib/notion/mapper';
import {
  XIcon,
  SparklesIcon,
  UploadIcon,
  VideoIcon,
  ImageIcon,
  RefreshCwIcon,
  PlayIcon,
  LinkedInVerifiedIcon,
  TagIcon,
  HelpCircleIcon,
} from './icons';

export interface RepurposeInitialData {
  name?: string;
  fullCopy?: string;
  hook?: string;
  vertical?: string;
  ctaKeyword?: string;
  images?: PostMediaItem[];
  photoDirection?: string;
  taggedEntities?: Array<{ name: string; handle: string; type?: string; reason?: string }>;
  decisionInsights?: {
    hookPsychology?: { type: string; whyItWorks: string; dwellTimeImpact: string };
    visualStrategy?: { archetype: string; whyThisPhotoWorks: string; visualRetentionScore?: number; aspectRatio?: string };
    taggingStrategy?: { suggestedTags?: any[]; rationale: string; amplificationProbability?: string };
    conversionArchitecture?: { ctaTrigger: string; whyItWorks: string };
  };
  originalMedia?: {
    url: string;
    title: string;
    archetype?: string;
  };
  diagramSpec?: any;
  visualInsights?: {
    analysis?: string;
    enhancementDetails?: string;
    detectedFormat?: string;
    variantDetails?: {
      originalSubject?: string;
      originalSetting?: string;
      differentCharacter?: string;
      differentSetting?: string;
      angleLabels?: string[];
      headline?: string;
      hasEmbeddedText?: boolean;
      embeddedText?: string[];
    };
  };
}

interface QuickCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: LinkedInPost) => void;
  onShowNotice: (msg: string) => void;
  initialVertical?: string;
  initialData?: RepurposeInitialData | null;
}

export function QuickCreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
  onShowNotice,
  initialVertical = 'GTM',
  initialData = null,
}: QuickCreatePostModalProps) {
  const fileInputId = useId();
  // Form State
  const [vertical, setVertical] = useState<string>(
    initialVertical === 'All' ? 'GTM' : initialVertical
  );
  const [name, setName] = useState<string>('');
  const [fullCopy, setFullCopy] = useState<string>('');
  const [ctaKeyword, setCtaKeyword] = useState<string>('STACK');
  const [status, setStatus] = useState<'Draft' | 'Scheduled' | 'Idea'>('Draft');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<PostMediaItem[]>([]);

  // Repurpose & Explainable Insights State
  const [decisionInsights, setDecisionInsights] = useState<RepurposeInitialData['decisionInsights'] | null>(null);
  const [taggedEntities, setTaggedEntities] = useState<RepurposeInitialData['taggedEntities']>([]);
  const [photoDirection, setPhotoDirection] = useState<string>('');
  const [showInsightsDetails, setShowInsightsDetails] = useState<boolean>(true);

  // Repurpose Visual & Angle Studio State
  const [originalMedia, setOriginalMedia] = useState<RepurposeInitialData['originalMedia'] | null>(null);
  const [diagramSpec, setDiagramSpec] = useState<any>(null);
  const [visualInsights, setVisualInsights] = useState<RepurposeInitialData['visualInsights'] | null>(null);
  const [selectedVisualTheme, setSelectedVisualTheme] = useState<'dark' | 'blueprint' | 'minimal' | 'cyber'>('dark');
  const [isRegeneratingVisual, setIsRegeneratingVisual] = useState<boolean>(false);
  const [isRegeneratingAngle, setIsRegeneratingAngle] = useState<boolean>(false);
  const [activeMediaSource, setActiveMediaSource] = useState<'repurposed' | 'original' | 'custom'>('repurposed');
  const [repurposedMediaItem, setRepurposedMediaItem] = useState<PostMediaItem | null>(null);

  // Mobile Tab toggle: 'editor' | 'preview'
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Media Upload State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant State
  const [aiTopic, setAiTopic] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiHooks, setAiHooks] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);

  // Saving State
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Populate from initialData when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '');
      setFullCopy(initialData.fullCopy || '');
      if (initialData.vertical) {
        setVertical(initialData.vertical);
      }
      if (initialData.ctaKeyword) {
        setCtaKeyword(initialData.ctaKeyword);
      }
      if (initialData.images && initialData.images.length > 0) {
        setMediaItems(initialData.images);
        setRepurposedMediaItem(initialData.images[0]);
      }
      if (initialData.originalMedia) {
        setOriginalMedia(initialData.originalMedia);
        setActiveMediaSource('repurposed');
      } else {
        setOriginalMedia(null);
      }
      if (initialData.diagramSpec) {
        setDiagramSpec(initialData.diagramSpec);
      } else {
        setDiagramSpec(null);
      }
      if (initialData.visualInsights) {
        setVisualInsights(initialData.visualInsights);
      } else {
        setVisualInsights(null);
      }
      if (initialData.decisionInsights) {
        setDecisionInsights(initialData.decisionInsights);
      }
      if (initialData.taggedEntities) {
        setTaggedEntities(initialData.taggedEntities);
      }
      if (initialData.photoDirection) {
        setPhotoDirection(initialData.photoDirection);
      }
    } else if (isOpen && !initialData) {
      setName('');
      setFullCopy('');
      setMediaItems([]);
      setOriginalMedia(null);
      setDiagramSpec(null);
      setRepurposedMediaItem(null);
      setActiveMediaSource('custom');
      setDecisionInsights(null);
      setTaggedEntities([]);
      setPhotoDirection('');
    }
  }, [isOpen, initialData]);

  // Sync default CTA keyword when vertical changes
  useEffect(() => {
    const v = vertical.toLowerCase();
    const isCompany = v.includes('growth') || v.includes('company');
    const isVideo = v.includes('video') || v.includes('creative');

    if (isCompany && (ctaKeyword === 'STACK' || ctaKeyword === 'PROMPT')) {
      setCtaKeyword('GROWTH');
    } else if (isVideo && (ctaKeyword === 'STACK' || ctaKeyword === 'GROWTH')) {
      setCtaKeyword('PROMPT');
    } else if (!isCompany && !isVideo && (ctaKeyword === 'PROMPT' || ctaKeyword === 'GROWTH')) {
      setCtaKeyword('STACK');
    }
  }, [vertical, ctaKeyword]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve author identity
  const authorProfile = getAuthorForVertical(vertical);

  // Calculate hook fold line (~140 characters or first newline)
  const firstNewlineIndex = fullCopy.indexOf('\n');
  const hookCutoffIndex = firstNewlineIndex > 0 ? Math.min(firstNewlineIndex, 140) : 140;
  const isHookShortEnough = fullCopy.length > 0 && hookCutoffIndex <= 150;

  // Construct live preview post object
  const previewPost: LinkedInPost = {
    id: 'preview-new',
    notionUrl: '#',
    name: name || 'Untitled Post',
    fullCopy: fullCopy || 'Your draft copy will preview here in authentic LinkedIn format...',
    hook: fullCopy.split('\n')[0] || null,
    status: status,
    scheduledDate: scheduledDate || null,
    vertical: vertical,
    ctaKeyword: ctaKeyword || null,
    images: mediaItems,
    authorName: authorProfile.name,
    authorHeadline: authorProfile.headline,
    authorAvatarUrl: authorProfile.avatarUrl,
    authorIsVerified: authorProfile.isVerified,
    authorRelationship: authorProfile.relationship,
  };

  // Upload handler for photos & video clips
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      const newMedia: PostMediaItem = {
        name: data.name || file.name,
        url: data.url,
        type: data.type === 'video' ? 'video' : 'image',
      };

      setMediaItems([newMedia]);
      onShowNotice(`${data.type === 'video' ? 'Video clip' : 'Image'} uploaded successfully!`);

      // If name is empty, suggest based on filename
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setName(cleanName);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  // AI Hook and Copy Generation
  const handleGenerateAi = async () => {
    if (!aiTopic && mediaItems.length === 0) {
      setUploadError('Please provide a clip topic, rough notes, or attach a video first.');
      return;
    }

    setIsGeneratingAi(true);
    setUploadError(null);

    try {
      const attachedFile = mediaItems[0];
      const res = await fetch('/api/posts/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          vertical,
          fileName: attachedFile?.name || '',
          mediaType: attachedFile?.type || '',
          ctaKeyword,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to generate copy');
      }

      const { data } = json;
      if (data) {
        if (data.suggestedTitle && !name) {
          setName(data.suggestedTitle);
        }
        if (data.fullCopy) {
          setFullCopy(data.fullCopy);
        }
        if (data.hooks && data.hooks.length > 0) {
          setAiHooks(data.hooks);
        }
        if (data.ctaKeyword) {
          setCtaKeyword(data.ctaKeyword);
        }
        onShowNotice('AI copy & hooks generated!');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'AI generation failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Regenerate visual diagram with chosen theme
  const handleRegenerateVisual = async (themeOverride?: 'dark' | 'blueprint' | 'minimal' | 'cyber') => {
    const targetTheme = themeOverride || selectedVisualTheme;
    setIsRegeneratingVisual(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/trends/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name || 'Repurposed Diagram',
          fullCopy,
          hook: fullCopy.split('\n')[0] || '',
          vertical,
          imageUrl: originalMedia?.url || '',
          photoArchetype: originalMedia?.archetype || 'Architecture Diagram',
          theme: targetTheme,
          ctaKeyword,
          repurposeAngle: 'framework',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Visual generation failed');
      }

      if (data.repurposed?.media && data.repurposed.media.length > 0) {
        const newMedia = data.repurposed.media[0];
        setMediaItems([newMedia]);
        setRepurposedMediaItem(newMedia);
        setActiveMediaSource('repurposed');
        setSelectedVisualTheme(targetTheme);
        if (data.repurposed.diagramSpec) {
          setDiagramSpec(data.repurposed.diagramSpec);
        }
        if (data.repurposed.visualInsights) {
          setVisualInsights(data.repurposed.visualInsights);
        }
        onShowNotice(`✨ Generated high-fidelity visual variant!`);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to regenerate visual');
    } finally {
      setIsRegeneratingVisual(false);
    }
  };

  // Switch between AI Repurposed diagram and Original swipe reference
  const handleSwitchMediaSource = (source: 'repurposed' | 'original' | 'custom') => {
    if (source === 'original' && originalMedia) {
      setActiveMediaSource('original');
      setMediaItems([
        {
          url: originalMedia.url,
          name: `${(originalMedia.archetype || 'swipe_reference').toLowerCase().replace(/\s+/g, '_')}.jpg`,
          type: 'image',
        },
      ]);
      onShowNotice('Switched media to original reference swipe photo.');
    } else if (source === 'repurposed' && repurposedMediaItem) {
      setActiveMediaSource('repurposed');
      setMediaItems([repurposedMediaItem]);
      onShowNotice('Switched back to AI Repurposed graphic.');
    } else if (source === 'custom') {
      fileInputRef.current?.click();
    }
  };

  // 1-Click Repurpose Copy Angle
  const handleRegenerateAngle = async (angle: 'framework' | 'contrarian' | 'metrics') => {
    setIsRegeneratingAngle(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/trends/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name || 'Repurposed Post',
          fullCopy,
          hook: fullCopy.split('\n')[0] || '',
          vertical,
          photoArchetype: originalMedia?.archetype || 'Architecture Diagram',
          theme: selectedVisualTheme,
          ctaKeyword,
          repurposeAngle: angle,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Repurpose angle failed');
      }

      const rep = data.repurposed;
      if (rep) {
        if (rep.name) setName(rep.name);
        if (rep.fullCopy) setFullCopy(rep.fullCopy);
        if (rep.ctaKeyword) setCtaKeyword(rep.ctaKeyword);
        if (rep.taggedEntities) setTaggedEntities(rep.taggedEntities);
        if (rep.decisionInsights) setDecisionInsights(rep.decisionInsights);
        onShowNotice(`⚡ Repurposed copy with ${angle.toUpperCase()} angle!`);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to switch angle');
    } finally {
      setIsRegeneratingAngle(false);
    }
  };

  // Save to Notion
  const handleSaveToNotion = async () => {
    if (!fullCopy.trim() && !name.trim()) {
      setUploadError('Please write some copy or a title before saving.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || fullCopy.slice(0, 50),
          fullCopy: fullCopy.trim(),
          hook: fullCopy.split('\n')[0] || '',
          vertical,
          status,
          scheduledDate: scheduledDate || null,
          ctaKeyword: ctaKeyword.trim() || null,
          images: mediaItems,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to save post to Notion Content Hub');
      }

      if (data.post) {
        onPostCreated(data.post);
        onShowNotice(`Post saved as "${status}" in Notion!`);
        onClose();
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to create post');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-click strategic tag injection
  const handleInsertTag = (handle: string) => {
    if (fullCopy.includes(handle)) {
      onShowNotice(`${handle} is already in the post copy`);
      return;
    }
    setFullCopy((prev) => (prev ? `${prev} ${handle}` : handle));
    onShowNotice(`Added ${handle} to copy!`);
  };

  const hasMedia = mediaItems.length > 0;
  const firstMedia = hasMedia ? mediaItems[0] : null;
  const isVideo = firstMedia?.type === 'video' || /\.(mp4|mov|webm|m4v)$/i.test(firstMedia?.url || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/70 text-[#0a66c2] flex items-center justify-center font-bold">
              ✍️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 leading-tight">
                Create Post Studio
              </h2>
              <p className="text-xs text-slate-500">
                Draft, attach clips, and publish directly to Notion Content Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  activeTab === 'editor' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              title="Close (Esc)"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Screen */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
          {/* Left Side: Editor & Controls (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 p-4 sm:p-5 space-y-4 overflow-y-auto ${
              activeTab === 'editor' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* 1. Persona & Vertical Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 tracking-wider font-display uppercase">
                Author Persona & Vertical
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* GTM Option */}
                <button
                  type="button"
                  onClick={() => setVertical('GTM')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    vertical === 'GTM'
                      ? 'border-[#0a66c2] bg-blue-50/50 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src="/avatars/tibin-gtm.svg"
                    alt="Tibin Jacob GTM"
                    className="w-9 h-9 rounded-full border border-slate-200/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-bold text-xs text-slate-900 truncate">
                      <span>Tibin Jacob</span>
                      <LinkedInVerifiedIcon className="w-3 h-3 shrink-0" />
                    </div>
                    <div className="text-[10.5px] text-[#0a66c2] font-semibold truncate">
                      AI Growth Engineer
                    </div>
                  </div>
                </button>

                {/* AI Video Option */}
                <button
                  type="button"
                  onClick={() => setVertical('AI Video')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    vertical === 'AI Video'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src="/avatars/tibin-ai-video.svg"
                    alt="Tibin Jacob AI Video"
                    className="w-9 h-9 rounded-full border border-slate-200/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-bold text-xs text-slate-900 truncate">
                      <span>Tibin Jacob</span>
                    </div>
                    <div className="text-[10.5px] text-purple-700 font-semibold truncate">
                      AI Creative Strategist
                    </div>
                  </div>
                </button>

                {/* Growth Stacks (Company) Option */}
                <button
                  type="button"
                  onClick={() => setVertical('Growth Stacks')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    vertical === 'Growth Stacks'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src="/avatars/growth-stacks.svg"
                    alt="Growth Stacks"
                    className="w-9 h-9 rounded-xl border border-slate-200/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-bold text-xs text-slate-900 truncate">
                      <span>Growth Stacks</span>
                      <LinkedInVerifiedIcon className="w-3 h-3 shrink-0" />
                    </div>
                    <div className="text-[10.5px] text-emerald-700 font-semibold truncate">
                      Company Page
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Media Dropzone (Video / Photos) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 tracking-wider font-display uppercase flex items-center gap-1.5">
                  <span>Attached Media (Clip / Graphic)</span>
                  {hasMedia && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {isVideo ? '1 Video Attached' : activeMediaSource === 'repurposed' ? '⚡ AI Repurposed Graphic' : '1 Image Attached'}
                    </span>
                  )}
                </label>
                {hasMedia && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaItems([]);
                      setActiveMediaSource('custom');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Remove media
                  </button>
                )}
              </div>

              {/* Repurpose Media Source Switcher (When repurposed from trend) */}
              {originalMedia && (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-medium">
                    <span className="text-[11px] font-bold text-slate-500 uppercase px-1 font-display">Visual:</span>
                    <button
                      type="button"
                      onClick={() => handleSwitchMediaSource('repurposed')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeMediaSource === 'repurposed'
                          ? 'bg-[#0a66c2] text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <SparklesIcon className="w-3 h-3 text-amber-300" />
                      <span>✨ Enhanced Visual Variant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchMediaSource('original')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeMediaSource === 'original'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3 text-slate-300" />
                      <span>📷 Original Reference Asset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchMediaSource('custom')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeMediaSource === 'custom'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <UploadIcon className="w-3 h-3" />
                      <span>Upload Custom</span>
                    </button>
                  </div>
                  {activeMediaSource === 'repurposed' && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>✨ Variant preserves the core concept with elevated dynamic range and editorial LinkedIn framing.</span>
                      <button
                        type="button"
                        onClick={() => handleRegenerateVisual()}
                        disabled={isRegeneratingVisual}
                        className="text-[#0a66c2] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCwIcon className={`w-3 h-3 ${isRegeneratingVisual ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!hasMedia ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                    isDragOver
                      ? 'border-[#0a66c2] bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id={fileInputId}
                    aria-label="Upload post image or video clip"
                    accept="video/mp4,video/quicktime,video/webm,image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600">
                    {isUploading ? (
                      <RefreshCwIcon className="w-5 h-5 animate-spin text-[#0a66c2]" />
                    ) : (
                      <UploadIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      {isUploading ? 'Uploading media...' : 'Drop video clip (.mp4, .mov) or graphic here'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      or click to browse files (Up to 100MB video / 20MB image)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center gap-3">
                    {isVideo ? (
                      <div className="w-16 h-16 rounded-lg bg-slate-900 text-white flex items-center justify-center relative shrink-0 overflow-hidden">
                        <video src={firstMedia?.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <PlayIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <img
                          src={firstMedia?.url}
                          alt="Uploaded media"
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-2xs"
                        />
                        {activeMediaSource === 'repurposed' && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#0a66c2] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                            AI
                          </span>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isVideo ? (
                          <VideoIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {firstMedia?.name || 'Attached media file'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {activeMediaSource === 'repurposed'
                          ? visualInsights?.detectedFormat === 'character_angle_grid'
                            ? 'AI visual variant generated via Gemini Vision (different character, studio setting & focal tags)'
                            : visualInsights?.detectedFormat === 'single_portrait'
                            ? 'AI cinematic portrait variant generated via Gemini Vision (different character & setting)'
                            : visualInsights?.detectedFormat === 'workflow_table'
                            ? 'AI workflow table variant generated via Gemini Vision'
                            : 'AI visual variant generated via Gemini Vision'
                          : activeMediaSource === 'original'
                          ? 'Reference viral photo from swipe file'
                          : 'Ready for live LinkedIn preview'}
                      </p>
                    </div>
                  </div>

                  {/* AI Visual Asset Generator & Vision Transformation Studio */}
                  {activeMediaSource === 'repurposed' && (
                    <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <SparklesIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-bold font-display">AI Visual Asset Generator</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                          {visualInsights?.detectedFormat === 'character_angle_grid'
                            ? 'Multi-Angle Character Grid'
                            : visualInsights?.detectedFormat === 'single_portrait'
                            ? 'Cinematic Portrait'
                            : visualInsights?.detectedFormat === 'workflow_table'
                            ? 'Workflow Matrix'
                            : originalMedia?.archetype || 'Technical Asset'}
                        </span>
                      </div>

                      {/* Vision Transformation Insight Card */}
                      {visualInsights?.variantDetails && (
                        <div className="p-2.5 bg-black/40 border border-blue-500/20 rounded-lg text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-300 flex items-center gap-1">
                              <span>👁️ Gemini Vision:</span>
                              <span className="text-slate-200">Analyzed original reference &amp; generated variant</span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-bold">
                              ORIGINAL VARIANT
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-slate-300 pt-0.5">
                            <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
                              <span className="text-blue-300 font-bold block mb-0.5">✨ NEW CHARACTER:</span>
                              <span className="line-clamp-2 text-slate-300">{visualInsights.variantDetails.differentCharacter}</span>
                            </div>
                            <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
                              <span className="text-indigo-300 font-bold block mb-0.5">🏛️ NEW SETTING:</span>
                              <span className="line-clamp-2 text-slate-300">{visualInsights.variantDetails.differentSetting}</span>
                            </div>
                          </div>
                          {visualInsights.variantDetails.angleLabels && visualInsights.variantDetails.angleLabels.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 overflow-x-auto pt-0.5 no-scrollbar">
                              <span className="text-slate-500 font-semibold shrink-0">Labels:</span>
                              {visualInsights.variantDetails.angleLabels.slice(0, 4).map((label, idx) => (
                                <span key={idx} className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded shrink-0 border border-slate-700">
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1">
                          {(
                            [
                              { id: 'dark', label: '🌑 Noir' },
                              { id: 'blueprint', label: '🔷 Techwear' },
                              { id: 'minimal', label: '☀️ Studio' },
                              { id: 'cyber', label: '🟣 Cyber' },
                            ] as const
                          ).map((thm) => (
                            <button
                              key={thm.id}
                              type="button"
                              onClick={() => {
                                setSelectedVisualTheme(thm.id);
                                handleRegenerateVisual(thm.id);
                              }}
                              disabled={isRegeneratingVisual}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${
                                selectedVisualTheme === thm.id
                                  ? 'bg-blue-600 text-white ring-1 ring-white/30'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {thm.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRegenerateVisual()}
                          disabled={isRegeneratingVisual}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCwIcon className={`w-3 h-3 ${isRegeneratingVisual ? 'animate-spin' : ''}`} />
                          <span>{isRegeneratingVisual ? 'Generating Variant...' : 'Regenerate Variant'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. AI Copilot Accordion */}
            <div className="rounded-xl border border-blue-200/70 bg-blue-50/30 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowAiPanel(!showAiPanel)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-blue-50/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-[#0a66c2]" />
                  <span className="text-xs font-bold text-[#0a66c2]">
                    AI Hook & Post Generator (from clip or notes)
                  </span>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {showAiPanel ? 'Hide' : 'Open'}
                </span>
              </button>

              {showAiPanel && (
                <div className="p-3.5 pt-1 space-y-2.5 border-t border-blue-100 bg-white">
                  <p className="text-[11px] text-slate-600">
                    Enter key takeaways or what the video shows. Gemini will generate high-performing hooks and spaced copy tailored to the {vertical} persona.
                  </p>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. In this clip I demonstrate how to set up clay signals to find hiring surges and trigger personalised emails..."
                    rows={2}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-[#0a66c2] outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi}
                      className="px-3 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <>
                          <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Hook & Body...</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-3.5 h-3.5" />
                          <span>Generate Copy & Hooks</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Hooks Options */}
                  {aiHooks.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-700">Select Alternative Hook:</p>
                      <div className="space-y-1">
                        {aiHooks.map((h, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const lines = fullCopy.split('\n');
                              lines[0] = h;
                              setFullCopy(lines.join('\n'));
                              onShowNotice('Hook swapped into post!');
                            }}
                            className="w-full text-left p-2 rounded-md text-[11px] bg-slate-50 hover:bg-blue-50 text-slate-800 border border-slate-200/60 transition cursor-pointer"
                          >
                            <span className="font-bold text-[#0a66c2] mr-1">#{idx + 1}</span> {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Post Title (Internal Notion Title) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 tracking-wider font-display uppercase">
                Internal Title (Notion Hub)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Video Character Consistency Framework"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#0a66c2] outline-none font-medium"
              />
            </div>

            {/* AI Explainable Decision Insights & Strategic Tagging Banner */}
            {(decisionInsights || (taggedEntities && taggedEntities.length > 0) || photoDirection) && (
              <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/60 via-slate-50/50 to-indigo-50/30 p-3.5 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-[#0a66c2]" />
                    <span className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                      AI Decision Insights & Photo Strategy
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInsightsDetails(!showInsightsDetails)}
                    className="text-[11px] font-bold text-[#0a66c2] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircleIcon className="w-3.5 h-3.5" />
                    <span>{showInsightsDetails ? 'Hide Audit' : 'Why These Decisions?'}</span>
                  </button>
                </div>

                {showInsightsDetails && (
                  <div className="space-y-2.5 text-[11px] text-slate-700">
                    {/* Photo Strategy */}
                    {photoDirection && (
                      <div className="p-2.5 rounded-xl bg-white/90 border border-blue-100 flex items-start gap-2 shadow-2xs">
                        <ImageIcon className="w-4 h-4 text-[#0a66c2] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block font-bold">Recommended Photo / Diagram Direction:</strong>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{photoDirection}</p>
                        </div>
                      </div>
                    )}

                    {/* Explainable Rationales */}
                    {decisionInsights && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {decisionInsights.hookPsychology && (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
                            <span className="font-bold text-slate-900 block text-[10px] uppercase text-blue-700">
                              🎯 Hook: {decisionInsights.hookPsychology.type}
                            </span>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                              {decisionInsights.hookPsychology.whyItWorks}
                            </p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-1">
                              ⏱️ {decisionInsights.hookPsychology.dwellTimeImpact}
                            </p>
                          </div>
                        )}

                        {decisionInsights.visualStrategy && (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/70 shadow-2xs">
                            <span className="font-bold text-slate-900 block text-[10px] uppercase text-purple-700">
                              📸 Visual Dwell Score: {decisionInsights.visualStrategy.visualRetentionScore || 95}/100
                            </span>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">
                              {decisionInsights.visualStrategy.whyThisPhotoWorks}
                            </p>
                            <p className="text-[10px] text-purple-600 font-medium mt-1">
                              Layout: {decisionInsights.visualStrategy.archetype}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Strategic Tag Injection */}
                    {taggedEntities && taggedEntities.length > 0 && (
                      <div className="pt-1 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <TagIcon className="w-3 h-3 text-[#0a66c2]" /> Recommended @Tags (1-Click Insert)
                          </span>
                          <span className="text-[10px] text-slate-400">Maximizes brand reshares</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {taggedEntities.map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInsertTag(t.handle)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-xs font-mono font-bold transition shadow-2xs cursor-pointer group"
                              title={t.reason || 'Click to insert tag into post copy'}
                            >
                              <span className="text-[#0a66c2]">{t.handle}</span>
                              <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-sans font-normal">
                                + Insert
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4b. Repurposed Copy Angle Variations */}
            {originalMedia && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SparklesIcon className="w-3.5 h-3.5 text-[#0a66c2]" />
                    <span>Repurposed Angle Variations:</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">1-Click Angle Shift</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRegenerateAngle('framework')}
                    disabled={isRegeneratingAngle}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>📐 4-Step Framework</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateAngle('contrarian')}
                    disabled={isRegeneratingAngle}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>⚡ Contrarian Pattern</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerateAngle('metrics')}
                    disabled={isRegeneratingAngle}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>📊 Quantified Case Study</span>
                  </button>
                  {isRegeneratingAngle && (
                    <span className="text-xs text-[#0a66c2] font-semibold flex items-center gap-1 ml-1">
                      <RefreshCwIcon className="w-3 h-3 animate-spin" />
                      <span>Rewriting copy...</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 5. LinkedIn Body Editor with "See More" Fold Indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 tracking-wider font-display uppercase flex items-center gap-1.5">
                  <span>LinkedIn Post Copy</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isHookShortEnough
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {isHookShortEnough ? '✓ Hook fits above fold' : '⚠️ Hook may truncate'}
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {fullCopy.length} chars
                </span>
              </div>
              <textarea
                value={fullCopy}
                onChange={(e) => setFullCopy(e.target.value)}
                placeholder="Write your hook here...&#10;&#10;Explain the framework or insights in short, scannable lines.&#10;&#10;Comment &quot;KEYWORD&quot; to get the complete SOP."
                rows={8}
                className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#0a66c2] outline-none font-sans leading-relaxed"
              />
            </div>

            {/* 6. Settings Row: CTA Keyword & Status & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  CTA Trigger Keyword
                </label>
                <input
                  type="text"
                  value={ctaKeyword}
                  onChange={(e) => setCtaKeyword(e.target.value.toUpperCase())}
                  placeholder="STACK, PROMPT..."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono uppercase font-bold text-[#0a66c2]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Status in Notion
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Idea">Idea</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Scheduled Date (Optional)
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    if (e.target.value && status === 'Draft') {
                      setStatus('Scheduled');
                    }
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Error Message if any */}
            {uploadError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {uploadError}
              </div>
            )}
          </div>

          {/* Right Side: Live LinkedIn Card Preview (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 p-4 sm:p-5 bg-[#f3f2ef] overflow-y-auto space-y-3 ${
              activeTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-600 tracking-wider font-display uppercase">
                Live LinkedIn Preview
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Persona: {authorProfile.name}
              </span>
            </div>

            {/* LinkedIn Card */}
            <div className="shadow-xs rounded-lg overflow-hidden border border-slate-200/90 bg-white">
              <LinkedInPostCard
                post={previewPost}
                onShowNotice={onShowNotice}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center px-4">
              Real-time feed preview matches the official LinkedIn mobile and desktop feed layout.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveToNotion}
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Saving to Notion...</span>
                </>
              ) : (
                <>
                  <span>Save Post as {status}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
