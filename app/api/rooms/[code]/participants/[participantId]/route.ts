import { NextResponse } from 'next/server';
import { removeModeratedParticipant, setModeratedParticipantRole } from '@/lib/participant-moderation-service';
import { requireUser } from '@/lib/supabase/auth';

export async function PATCH(request: Request, context: { params: Promise<{ code: string; participantId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Host authentication is required.' }, { status: 401 });
    const { code, participantId } = await context.params;
    const body = await request.json() as { role?: 'participant' | 'spectator' };
    if (body.role !== 'participant' && body.role !== 'spectator') {
      return NextResponse.json({ error: 'Choose participant or spectator.' }, { status: 400 });
    }
    const participant = await setModeratedParticipantRole(code, user.id, participantId, body.role);
    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update participant role.' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ code: string; participantId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Host authentication is required.' }, { status: 401 });
    const { code, participantId } = await context.params;
    const result = await removeModeratedParticipant(code, user.id, participantId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not remove participant.' }, { status: 400 });
  }
}
