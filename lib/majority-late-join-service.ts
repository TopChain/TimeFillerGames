import 'server-only';

import { majorityLateJoinDisposition } from './majority-late-join-rules';
import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

async function roomByCode(roomCodeValue: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error } = await admin.from('rooms')
    .select('id,host_user_id,status,game_type,allow_late_join,host_cap')
    .eq('join_code', roomCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return room;
}

async function activeMajorityRoom(roomCodeValue: string) {
  const room = await roomByCode(roomCodeValue);
  if (!room || room.game_type !== 'majority-match' || !room.allow_late_join || !['playing', 'paused'].includes(room.status)) return null;
  return room;
}

async function latestMajoritySession(roomId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('game_sessions')
    .select('id,config,state,status,started_at')
    .eq('room_id', roomId)
    .eq('game_type', 'majority-match')
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function availableParticipantSeats(roomId: string, hostCap: number | null) {
  if (hostCap === null) return Number.POSITIVE_INFINITY;
  const admin = createAdminClient();
  const { count, error } = await admin.from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .is('left_at', null)
    .in('role', ['participant', 'cohost']);
  if (error) throw new Error(error.message);
  return Math.max(0, hostCap - (count ?? 0));
}

async function promoteWaiting(roomId: string, hostCap: number | null) {
  const admin = createAdminClient();
  const { data: waiting, error: waitingError } = await admin.from('participants')
    .select('id,joined_at')
    .eq('room_id', roomId)
    .eq('role', 'spectator')
    .eq('pending_majority_activation', true)
    .is('left_at', null)
    .order('joined_at', { ascending: true });
  if (waitingError) throw new Error(waitingError.message);
  if (!waiting?.length) return { promoted: 0 };

  const seats = await availableParticipantSeats(roomId, hostCap);
  const promoteIds = waiting.slice(0, Number.isFinite(seats) ? seats : waiting.length).map((participant) => participant.id);
  if (!promoteIds.length) return { promoted: 0 };

  const { error: updateError } = await admin.from('participants')
    .update({ role: 'participant', ready: false, pending_majority_activation: false, last_seen_at: new Date().toISOString() })
    .in('id', promoteIds)
    .eq('room_id', roomId)
    .eq('role', 'spectator')
    .eq('pending_majority_activation', true)
    .is('left_at', null);
  if (updateError) throw new Error(updateError.message);
  return { promoted: promoteIds.length };
}

export async function promoteMajorityLateJoin(roomCodeValue: string, authUserId: string) {
  const admin = createAdminClient();
  const room = await activeMajorityRoom(roomCodeValue);
  if (!room) return null;
  const session = await latestMajoritySession(room.id);
  const state = session?.state as { phase?: unknown; roundIndex?: unknown } | null;
  const config = session?.config as { questionCount?: unknown } | null;
  const phase = String(state?.phase ?? '');
  if (!session) return null;

  const { data: participant, error: participantError } = await admin.from('participants')
    .select('id,role,ready')
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .is('left_at', null)
    .maybeSingle();
  if (participantError) throw new Error(participantError.message);
  if (!participant || participant.role !== 'spectator') return null;

  const roundIndex = Number(state?.roundIndex ?? 0);
  const questionCount = Number(config?.questionCount ?? 0);
  const seats = await availableParticipantSeats(room.id, room.host_cap);
  const disposition = majorityLateJoinDisposition({ phase, roundIndex, questionCount, availableSeats: seats });
  if (disposition === 'ignore') return null;

  if (disposition === 'promote') {
    const { data: promoted, error: updateError } = await admin.from('participants')
      .update({ role: 'participant', ready: false, pending_majority_activation: false, last_seen_at: new Date().toISOString() })
      .eq('id', participant.id)
      .eq('room_id', room.id)
      .eq('role', 'spectator')
      .is('left_at', null)
      .select('id,role,ready')
      .maybeSingle();
    if (updateError) throw new Error(updateError.message);
    return promoted;
  }

  const { data: queued, error: queueError } = await admin.from('participants')
    .update({ pending_majority_activation: true, ready: false, last_seen_at: new Date().toISOString() })
    .eq('id', participant.id)
    .eq('room_id', room.id)
    .eq('role', 'spectator')
    .is('left_at', null)
    .select('id,role,ready')
    .maybeSingle();
  if (queueError) throw new Error(queueError.message);
  return queued;
}

export async function promotePendingMajorityLateJoiners(roomCodeValue: string, hostUserId: string) {
  const room = await activeMajorityRoom(roomCodeValue);
  if (!room) return { promoted: 0 };
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can activate waiting Majority Match players.');

  const session = await latestMajoritySession(room.id);
  const state = session?.state as { phase?: unknown; roundIndex?: unknown } | null;
  const config = session?.config as { questionCount?: unknown } | null;
  if (!session) return { promoted: 0 };
  const seats = await availableParticipantSeats(room.id, room.host_cap);
  const disposition = majorityLateJoinDisposition({
    phase: String(state?.phase ?? ''),
    roundIndex: Number(state?.roundIndex ?? 0),
    questionCount: Number(config?.questionCount ?? 0),
    availableSeats: seats,
  });
  if (disposition !== 'promote') return { promoted: 0 };

  return promoteWaiting(room.id, room.host_cap);
}

export async function promotePendingMajorityForLobby(roomCodeValue: string, hostUserId: string) {
  const room = await roomByCode(roomCodeValue);
  if (!room || room.game_type !== 'majority-match' || room.status !== 'lobby') return { promoted: 0 };
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can activate waiting Majority Match players.');
  return promoteWaiting(room.id, room.host_cap);
}
