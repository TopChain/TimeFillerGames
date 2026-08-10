import { NextResponse } from 'next/server';
import { parseHostRoomUpdate, updateRoomByHost } from '@/lib/room-service';
import { loadRoomSnapshot } from '@/lib/room-snapshot-service';
import { requireHostUser, requireUser } from '@/lib/supabase/auth';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication is required to view room state.' }, { status: 401 });
    const { code } = await context.params;
    const snapshot = await loadRoomSnapshot(code, user.id);
    return NextResponse.json(snapshot, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load room.' }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const host = await requireHostUser(request);
    if (!host) return NextResponse.json({ error: 'A signed-in Host is required to update the room.' }, { status: 401 });
    const { code } = await context.params;
    const update = parseHostRoomUpdate(await request.json());
    const room = await updateRoomByHost(code, host.id, update);
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update room.' }, { status: 400 });
  }
}
