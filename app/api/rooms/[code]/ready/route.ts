import { NextResponse } from 'next/server';
import { setParticipantReady } from '@/lib/participant-state-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'A valid guest session is required.' }, { status: 401 });
    const { code } = await context.params;
    const body = await request.json() as { sessionToken?: string; ready?: boolean };
    const sessionToken = String(body.sessionToken ?? '').trim();
    if (!sessionToken) return NextResponse.json({ error: 'Session token is required.' }, { status: 400 });
    const participant = await setParticipantReady(code, user.id, sessionToken, body.ready === true);
    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update Ready state.' }, { status: 400 });
  }
}
