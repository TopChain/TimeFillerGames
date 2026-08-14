import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const publicSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const serverSupabaseConfigured = Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  let databaseReachable = false;
  let databaseLatencyMs: number | null = null;
  let databaseError: string | null = null;

  if (publicSupabaseConfigured && serverSupabaseConfigured) {
    const startedAt = performance.now();
    try {
      const admin = createAdminClient();
      // No application rows or counts are returned. This only proves that the deployed
      // server credential can reach the Release 1 schema over the provider network.
      const { error } = await admin.from('rooms').select('id', { head: true }).limit(0);
      databaseLatencyMs = Math.round(performance.now() - startedAt);
      if (error) databaseError = 'database-unavailable';
      else databaseReachable = true;
    } catch {
      databaseLatencyMs = Math.round(performance.now() - startedAt);
      databaseError = 'database-unavailable';
    }
  }

  const ok = publicSupabaseConfigured && serverSupabaseConfigured && databaseReachable;
  return NextResponse.json({
    ok,
    service: 'timefillergames',
    release: '1.0.0-rc.1',
    dependencies: {
      publicSupabaseConfigured,
      serverSupabaseConfigured,
      databaseReachable,
      databaseLatencyMs,
      databaseError,
    },
    checkedAt: new Date().toISOString(),
  }, {
    status: ok ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
