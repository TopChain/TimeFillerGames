import { NextResponse } from 'next/server';
import { createRoom, parseCreateRoomInput } from '@/lib/room-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'Host sign-in is required to create a production room.' }, { status: 401 });
    const input = parseCreateRoomInput(await request.json());
    const room = await createRoom(host.id, input);
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create room.' }, { status: 400 });
  }
}
