import { NextResponse } from 'next/server';
import { heartbeatParticipant } from '@/lib/room-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'A valid guest session is required.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { sessionToken?: string };
    const sessionToken = String(body.sessionToken ?? '').trim();
    if (!sessionToken) return NextResponse.json({ error: 'Session token is required.' }, { status: 400 });
    const result = await heartbeatParticipant(code, sessionToken, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Heartbeat failed.' }, { status: 400 });
  }
}
