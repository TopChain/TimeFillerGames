import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

export async function promoteMajorityLateJoin(roomCodeValue: string, authUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms')
    .select('id,status,game_type,allow_late_join,host_cap')
    .eq('join_code', roomCode)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room || room.game_type !== 'majority-match' || !room.allow_late_join || !['playing', 'paused'].includes(room.status)) return null;

  const { data: session, error: sessionError } = await admin.from('game_sessions')
    .select('id,state,status,started_at')
    .eq('room_id', room.id)
    .eq('game_type', 'majority-match')
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) throw new Error(sessionError.message);
  const phase = (session?.state as { phase?: unknown } | null)?.phase;
  if (!session || phase !== 'revealing') return null;

  const { data: participant, error: participantError } = await admin.from('participants')
    .select('id,role')
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .is('left_at', null)
    .maybeSingle();
  if (participantError) throw new Error(participantError.message);
  if (!participant || participant.role !== 'spectator') return null;

  if (room.host_cap !== null) {
    const { count, error: countError } = await admin.from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .is('left_at', null)
      .in('role', ['participant', 'cohost']);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= room.host_cap) return null;
  }

  const { data: promoted, error: updateError } = await admin.from('participants')
    .update({ role: 'participant', ready: false, last_seen_at: new Date().toISOString() })
    .eq('id', participant.id)
    .eq('room_id', room.id)
    .eq('role', 'spectator')
    .is('left_at', null)
    .select('id,role,ready')
    .maybeSingle();
  if (updateError) throw new Error(updateError.message);
  return promoted;
}
