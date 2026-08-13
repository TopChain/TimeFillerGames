'use client';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return configured ? trimTrailingSlash(configured) : '';
}

export function apiUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl()}${normalized}`;
}

export function publicAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return trimTrailingSlash(configured);
  if (typeof window !== 'undefined') return trimTrailingSlash(window.location.origin);
  return '';
}

export function publicJoinUrl(roomCode: string) {
  const base = publicAppBaseUrl();
  return `${base}/?join=${encodeURIComponent(roomCode)}`;
}

export function isHostedApiMode() {
  return apiBaseUrl().length > 0;
}
