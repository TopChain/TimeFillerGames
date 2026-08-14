const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
if (!base) throw new Error('NEXT_PUBLIC_APP_URL is required for the staging smoke test.');
const parsed = new URL(base);
if (parsed.protocol !== 'https:') throw new Error('Staging smoke tests require an HTTPS origin.');

async function expectStatus(path, expected) {
  const response = await fetch(`${base}${path}`, { redirect: 'follow' });
  if (response.status !== expected) throw new Error(`${path} returned ${response.status}; expected ${expected}.`);
  return response;
}

const health = await expectStatus('/api/health', 200);
const healthJson = await health.json();
if (healthJson?.ok !== true) throw new Error('/api/health did not report ok=true.');
if (!healthJson?.publicSupabaseConfigured || !healthJson?.serverSupabaseConfigured) {
  throw new Error('/api/health reports incomplete Supabase configuration.');
}

for (const path of ['/', '/privacy-policy', '/terms', '/privacy', '/support']) {
  const response = await expectStatus(path, 200);
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) throw new Error(`${path} did not return HTML.`);
}

await expectStatus('/api/cron/retention', 401);

console.log(`Staging smoke test passed for ${base}.`);
