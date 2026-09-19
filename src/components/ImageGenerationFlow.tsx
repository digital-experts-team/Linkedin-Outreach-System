'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadIcon,
  LinkIcon,
  XIcon,
  CheckIcon,
  RefreshCwIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ImageIcon,
  EyeIcon,
  AlertCircleIcon,
} from './icons';

export interface PostContext {
  id: string;
  name?: string | null;
  title?: string | null;
  fullCopy?: string | null;
  vertical?: string | null;
  angle?: string | null;
  audience?: string | null;
  images?: Array<{ url: string; name?: string }> | null;
}

export interface VisualDirection {
  id: string;
  style: string;
  title: string;
  description: string;
  prompt: string;
}

interface ImageGenerationFlowProps {
  post: PostContext;
  isOpen: boolean;
  onClose: () => void;
  onAttachImage: (image: { url: string; name?: string }) => Promise<void> | void;
  isReplacing?: boolean;
  initialStep?: Step;
}

type Step = 'menu' | 'directions' | 'generating' | 'preview' | 'upload' | 'url_input';

export function ImageGenerationFlow({
  post,
  isOpen,
  onClose,
  onAttachImage,
  isReplacing = false,
  initialStep = 'menu',
}: ImageGenerationFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<VisualDirection | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; name?: string; style?: string } | null>(null);
  const [generationVersion, setGenerationVersion] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);

  // Manual upload state
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postTitle = post.title || post.name || 'Post';
  const postContent = post.fullCopy || post.title || post.name || '';

  // 1. Fetch AI Visual Directions
  const fetchDirections = async (exclude: string[] = []) => {
    setLoadingDirections(true);
    setError(null);
    try {
      const res = await fetch('/api/posts/visual-directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: postTitle,
          fullCopy: postContent,
          vertical: post.vertical,
          angle: post.angle,
          audience: post.audience,
          excludePrevious: exclude,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to analyze post for visual directions');
      }

      setDirections(data.directions || []);
      setStep('directions');
    } catch (err: any) {
      setError(err?.message || 'Could not load visual directions.');
    } finally {
      setLoadingDirections(false);
    }
  };

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGeneratedImage(null);
      setSelectedDirection(null);
      setImageUrlInput('');
      setGenerationVersion(1);
      if (initialStep === 'directions') {
        fetchDirections();
      } else {
        setStep(initialStep || 'menu');
      }
    }
  }, [isOpen, post.id, initialStep]);

  if (!isOpen) return null;

  // 2. Generate Image for a Direction
  const generateVisual = async (direction: VisualDirection, versionToUse = 1) => {
    setSelectedDirection(direction);
    setGeneratingImage(true);
    setError(null);
    setStep('generating');

    try {
      const res = await fetch('/api/posts/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: direction.prompt,
          style: direction.style,
          directionTitle: direction.title,
          title: postTitle,
          postContent,
          version: versionToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to generate visual asset.');
      }

      setGeneratedImage({
        url: data.url,
        name: data.name || `${direction.title}.jpg`,
        style: direction.style,
      });
      setStep('preview');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate visual.');
      setStep('directions');
    } finally {
      setGeneratingImage(false);
    }
  };

  // 3. Confirm and Attach Image to Card
  const handleConfirmUseImage = async () => {
    if (!generatedImage) return;
    setAttaching(true);
    try {
      await onAttachImage({
        url: generatedImage.url,
        name: generatedImage.name || 'AI Generated Visual',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach image to card.');
    } finally {
      setAttaching(false);
    }
  };

  // 4. File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
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

      await onAttachImage({
        url: data.url,
        name: data.name || file.name,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image file.');
    } finally {
      setIsUploading(false);
    }
  };

  // 5. URL Attachment Handler
  const handleAttachUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setAttaching(true);
    setError(null);
    try {
      await onAttachImage({
        url: imageUrlInput.trim(),
        name: `${postTitle} attachment`,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach image URL.');
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            {step !== 'menu' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (step === 'generating') return;
                  if (step === 'preview') setStep('directions');
                  else setStep('menu');
                }}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                title="Back"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="font-bold text-[15px] text-slate-900 leading-tight">
                {isReplacing ? 'Replace Card Image' : 'Add Image to Post'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-sm">
                {postTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Main Menu (AI First, preserving Upload & Library) */}
          {step === 'menu' && (
            <div className="space-y-3">
              {/* PRIMARY OPTION: ✦ Generate with AI */}
              <button
                type="button"
                onClick={() => fetchDirections()}
                disabled={loadingDirections}
                className="w-full text-left p-4 rounded-xl border-2 border-[#0a66c2]/40 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 hover:border-[#0a66c2] hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0a66c2] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    {loadingDirections ? (
                      <RefreshCwIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-5 h-5 text-amber-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[15px] text-[#0a66c2] group-hover:underline">
                        ✦ Generate with AI
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#0a66c2]/10 text-[#0a66c2] rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-600 mt-1 leading-snug">
                      Analyze this post and generate 3 custom visual directions matching its hook and thesis.
                    </p>
                  </div>
                </div>
              </button>

              {/* SECONDARY: Upload Image */}
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <UploadIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800 group-hover:text-slate-900">
                      Upload Image File
                    </span>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, WEBP or GIF from your local device
                    </p>
                  </div>
                </div>
              </button>

              {/* TERTIARY: Choose from Library / URL */}
              <button
                type="button"
                onClick={() => setStep('url_input')}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800 group-hover:text-slate-900">
                      Choose from Library / Image URL
                    </span>
                    <p className="text-xs text-slate-500">
                      Attach via existing public web URL or Cloud asset link
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: Visual Directions Selector */}
          {step === 'directions' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-slate-900">
                    Choose a Visual Direction
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    AI generated 3 distinct concepts tailored to this post
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchDirections(directions.map((d) => d.title))}
                  disabled={loadingDirections}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a66c2] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCwIcon className={`w-3.5 h-3.5 ${loadingDirections ? 'animate-spin' : ''}`} />
                  <span>↻ Different Directions</span>
                </button>
              </div>

              {/* 3 Directions Cards */}
              <div className="space-y-2.5">
                {directions.map((dir, idx) => (
                  <div
                    key={dir.id || idx}
                    onClick={() => generateVisual(dir, 1)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0a66c2] hover:bg-blue-50/20 hover:shadow-xs transition cursor-pointer text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a66c2] bg-blue-50 px-2 py-0.5 rounded-md">
                        {dir.style}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-[#0a66c2] flex items-center gap-1">
                        <span>Select</span>
                        <span>→</span>
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-900 group-hover:text-[#0a66c2] transition-colors">
                      {dir.title}
                    </h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {dir.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Surprise Me Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (directions.length > 0) {
                      const randomDir = directions[Math.floor(Math.random() * directions.length)];
                      generateVisual(randomDir, 1);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>✦ Surprise Me</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generating Visual Screen */}
          {step === 'generating' && (
            <div className="py-10 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-[#0a66c2] animate-spin" />
                <SparklesIcon className="w-6 h-6 text-[#0a66c2]" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Creating visual…
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {selectedDirection ? `Direction: ${selectedDirection.title}` : 'Synthesizing editorial asset from post context'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Generated Preview & Actions */}
          {step === 'preview' && generatedImage && (
            <div className="space-y-3.5">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[380px]">
                <img
                  src={generatedImage.url}
                  alt={generatedImage.name || 'AI Visual Preview'}
                  className="w-full h-auto max-h-[380px] object-contain block"
                />
                {generatedImage.style && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-md text-[11px] font-semibold text-white">
                    ✦ {generatedImage.style}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* 1. Primary: Use Image */}
                <button
                  type="button"
                  onClick={handleConfirmUseImage}
                  disabled={attaching}
                  className="sm:col-span-3 w-full py-2.5 px-4 rounded-xl bg-[#0a66c2] hover:bg-[#084d93] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {attaching ? (
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  <span>Use Image (Attach to Card)</span>
                </button>

                {/* 2. Regenerate (Same direction, new variation) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDirection) {
                      const nextVer = generationVersion + 1;
                      setGenerationVersion(nextVer);
                      generateVisual(selectedDirection, nextVer);
                    }
                  }}
                  disabled={generatingImage}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCwIcon className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                {/* 3. Try Different Direction */}
                <button
                  type="button"
                  onClick={() => setStep('directions')}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Try Other Direction</span>
                </button>

                {/* 4. Full View */}
                <button
                  type="button"
                  onClick={() => window.open(generatedImage.url, '_blank')}
                  className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: File Upload Section (Drag and drop + picker) */}
          {step === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-[#0a66c2] bg-blue-50/50'
                    : 'border-slate-300 hover:border-[#0a66c2] hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0a66c2] flex items-center justify-center mx-auto mb-2">
                  {isUploading ? (
                    <RefreshCwIcon className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadIcon className="w-6 h-6" />
                  )}
                </div>
                <p className="font-semibold text-sm text-slate-800">
                  {isUploading ? 'Uploading file...' : 'Drop image file here or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPG, WEBP, GIF up to 10MB
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: Direct URL Input */}
          {step === 'url_input' && (
            <form onSubmit={handleAttachUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Image URL
                </label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/visual.jpg"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('menu')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attaching || !imageUrlInput.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0a66c2] hover:bg-[#084d93] rounded-lg disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {attaching && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />}
                  <span>Attach URL</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
