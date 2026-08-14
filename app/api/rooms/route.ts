import { NextResponse } from 'next/server';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { assertRelease1RoomPolicy } from '@/lib/release1-policy';
import { createRoom, parseCreateRoomInput } from '@/lib/room-service';
import { requireHostUser } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'Host sign-in is required to create a production room.' }, { status: 401 });
    await consumeServerRateLimit({ scope: 'room-create', identity: host.id, limit: 20, windowSeconds: 600, message: 'Too many rooms were created from this Host account. Try again later.' });
    const parsed = parseCreateRoomInput(await request.json());
    assertRelease1RoomPolicy(parsed);
    const room = await createRoom(host.id, { ...parsed, allowCustomPhotos: false });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create room.' }, { status: 400 });
  }
}
