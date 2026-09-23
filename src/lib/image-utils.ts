/**
 * Helper to resolve and sanitize media URLs (images and videos).
 * Automatically rewrites localhost or relative paths to valid API upload paths.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If it points to our upload endpoint (regardless of domain: localhost, cloud run, etc.)
  if (trimmed.includes('/api/uploads/')) {
    const filename = trimmed.split('/api/uploads/').pop();
    if (filename) return `/api/uploads/${filename}`;
  }
  // Convert any domain's /uploads/... to /api/uploads/...
  if (trimmed.includes('/uploads/')) {
    const filename = trimmed.split('/uploads/').pop();
    if (filename) return `/api/uploads/${filename}`;
  }
  if (trimmed.startsWith('/uploads/')) {
    return `/api${trimmed}`;
  }

  return trimmed;
}

export const resolveMediaUrl = resolveImageUrl;

const VIDEO_EXTENSIONS_REGEX = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv)(\?|$)/i;

/**
 * Checks if a media item or URL is a playable video file.
 */
export function isVideoMedia(
  media?: { url?: string | null; name?: string | null; type?: string | null } | string | null
): boolean {
  if (!media) return false;

  if (typeof media === 'string') {
    const trimmed = media.trim();
    return VIDEO_EXTENSIONS_REGEX.test(trimmed);
  }

  if (media.type === 'video') return true;

  const name = (media.name || '').trim();
  if (VIDEO_EXTENSIONS_REGEX.test(name)) return true;

  const url = (media.url || '').trim();
  if (VIDEO_EXTENSIONS_REGEX.test(url)) return true;

  return false;
}

/**
 * Checks if a media item is an image.
 */
export function isImageMedia(
  media?: { url?: string | null; name?: string | null; type?: string | null } | string | null
): boolean {
  if (!media) return false;
  if (isVideoMedia(media)) return false;
  return true;
}

/**
 * Returns the best-guess MIME type for a video file based on filename or URL.
 */
export function getVideoMimeType(url?: string | null, name?: string | null): string {
  const target = `${name || ''} ${url || ''}`.toLowerCase();
  if (target.includes('.webm')) return 'video/webm';
  if (target.includes('.mov')) return 'video/quicktime';
  if (target.includes('.ogg') || target.includes('.ogv')) return 'video/ogg';
  if (target.includes('.m4v')) return 'video/x-m4v';
  return 'video/mp4';
}
