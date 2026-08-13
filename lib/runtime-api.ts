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

export function isHostedApiMode() {
  return apiBaseUrl().length > 0;
}
