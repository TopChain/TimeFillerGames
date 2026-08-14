import { NextResponse } from 'next/server';
import { removeModeratedParticipant, renameModeratedParticipant, setModeratedParticipantRole, unlockModeratedNickname } from '@/lib/participant-moderation-service';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { requireUser } from '@/lib/supabase/auth';

export async function PATCH(request: Request, context: { params: Promise<{ code: string; participantId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Host authentication is required.' }, { status: 401 });
    const { code, participantId } = await context.params;
    await consumeServerRateLimit({ scope: 'host-moderation', identity: user.id, resource: code, limit: 60, windowSeconds: 60, message: 'Too many moderation actions. Wait briefly and try again.' });
    const body = await request.json() as { role?: 'participant' | 'spectator'; nickname?: unknown; unlockNickname?: unknown };

    if (body.role === 'participant' || body.role === 'spectator') {
      const participant = await setModeratedParticipantRole(code, user.id, participantId, body.role);
      return NextResponse.json({ participant });
    }
    if (typeof body.nickname === 'string') {
      const participant = await renameModeratedParticipant(code, user.id, participantId, body.nickname);
      return NextResponse.json({ participant });
    }
    if (body.unlockNickname === true) {
      const participant = await unlockModeratedNickname(code, user.id, participantId);
      return NextResponse.json({ participant });
    }
    return NextResponse.json({ error: 'Choose a supported Host moderation action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update participant.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ code: string; participantId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Host authentication is required.' }, { status: 401 });
    const { code, participantId } = await context.params;
    await consumeServerRateLimit({ scope: 'host-moderation', identity: user.id, resource: code, limit: 60, windowSeconds: 60, message: 'Too many moderation actions. Wait briefly and try again.' });
    const result = await removeModeratedParticipant(code, user.id, participantId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not remove participant.' }, { status: 400 });
  }
}
