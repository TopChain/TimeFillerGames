import 'server-only';
import { randomInt } from 'node:crypto';
import { AVATARS, GROUP_CONTEXTS, disambiguateNickname, nicknameIssue, normalizeRoomCode } from './room-flow';
import { GAMES, LOCALES, TIME_PRESETS, type GameId, type Locale, type TimePreset } from './product';
import { createAdminClient } from './supabase/admin';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RANKING_VISIBILITY = ['podium','top10','public','private'] as const;
const ROOM_STATUSES = ['lobby','playing','paused','results','closed'] as const;
const ROOM_SELECT = 'id,join_code,host_user_id,status,room_language,context,host_cap,game_type,duration_minutes,locked,allow_custom_photos,allow_late_join,ranking_visibility,room_theme,expires_at';

function configuredCodeLength() {
  const parsed = Number(process.env.ROOM_CODE_LENGTH ?? 6);
  return Number.isInteger(parsed) && parsed >= 4 && parsed <= 10 ? parsed : 6;
}

function configuredRoomTtlMinutes() {
  const parsed = Number(process.env.ROOM_TTL_MINUTES ?? 120);
  return Number.isFinite(parsed) && parsed >= 15 && parsed <= 1440 ? parsed : 120;
}

function configuredHeartbeatStaleSeconds() {
  const parsed = Number(process.env.HEARTBEAT_STALE_SECONDS ?? 35);
  return Number.isFinite(parsed) && parsed >= 15 && parsed <= 180 ? parsed : 35;
}

function configuredReconnectGraceSeconds() {
  const parsed = Number(process.env.RECONNECT_GRACE_SECONDS ?? 60);
  return Number.isFinite(parsed) && parsed >= 20 && parsed <= 600 ? parsed : 60;
}

export function generateRoomCode(length = configuredCodeLength()) {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('');
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.some((locale) => locale.id === value);
}
function isTimePreset(value: unknown): value is TimePreset {
  return typeof value === 'number' && TIME_PRESETS.includes(value as TimePreset);
}
function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && GAMES.some((game) => game.id === value);
}

export type CreateRoomInput = {
  minutes: TimePreset;
  context: string | null;
  gameId: GameId;
  hostCap: number | null;
  roomLanguage: Locale;
  allowCustomPhotos: boolean;
  allowLateJoin: boolean;
  rankingVisibility: (typeof RANKING_VISIBILITY)[number];
};

export function parseCreateRoomInput(value: unknown): CreateRoomInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid room settings.');
  const input = value as Record<string, unknown>;
  if (!isTimePreset(input.minutes)) throw new Error('Choose 3, 5, 8, or 10 minutes.');
  if (!isGameId(input.gameId)) throw new Error('Choose a supported game.');
  if (!isLocale(input.roomLanguage)) throw new Error('Choose a supported room language.');
  const context = input.context === null || input.context === undefined ? null : String(input.context);
  if (context !== null && !(GROUP_CONTEXTS as readonly string[]).includes(context)) throw new Error('Choose a supported group context.');
  const hostCap = input.hostCap === null || input.hostCap === undefined || input.hostCap === '' ? null : Number(input.hostCap);
  if (hostCap !== null && (!Number.isInteger(hostCap) || hostCap < 1)) throw new Error('Host participant cap must be a positive whole number.');
  if (!RANKING_VISIBILITY.includes(input.rankingVisibility as (typeof RANKING_VISIBILITY)[number])) throw new Error('Choose a supported ranking visibility.');
  return {
    minutes: input.minutes,
    context,
    gameId: input.gameId,
    hostCap,
    roomLanguage: input.roomLanguage,
    allowCustomPhotos: Boolean(input.allowCustomPhotos),
    allowLateJoin: Boolean(input.allowLateJoin),
    rankingVisibility: input.rankingVisibility as CreateRoomInput['rankingVisibility'],
  };
}

export type HostRoomUpdate = Partial<CreateRoomInput> & {
  status?: (typeof ROOM_STATUSES)[number];
  locked?: boolean;
};

