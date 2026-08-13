const nativeFetch = window.fetch.bind(window);

export function installMobileApiFetch() {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('VITE_API_BASE_URL is required for the mobile client.');
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) return nativeFetch(`${base}${input}`, init);
    if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith('/api/')) return nativeFetch(`${base}${input.pathname}${input.search}`, init);
    return nativeFetch(input, init);
  }) as typeof window.fetch;
}
