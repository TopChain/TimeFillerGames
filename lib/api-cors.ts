export const NATIVE_APP_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
]);

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function configuredAppOrigin() {
  return normalizedOrigin(process.env.NEXT_PUBLIC_APP_URL);
}

export function isAllowedApiOrigin(origin: string | null | undefined) {
  const normalized = normalizedOrigin(origin);
  if (!normalized) return false;
  if (NATIVE_APP_ORIGINS.has(normalized)) return true;
  const appOrigin = configuredAppOrigin();
  return Boolean(appOrigin && normalized === appOrigin);
}

export function corsResponseHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin',
  } as const;
}