export function parseHostRoomUpdate(value: unknown): HostRoomUpdate {
  if (!value || typeof value !== 'object') throw new Error('Invalid room update.');
  const input = value as Record<string, unknown>;
  const update: HostRoomUpdate = {};
  if ('status' in input) {
    if (!ROOM_STATUSES.includes(input.status as (typeof ROOM_STATUSES)[number])) throw new Error('Unsupported room status.');
    update.status = input.status as HostRoomUpdate['status'];
  }
  if ('locked' in input) update.locked = Boolean(input.locked);
  if ('minutes' in input) {
    if (!isTimePreset(input.minutes)) throw new Error('Choose 3, 5, 8, or 10 minutes.');
    update.minutes = input.minutes;
  }
  if ('gameId' in input) {
    if (!isGameId(input.gameId)) throw new Error('Choose a supported game.');
    update.gameId = input.gameId;
  }
  if ('roomLanguage' in input) {
    if (!isLocale(input.roomLanguage)) throw new Error('Choose a supported room language.');
    update.roomLanguage = input.roomLanguage;
  }
  if ('context' in input) {
    const context = input.context === null ? null : String(input.context);
    if (context !== null && !(GROUP_CONTEXTS as readonly string[]).includes(context)) throw new Error('Choose a supported group context.');
    update.context = context;
  }
  if ('hostCap' in input) {
    const cap = input.hostCap === null || input.hostCap === '' ? null : Number(input.hostCap);
    if (cap !== null && (!Number.isInteger(cap) || cap < 1)) throw new Error('Host participant cap must be a positive whole number.');
    update.hostCap = cap;
  }
  if ('allowCustomPhotos' in input) update.allowCustomPhotos = Boolean(input.allowCustomPhotos);
  if ('allowLateJoin' in input) update.allowLateJoin = Boolean(input.allowLateJoin);
  if ('rankingVisibility' in input) {
    if (!RANKING_VISIBILITY.includes(input.rankingVisibility as (typeof RANKING_VISIBILITY)[number])) throw new Error('Choose a supported ranking visibility.');
    update.rankingVisibility = input.rankingVisibility as HostRoomUpdate['rankingVisibility'];
  }
  return update;
}

function databaseRoomUpdate(input: HostRoomUpdate) {
  const update: Record<string, unknown> = {};
  if (input.status !== undefined) update.status = input.status;
  if (input.locked !== undefined) update.locked = input.locked;
  if (input.minutes !== undefined) update.duration_minutes = input.minutes;
  if (input.gameId !== undefined) update.game_type = input.gameId;
  if (input.roomLanguage !== undefined) update.room_language = input.roomLanguage;
  if (input.context !== undefined) update.context = input.context;
  if (input.hostCap !== undefined) update.host_cap = input.hostCap;
  if (input.allowCustomPhotos !== undefined) update.allow_custom_photos = input.allowCustomPhotos;
  if (input.allowLateJoin !== undefined) update.allow_late_join = input.allowLateJoin;
  if (input.rankingVisibility !== undefined) update.ranking_visibility = input.rankingVisibility;
  return update;
}

export async function createRoom(hostUserId: string, input: CreateRoomInput) {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + configuredRoomTtlMinutes() * 60_000).toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const joinCode = generateRoomCode();
    const { data, error } = await admin.from('rooms').insert({
      join_code: joinCode,
      host_user_id: hostUserId,
      status: 'lobby',
      room_language: input.roomLanguage,
      context: input.context,
      host_cap: input.hostCap,
      game_type: input.gameId,
      duration_minutes: input.minutes,
      allow_custom_photos: input.allowCustomPhotos,
      allow_late_join: input.allowLateJoin,
      ranking_visibility: input.rankingVisibility,
      expires_at: expiresAt,
    }).select(ROOM_SELECT).single();

    if (!error && data) return data;
    if (error?.code !== '23505') throw new Error(error?.message ?? 'Could not create room.');
  }
  throw new Error('Could not allocate a unique room code. Please try again.');
}

