import 'server-only';

import { disambiguateNickname, nicknameIssue, normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

type ModerationRole = 'participant' | 'spectator';

async function hostRoom(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error } = await admin.from('rooms')
    .select('id,join_code,host_user_id,status,host_cap,context')
    .eq('join_code', roomCode)
    .neq('status', 'closed')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!room) throw new Error('Room is no longer available.');
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can moderate this room.');
  return room;
}

async function activeTarget(roomId: string, participantId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants')
    .select('id,nickname,role,online,left_at,nickname_locked')
    .eq('room_id', roomId)
    .eq('id', participantId)
    .is('left_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('This participant is no longer in the room.');
  return data;
}

async function writeModerationEvent(input: {
  roomId: string;
  actorUserId: string;
  participantId?: string | null;
  action: 'role_changed' | 'participant_removed' | 'nickname_overridden' | 'nickname_unlocked';
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('moderation_events').insert({
    room_id: input.roomId,
    actor_user_id: input.actorUserId,
    participant_id: input.participantId ?? null,
    action: input.action,
    details: input.details ?? {},
  });
  if (error) console.error('Moderation audit write failed', { action: input.action, roomId: input.roomId, participantId: input.participantId ?? null, message: error.message });
}

export async function setModeratedParticipantRole(roomCodeValue: string, hostUserId: string, participantId: string, role: ModerationRole) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  if (room.status !== 'lobby') throw new Error('Participant/spectator role changes are only allowed in the lobby.');
  const target = await activeTarget(room.id, participantId);

  if (role === 'participant' && target.role !== 'participant' && target.role !== 'cohost') {
    if (room.host_cap !== null) {
      const { count, error } = await admin.from('participants')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .is('left_at', null)
        .in('role', ['participant', 'cohost']);
      if (error) throw new Error(error.message);
      if ((count ?? 0) >= room.host_cap) throw new Error('The Host participant cap is already full. Raise the cap or move another player to spectator first.');
    }
  }

  const { data, error } = await admin.from('participants')
    .update({ role, ready: false, pending_majority_activation: false, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null)
    .select('id,nickname,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at')
    .single();
  if (error) throw new Error(error.message);
  await writeModerationEvent({ roomId: room.id, actorUserId: hostUserId, participantId: target.id, action: 'role_changed', details: { from: target.role, to: role } });
  return data;
}

export async function renameModeratedParticipant(roomCodeValue: string, hostUserId: string, participantId: string, nicknameValue: unknown) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  const target = await activeTarget(room.id, participantId);
  const requested = String(nicknameValue ?? '').trim();
  const issue = nicknameIssue(requested, room.context === 'Classroom');
  if (issue) throw new Error(issue);

  const { data: names, error: namesError } = await admin.from('participants')
    .select('id,nickname')
    .eq('room_id', room.id)
    .is('left_at', null);
  if (namesError) throw new Error(namesError.message);
  const nickname = disambiguateNickname(requested, (names ?? []).filter((participant) => participant.id !== target.id).map((participant) => participant.nickname));

  const { data, error } = await admin.from('participants')
    .update({ nickname, nickname_locked: true, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null)
    .select('id,nickname,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at')
    .single();
  if (error) throw new Error(error.message);
  await writeModerationEvent({ roomId: room.id, actorUserId: hostUserId, participantId: target.id, action: 'nickname_overridden', details: { from: target.nickname, to: nickname } });
  return data;
}

export async function unlockModeratedNickname(roomCodeValue: string, hostUserId: string, participantId: string) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  const target = await activeTarget(room.id, participantId);
  const { data, error } = await admin.from('participants')
    .update({ nickname_locked: false, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null)
    .select('id,nickname,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at')
    .single();
  if (error) throw new Error(error.message);
  await writeModerationEvent({ roomId: room.id, actorUserId: hostUserId, participantId: target.id, action: 'nickname_unlocked', details: { nickname: target.nickname } });
  return data;
}

export async function removeModeratedParticipant(roomCodeValue: string, hostUserId: string, participantId: string) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  const target = await activeTarget(room.id, participantId);
  const now = new Date().toISOString();
  const { error } = await admin.from('participants')
    .update({ left_at: now, online: false, ready: false, pending_majority_activation: false, disconnected_at: null, last_seen_at: now })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null);
  if (error) throw new Error(error.message);
  await writeModerationEvent({ roomId: room.id, actorUserId: hostUserId, participantId: target.id, action: 'participant_removed', details: { nickname: target.nickname, role: target.role } });
  return { ok: true as const, participantId: target.id, nickname: target.nickname };
}

export async function listModerationEvents(roomCodeValue: string, hostUserId: string, limit = 30) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const { data, error } = await admin.from('moderation_events')
    .select('id,participant_id,action,details,created_at')
    .eq('room_id', room.id)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
