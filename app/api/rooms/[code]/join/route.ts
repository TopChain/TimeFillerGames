import { NextResponse } from 'next/server';
import { promoteMajorityLateJoin } from '@/lib/majority-late-join-service';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { joinRoom, parseJoinRoomInput } from '@/lib/room-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'A temporary guest session is required to join.' }, { status: 401 });
    const { code } = await context.params;
    await consumeServerRateLimit({ scope: 'room-join', identity: user.id, resource: code, limit: 12, windowSeconds: 60, message: 'Too many join attempts. Wait a moment and try again.' });
    const body = await request.json();
    const input = parseJoinRoomInput({ ...body, roomCode: code });
    const result = await joinRoom(user.id, input);
    const promoted = await promoteMajorityLateJoin(code, user.id);
    return NextResponse.json({
      ...result,
      participant: promoted ? { ...result.participant, role: promoted.role, ready: promoted.ready } : result.participant,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not join room.' }, { status: 400 });
  }
}
