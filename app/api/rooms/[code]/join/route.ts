import { NextResponse } from 'next/server';
import { joinRoom, parseJoinRoomInput } from '@/lib/room-service';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const input = parseJoinRoomInput({ ...body, roomCode: code });
    const result = await joinRoom(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not join room.' }, { status: 400 });
  }
}
