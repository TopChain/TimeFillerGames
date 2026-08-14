import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { pauseRoomByHost } from './room-pause-service';
import { createAdminClient } from './supabase/admin';

function recoveryGraceSeconds() {
  const parsed = Number(process.env.HOST_RECOVERY_GRACE_SECONDS ?? 45);
  return Number.isFinite(parsed) && parsed >= 30 && parsed <= 300 ? parsed : 45;
}

async function openRoom(roomCodeValue: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data, error } = await admin.from('rooms')
    .select('id,join_code,host_user_id,host_last_seen_at,host_transfer_generation,status,host_cap')
    .eq('join_code', roomCode)
    .neq('status', 'closed')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Room is no longer available.');
  return data;
}

async function auditRoleChange(roomId: string, actorUserId: string, participantId: string, from: string, to: string, reason: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('moderation_events').insert({
    room_id: roomId,
    actor_user_id: actorUserId,
    participant_id: participantId,
    action: 'role_changed',
    details: { from, to, reason },
  });
  if (error) console.error('Co-host audit write failed', { roomId, participantId, message: error.message });
}

export async function heartbeatHost(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const now = new Date().toISOString();
  const { data, error } = await admin.from('rooms')
    .update({ host_last_seen_at: now })
    .eq('join_code', roomCode)
    .eq('host_user_id', hostUserId)
    .neq('status', 'closed')
    .select('id,join_code,status,host_last_seen_at,host_transfer_generation')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Room not found, closed, or no longer owned by this Host.');
  return { ok: true as const, serverTime: now, room: data };
}

export async function designateCoHost(roomCodeValue: string, hostUserId: string, participantId: string) {
  const admin = createAdminClient();
  const room = await openRoom(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the current Host can designate a co-host.');
  if (room.status !== 'lobby') throw new Error('Choose a co-host before the game starts.');

  const { data: target, error: targetError } = await admin.from('participants')
    .select('id,nickname,role,auth_user_id,left_at')
    .eq('room_id', room.id)
    .eq('id', participantId)
    .is('left_at', null)
    .maybeSingle();
  if (targetError) throw new Error(targetError.message);
  if (!target) throw new Error('This participant is no longer in the room.');
  if (target.role !== 'participant' && target.role !== 'cohost') throw new Error('Only an active participant can be designated as co-host.');
  if (!target.auth_user_id) throw new Error('This participant does not have a recoverable authenticated seat.');

  const { data: existing, error: existingError } = await admin.from('participants')
    .select('id,nickname,role')
    .eq('room_id', room.id)
    .eq('role', 'cohost')
    .is('left_at', null);
  if (existingError) throw new Error(existingError.message);

  for (const current of existing ?? []) {
    if (current.id === target.id) continue;
    const { error } = await admin.from('participants')
      .update({ role: 'participant', ready: false, last_seen_at: new Date().toISOString() })
      .eq('id', current.id)
      .eq('room_id', room.id)
      .eq('role', 'cohost');
    if (error) throw new Error(error.message);
    await auditRoleChange(room.id, hostUserId, current.id, 'cohost', 'participant', 'cohost_replaced');
  }

  if (target.role !== 'cohost') {
    const { error } = await admin.from('participants')
      .update({ role: 'cohost', ready: false, pending_majority_activation: false, last_seen_at: new Date().toISOString() })
      .eq('id', target.id)
      .eq('room_id', room.id)
      .is('left_at', null);
    if (error) throw new Error(error.message);
    await auditRoleChange(room.id, hostUserId, target.id, target.role, 'cohost', 'host_designated_recovery_cohost');
  }

  return { participantId: target.id, nickname: target.nickname, role: 'cohost' as const };
}

export async function revokeCoHost(roomCodeValue: string, hostUserId: string, participantId: string) {
  const admin = createAdminClient();
  const room = await openRoom(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the current Host can revoke a co-host.');
  if (room.status !== 'lobby') throw new Error('Co-host changes are only allowed in the lobby.');
  const { data, error } = await admin.from('participants')
    .update({ role: 'participant', ready: false, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('id', participantId)
    .eq('role', 'cohost')
    .is('left_at', null)
    .select('id,nickname')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('That seat is not the current co-host.');
  await auditRoleChange(room.id, hostUserId, data.id, 'cohost', 'participant', 'cohost_revoked');
  return { participantId: data.id, nickname: data.nickname, role: 'participant' as const };
}

export async function getHostRecoveryState(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const room = await openRoom(roomCodeValue);
  const cutoffMs = Date.now() - recoveryGraceSeconds() * 1000;
  const hostSeenMs = new Date(room.host_last_seen_at).getTime();
  const { data: cohost, error } = await admin.from('participants')
    .select('id,nickname,auth_user_id,online,last_seen_at')
    .eq('room_id', room.id)
    .eq('role', 'cohost')
    .is('left_at', null)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const isHost = room.host_user_id === userId;
  const isCoHost = cohost?.auth_user_id === userId;
  return {
    isHost,
    isCoHost,
    canClaim: Boolean(isCoHost && hostSeenMs <= cutoffMs),
    hostLastSeenAt: room.host_last_seen_at,
    recoveryGraceSeconds: recoveryGraceSeconds(),
    transferGeneration: room.host_transfer_generation,
    cohost: cohost ? { id: cohost.id, nickname: cohost.nickname, online: cohost.online } : null,
  };
}

export async function claimHostAfterDisconnect(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const room = await openRoom(roomCodeValue);
  const { data: cohost, error: cohostError } = await admin.from('participants')
    .select('id,nickname,role,auth_user_id')
    .eq('room_id', room.id)
    .eq('auth_user_id', userId)
    .eq('role', 'cohost')
    .is('left_at', null)
    .maybeSingle();
  if (cohostError) throw new Error(cohostError.message);
  if (!cohost) throw new Error('Only the designated co-host can recover this room.');

  const cutoff = new Date(Date.now() - recoveryGraceSeconds() * 1000).toISOString();
  if (room.host_last_seen_at > cutoff) throw new Error('The Host is still within the recovery grace period.');

  const now = new Date().toISOString();
  const { data: transferred, error } = await admin.from('rooms')
    .update({
      host_user_id: userId,
      host_last_seen_at: now,
      host_transfer_generation: room.host_transfer_generation + 1,
    })
    .eq('id', room.id)
    .eq('host_user_id', room.host_user_id)
    .lte('host_last_seen_at', cutoff)
    .neq('status', 'closed')
    .select('id,join_code,status,host_user_id,host_last_seen_at,host_transfer_generation')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!transferred) throw new Error('Another recovery action already completed or the Host reconnected.');

  if (transferred.status === 'playing') await pauseRoomByHost(transferred.join_code, userId);

  const { error: roleError } = await admin.from('participants')
    .update({ role: 'participant', ready: false, last_seen_at: now })
    .eq('id', cohost.id)
    .eq('room_id', room.id)
    .eq('role', 'cohost');
  if (roleError) throw new Error(roleError.message);

  await auditRoleChange(room.id, userId, cohost.id, 'cohost', 'participant', 'host_ownership_recovered');
  return { roomCode: transferred.join_code, paused: transferred.status === 'playing', transferGeneration: transferred.host_transfer_generation };
}
