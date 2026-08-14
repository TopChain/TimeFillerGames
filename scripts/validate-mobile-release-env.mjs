const required = {
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  VITE_APP_URL: process.env.VITE_APP_URL,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_AUTH_REDIRECT_URL: process.env.VITE_AUTH_REDIRECT_URL,
};

const missing = Object.entries(required).filter(([, value]) => !value?.trim()).map(([key]) => key);
if (missing.length) throw new Error(`Missing mobile release environment: ${missing.join(', ')}`);

function requireHttps(key, value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error(`${key} must use HTTPS for a store release.`);
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.invalid') || parsed.hostname.includes('example')) {
    throw new Error(`${key} still points at a development/placeholder host.`);
  }
}

requireHttps('VITE_API_BASE_URL', required.VITE_API_BASE_URL);
requireHttps('VITE_APP_URL', required.VITE_APP_URL);
requireHttps('VITE_SUPABASE_URL', required.VITE_SUPABASE_URL);

if (!String(required.VITE_SUPABASE_PUBLISHABLE_KEY).startsWith('sb_publishable_')) {
  throw new Error('Use the current Supabase publishable key format for the store release.');
}

if (required.VITE_AUTH_REDIRECT_URL !== 'timefillergames://auth/callback') {
  throw new Error('VITE_AUTH_REDIRECT_URL must be timefillergames://auth/callback for the native app.');
}

if (process.env.VITE_REVIEW_ACCESS_ENABLED !== 'true') {
  throw new Error('VITE_REVIEW_ACCESS_ENABLED must be true for the store-review build so reviewers have reusable Host access.');
}

console.log('Mobile release environment passed validation.');
