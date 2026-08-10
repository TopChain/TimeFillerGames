import { NextResponse } from 'next/server';
import { listModerationEvents } from '@/lib/participant-moderation-service';
import { requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Host authentication is required.' }, { status: 401 });
    const { code } = await context.params;
    const events = await listModerationEvents(code, user.id, 30);
    return NextResponse.json({ events }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load moderation activity.' }, { status: 400 });
  }
}
