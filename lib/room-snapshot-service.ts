import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

const ROOM_SELECT = 'id,join_code,host_user_id,status,room_language,context,host_cap,game_type,duration_minutes,locked,allow_custom_photos,allow_late_join,ranking_visibility,room_theme,expires_at';

function heartbeatStaleSeconds() {
  const parsed = Number(process.env.HEARTBEAT_STALE_SECONDS ?? 35);
  return Number.isFinite(parsed) && parsed >= 15 && parsed <= 180 ? parsed : 35;
}

function reconnectGraceSeconds() {
  const parsed = Number(process.env.RECONNECT_GRACE_SECONDS ?? 60);
  return Number.isFinite(parsed) && parsed >= 20 && parsed <= 600 ? parsed : 60;
}

export async function loadRoomSnapshot(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms').select(ROOM_SELECT).eq('join_code', roomCode).maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room || room.status === 'closed') throw new Error('Room is no longer available.');

  const { data: viewer, error: viewerError } = await admin.from('participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('auth_user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  if (viewerError) throw new Error(viewerError.message);
  const isHost = room.host_user_id === userId;
  if (!isHost && !viewer) throw new Error('You are not a member of this room.');

  const { data: allParticipants, error } = await admin.from('participants')
    .select('id,auth_user_id,nickname,nickname_locked,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at,left_at,joined_at')
    .eq('room_id', room.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true });
  if (error) throw new Error(error.message);

  const nowMs = Date.now();
  const staleCutoff = nowMs - heartbeatStaleSeconds() * 1000;
  const staleIds = (allParticipants ?? [])
    .filter((participant) => participant.online && new Date(participant.last_seen_at).getTime() < staleCutoff)
    .map((participant) => participant.id);

  let staleTimestamp: string | null = null;
  if (staleIds.length) {
    staleTimestamp = new Date().toISOString();
    const { error: staleError } = await admin.from('participants')
      .update({ online: false, disconnected_at: staleTimestamp })
      .in('id', staleIds);
    if (staleError) throw new Error(staleError.message);
  }

  const normalized = (allParticipants ?? []).map((participant) => {
    const stale = staleIds.includes(participant.id);
    return {
      ...participant,
      online: participant.online && !stale,
      disconnected_at: stale ? staleTimestamp : participant.disconnected_at,
    };
  });

  const competitive = normalized.filter((participant) => participant.role === 'participant' || participant.role === 'cohost');
  const graceMs = reconnectGraceSeconds() * 1000;
  const counts = {
    active: competitive.filter((participant) => participant.online).length,
    online: normalized.filter((participant) => participant.online).length,
    ready: competitive.filter((participant) => participant.online && participant.ready).length,
    reconnecting: competitive.filter((participant) => !participant.online && participant.disconnected_at && nowMs - new Date(participant.disconnected_at).getTime() <= graceMs).length,
    spectators: normalized.filter((participant) => participant.role === 'spectator' && participant.online).length,
  };

  const visibleParticipants = isHost
    ? normalized
    : normalized.filter((participant) => participant.auth_user_id === userId);

  return {
    room,
    viewer: { isHost },
    counts,
    participants: visibleParticipants.map(({ auth_user_id: _authUserId, joined_at: _joinedAt, ...participant }) => participant),
  };
}
