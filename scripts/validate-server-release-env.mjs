const required = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
};

const missing = Object.entries(required).filter(([, value]) => !value?.trim()).map(([key]) => key);
if (missing.length) throw new Error(`Missing server release environment: ${missing.join(', ')}`);

function requireHttps(key, value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error(`${key} must use HTTPS for a production release.`);
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.invalid') || parsed.hostname.includes('example')) {
    throw new Error(`${key} still points at a development/placeholder host.`);
  }
}

requireHttps('NEXT_PUBLIC_APP_URL', required.NEXT_PUBLIC_APP_URL);
requireHttps('NEXT_PUBLIC_SUPABASE_URL', required.NEXT_PUBLIC_SUPABASE_URL);

if (!String(required.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).startsWith('sb_publishable_')) {
  throw new Error('Use the current Supabase publishable key format for the production release.');
}

if (String(required.SUPABASE_SECRET_KEY).length < 20) {
  throw new Error('The server Supabase credential is missing or unexpectedly short.');
}

if (String(required.CRON_SECRET).length < 32) {
  throw new Error('CRON_SECRET must be a strong random value of at least 32 characters.');
}

if (process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED !== 'true') {
  throw new Error('NEXT_PUBLIC_REVIEW_ACCESS_ENABLED must be true for the store-review release so reviewers have reusable Host access.');
}

console.log('Server release environment passed validation.');