export async function updateRoomByHost(roomCodeValue: string, hostUserId: string, input: HostRoomUpdate) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const dbUpdate = databaseRoomUpdate(input);
  if (!Object.keys(dbUpdate).length) throw new Error('No supported room changes were supplied.');
  const { data, error } = await admin.from('rooms')
    .update(dbUpdate)
    .eq('join_code', roomCode)
    .eq('host_user_id', hostUserId)
    .neq('status', 'closed')
    .select(ROOM_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Room not found, closed, or not owned by this host.');
  return data;
}

export type JoinRoomInput = { roomCode: string; uiLanguage: Locale; avatarId: string; nickname: string };

export function parseJoinRoomInput(value: unknown): JoinRoomInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid join request.');
  const input = value as Record<string, unknown>;
  const roomCode = normalizeRoomCode(String(input.roomCode ?? ''));
  if (roomCode.length < 4 || roomCode.length > 10) throw new Error('Enter a valid room code.');
  if (!isLocale(input.uiLanguage)) throw new Error('Choose a supported interface language.');
  const avatarId = String(input.avatarId ?? '');
  if (!AVATARS.some((avatar) => avatar.id === avatarId)) throw new Error('Choose a built-in avatar.');
  const nickname = String(input.nickname ?? '').trim();
  return { roomCode, uiLanguage: input.uiLanguage, avatarId, nickname };
}

export async function joinRoom(authUserId: string, input: JoinRoomInput) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: room, error: roomError } = await admin.from('rooms')
    .select(ROOM_SELECT)
    .eq('join_code', input.roomCode)
    .neq('status', 'closed')
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room not found or already closed.');
  if (room.expires_at && room.expires_at <= now) throw new Error('This room code has expired.');
  if (room.locked) throw new Error('This room is locked by the host.');
  if (room.status === 'results') throw new Error('This room is showing results. Wait for the host to start the next game.');
  if ((room.status === 'playing' || room.status === 'paused') && !room.allow_late_join) throw new Error('Late joining is disabled for this room.');

  const classroomSafe = room.context === 'Classroom';
  const issue = nicknameIssue(input.nickname, classroomSafe);
  if (issue) throw new Error(issue);

  const { data: priorIdentity } = await admin.from('participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .is('left_at', null)
    .maybeSingle();
  if (priorIdentity) throw new Error('This browser already has a seat in the room. Reconnect instead of joining again.');

  const { data: existing, error: existingError } = await admin.from('participants').select('nickname,role,left_at').eq('room_id', room.id);
  if (existingError) throw new Error(existingError.message);
  const nickname = disambiguateNickname(input.nickname, (existing ?? []).filter((participant) => !participant.left_at).map((participant) => participant.nickname));
  const avatar = AVATARS.find((candidate) => candidate.id === input.avatarId)!;

  const activeSeats = (existing ?? []).filter((participant) => !participant.left_at && participant.role !== 'spectator').length;
  const game = GAMES.find((candidate) => candidate.id === room.game_type);
  const capReached = room.host_cap !== null && activeSeats >= room.host_cap;
  const midGame = room.status === 'playing' || room.status === 'paused';
  if ((capReached || midGame) && !game?.spectator) throw new Error('This room has no active-player seat available for the selected game.');
  const role = capReached || midGame ? 'spectator' : 'participant';

  const { data: participant, error: participantError } = await admin.from('participants').insert({
    room_id: room.id,
    auth_user_id: authUserId,
    nickname,
    avatar_category: avatar.category,
    avatar_key: avatar.id,
    ui_language: input.uiLanguage,
    role,
    online: true,
    last_seen_at: now,
    disconnected_at: null,
    left_at: null,
  }).select('id,session_token,nickname,avatar_category,avatar_key,ui_language,role,online,last_seen_at,disconnected_at').single();
  if (participantError || !participant) throw new Error(participantError?.message ?? 'Could not join room.');

  return { room, participant };
}

