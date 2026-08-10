import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

type ModerationRole = 'participant' | 'spectator';

async function hostRoom(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error } = await admin.from('rooms')
    .select('id,join_code,host_user_id,status,host_cap')
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
    .select('id,nickname,role,online,left_at')
    .eq('room_id', roomId)
    .eq('id', participantId)
    .is('left_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('This participant is no longer in the room.');
  return data;
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
    .update({ role, ready: false, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null)
    .select('id,nickname,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeModeratedParticipant(roomCodeValue: string, hostUserId: string, participantId: string) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  const target = await activeTarget(room.id, participantId);
  const now = new Date().toISOString();
  const { error } = await admin.from('participants')
    .update({ left_at: now, online: false, ready: false, disconnected_at: null, last_seen_at: now })
    .eq('room_id', room.id)
    .eq('id', target.id)
    .is('left_at', null);
  if (error) throw new Error(error.message);
  return { ok: true as const, participantId: target.id, nickname: target.nickname };
}
