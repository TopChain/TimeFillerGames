import 'server-only';

import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

const ROOM_SELECT = 'id,join_code,host_user_id,status,room_language,context,host_cap,game_type,duration_minutes,locked,allow_custom_photos,allow_late_join,ranking_visibility,room_theme,expires_at';

type PausableState = Record<string, unknown> & {
  phase?: string;
  selectionDeadline?: string;
  deadline?: string;
  pauseStartedAt?: string | null;
  roundIndex?: number;
};

function shiftedIso(value: unknown, deltaMs: number) {
  if (typeof value !== 'string') return value;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  return new Date(time + deltaMs).toISOString();
}

async function hostRoom(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data, error } = await admin.from('rooms')
    .select(ROOM_SELECT)
    .eq('join_code', roomCode)
    .eq('host_user_id', hostUserId)
    .neq('status', 'closed')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Room not found, closed, or not owned by this Host.');
  return data;
}

async function latestLiveSession(roomId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('game_sessions')
    .select('id,game_type,state,status,started_at')
    .eq('room_id', roomId)
    .in('status', ['active', 'paused'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as null | { id: string; game_type: string; state: PausableState; status: 'active' | 'paused'; started_at: string | null };
}

export async function pauseRoomByHost(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  if (room.status === 'paused') return room;
  if (room.status !== 'playing') throw new Error('Only a playing room can be paused.');

  const session = await latestLiveSession(room.id);
  const now = new Date().toISOString();
  if (session && session.status === 'active') {
    const state: PausableState = { ...(session.state ?? {}), pauseStartedAt: now };
    const { error: sessionError } = await admin.from('game_sessions')
      .update({ status: 'paused', state })
      .eq('id', session.id)
      .eq('status', 'active');
    if (sessionError) throw new Error(sessionError.message);
  }

  const { data, error } = await admin.from('rooms')
    .update({ status: 'paused' })
    .eq('id', room.id)
    .eq('host_user_id', hostUserId)
    .eq('status', 'playing')
    .select(ROOM_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function resumeRoomIfPaused(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await hostRoom(roomCodeValue, hostUserId);
  if (room.status !== 'paused') return null;

  const session = await latestLiveSession(room.id);
  if (session && session.status === 'paused') {
    const nowMs = Date.now();
    const pauseStartedMs = session.state?.pauseStartedAt ? new Date(session.state.pauseStartedAt).getTime() : nowMs;
    const deltaMs = Number.isFinite(pauseStartedMs) ? Math.max(0, nowMs - pauseStartedMs) : 0;
    const state: PausableState = { ...(session.state ?? {}), pauseStartedAt: null };

    if (state.phase === 'card-selection' && typeof state.selectionDeadline === 'string') {
      state.selectionDeadline = shiftedIso(state.selectionDeadline, deltaMs) as string;
    }
    if ((state.phase === 'answering' || state.phase === 'drawing') && typeof state.deadline === 'string') {
      state.deadline = shiftedIso(state.deadline, deltaMs) as string;
    }

    if (session.game_type === 'quick-draw' && state.phase === 'drawing' && Number.isInteger(state.roundIndex) && typeof state.deadline === 'string') {
      const { error: roundError } = await admin.from('quick_draw_rounds')
        .update({ deadline: state.deadline })
        .eq('game_session_id', session.id)
        .eq('round_index', state.roundIndex as number)
        .eq('status', 'drawing');
      if (roundError) throw new Error(roundError.message);
    }

    const { error: sessionError } = await admin.from('game_sessions')
      .update({ status: 'active', state })
      .eq('id', session.id)
      .eq('status', 'paused');
    if (sessionError) throw new Error(sessionError.message);
  }

  const { data, error } = await admin.from('rooms')
    .update({ status: 'playing' })
    .eq('id', room.id)
    .eq('host_user_id', hostUserId)
    .eq('status', 'paused')
    .select(ROOM_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
