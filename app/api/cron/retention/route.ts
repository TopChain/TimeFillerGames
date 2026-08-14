import { NextResponse } from 'next/server';
import { cleanupExpiredRelease1Data } from '@/lib/retention-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredRelease1Data();
    return NextResponse.json({ ok: true, ...result }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Retention cleanup failed', error);
    return NextResponse.json({ error: 'Retention cleanup failed' }, { status: 500 });
  }
}
