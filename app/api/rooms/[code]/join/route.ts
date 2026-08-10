import { NextResponse } from 'next/server';
import { promoteMajorityLateJoin } from '@/lib/majority-late-join-service';
import { joinRoom, parseJoinRoomInput } from '@/lib/room-service';
import { requireUser } from '@/lib/supabase/auth';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'A temporary guest session is required to join.' }, { status: 401 });
    const { code } = await context.params;
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
