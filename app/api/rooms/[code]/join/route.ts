import { NextResponse } from 'next/server';
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
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not join room.' }, { status: 400 });
  }
}
