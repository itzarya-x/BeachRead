import type { SyntheticEvent } from 'react';

const FALLBACK_COVER_URL = '/cover-fallback.svg';
const IMAGE_PROXY_PATH = '/api/image?url=';

function toProxiedImageUrl(url: string): string {
  if (url.startsWith(IMAGE_PROXY_PATH)) return url;
  return `${IMAGE_PROXY_PATH}${encodeURIComponent(url)}`;
}

export function sanitizeCoverUrl(url?: string | null): string {
  if (!url) return FALLBACK_COVER_URL;
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_COVER_URL;

  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return toProxiedImageUrl(trimmed);
  }

  // Reject unsupported protocols/values.
  return FALLBACK_COVER_URL;
}

export function handleCoverImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.endsWith(FALLBACK_COVER_URL)) return;
  image.src = FALLBACK_COVER_URL;
}
