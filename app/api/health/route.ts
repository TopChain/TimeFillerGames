import { NextResponse } from 'next/server';

export async function GET() {
  const publicSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const serverSupabaseConfigured = Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const ok = publicSupabaseConfigured && serverSupabaseConfigured;
  return NextResponse.json({
    ok,
    service: 'timefillergames',
    release: '1.0.0-rc.1',
    publicSupabaseConfigured,
    serverSupabaseConfigured,
    checkedAt: new Date().toISOString(),
  }, {
    status: ok ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
