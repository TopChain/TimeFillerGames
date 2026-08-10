import { NextResponse } from 'next/server';
import { promotePendingMajorityForLobby } from '@/lib/majority-late-join-service';
import { consumeServerRateLimit } from '@/lib/rate-limit-service';
import { parseHostRoomUpdate, updateRoomByHost } from '@/lib/room-service';
import { pauseRoomByHost, resumeRoomIfPaused } from '@/lib/room-pause-service';
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
    await consumeServerRateLimit({ scope: 'room-control', identity: host.id, resource: code, limit: 90, windowSeconds: 60, message: 'Too many Host room-control requests. Wait briefly and try again.' });
    const update = parseHostRoomUpdate(await request.json());
    const updateKeys = Object.keys(update);

    if (update.status === 'paused') {
      if (updateKeys.length !== 1) throw new Error('Pause the room separately from other room-setting changes.');
      const room = await pauseRoomByHost(code, host.id);
      return NextResponse.json({ room });
    }

    if (update.status === 'playing') {
      if (updateKeys.length !== 1) throw new Error('Resume the room separately from other room-setting changes.');
      const resumed = await resumeRoomIfPaused(code, host.id);
      if (resumed) return NextResponse.json({ room: resumed });
    }

    const room = await updateRoomByHost(code, host.id, update);
    if (update.status === 'lobby') await promotePendingMajorityForLobby(code, host.id);
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update room.' }, { status: 400 });
  }
}
