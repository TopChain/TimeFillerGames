import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

export async function setParticipantReady(roomCodeValue: string, authUserId: string, sessionToken: string, ready: boolean) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms')
    .select('id,status')
    .eq('join_code', roomCode)
    .neq('status', 'closed')
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room is no longer available.');
  if (room.status !== 'lobby') throw new Error('Ready status can only be changed in the lobby.');

  const { data: participant, error } = await admin.from('participants')
    .update({ ready, last_seen_at: new Date().toISOString(), online: true, disconnected_at: null })
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .eq('session_token', sessionToken)
    .eq('role', 'participant')
    .is('left_at', null)
    .select('id,session_token,nickname,avatar_category,avatar_key,ui_language,role,ready,online,last_seen_at,disconnected_at')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!participant) throw new Error('Only an active participant seat can be marked Ready.');
  return participant;
}