export async function reconnectParticipant(roomCodeValue: string, sessionToken: string, authUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms').select(ROOM_SELECT).eq('join_code', roomCode).neq('status','closed').maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room is no longer available.');

  const { data: participant, error } = await admin.from('participants')
    .update({ online: true, disconnected_at: null, left_at: null, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .eq('session_token', sessionToken)
    .select('id,session_token,nickname,avatar_category,avatar_key,ui_language,role,online,last_seen_at,disconnected_at')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!participant) throw new Error('Session identity could not be recovered.');
  return { room, participant };
}

async function authorizeRoomMember(room: { id: string; host_user_id: string | null }, userId: string) {
  if (room.host_user_id === userId) return true;
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants')
    .select('id')
    .eq('room_id', room.id)
    .eq('auth_user_id', userId)
    .is('left_at', null)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function getRoomSnapshot(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms').select(ROOM_SELECT).eq('join_code', roomCode).maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room || room.status === 'closed') throw new Error('Room is no longer available.');
  if (!(await authorizeRoomMember(room, userId))) throw new Error('You are not a member of this room.');

  const { data: participants, error } = await admin.from('participants')
    .select('id,nickname,avatar_category,avatar_key,ui_language,role,online,last_seen_at,disconnected_at,left_at')
    .eq('room_id', room.id)
    .order('joined_at', { ascending: true });
  if (error) throw new Error(error.message);

  const nowMs = Date.now();
  const staleBefore = nowMs - configuredHeartbeatStaleSeconds() * 1000;
  const graceMs = configuredReconnectGraceSeconds() * 1000;
  const staleIds = (participants ?? [])
    .filter((participant) => participant.online && new Date(participant.last_seen_at).getTime() < staleBefore)
    .map((participant) => participant.id);

  if (staleIds.length) {
    const disconnectedAt = new Date().toISOString();
    await admin.from('participants').update({ online: false, disconnected_at: disconnectedAt }).in('id', staleIds);
  }

  const normalizedParticipants = (participants ?? []).filter((participant) => !participant.left_at).map((participant) => {
    const stale = staleIds.includes(participant.id);
    const online = participant.online && !stale;
    const disconnectedAt = stale ? new Date().toISOString() : participant.disconnected_at;
    return { ...participant, online, disconnected_at: disconnectedAt };
  });

  const isActiveRole = (role: string) => role === 'participant' || role === 'cohost';
  const online = normalizedParticipants.filter((participant) => participant.online).length;
  const active = normalizedParticipants.filter((participant) => participant.online && isActiveRole(participant.role)).length;
  const reconnecting = normalizedParticipants.filter((participant) => {
    if (participant.online || !isActiveRole(participant.role) || !participant.disconnected_at) return false;
    return nowMs - new Date(participant.disconnected_at).getTime() <= graceMs;
  }).length;
  const spectators = normalizedParticipants.filter((participant) => participant.role === 'spectator' && participant.online).length;

  return { room, participants: normalizedParticipants, counts: { active, online, reconnecting, spectators } };
}

export async function heartbeatParticipant(roomCodeValue: string, sessionToken: string, authUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms').select('id,status').eq('join_code', roomCode).neq('status','closed').maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room is no longer available.');
  const serverTime = new Date().toISOString();
  const { data, error } = await admin.from('participants')
    .update({ online: true, disconnected_at: null, last_seen_at: serverTime })
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .eq('session_token', sessionToken)
    .is('left_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Participant session is no longer active.');
  return { ok: true as const, serverTime };
}

export async function leaveParticipant(roomCodeValue: string, sessionToken: string, authUserId: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room } = await admin.from('rooms').select('id').eq('join_code', roomCode).maybeSingle();
  if (!room) return;
  const now = new Date().toISOString();
  await admin.from('participants')
    .update({ online: false, disconnected_at: now, left_at: now })
    .eq('room_id', room.id)
    .eq('auth_user_id', authUserId)
    .eq('session_token', sessionToken);
}
