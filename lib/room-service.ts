import 'server-only';
import { randomInt } from 'node:crypto';
import { AVATARS, GROUP_CONTEXTS, disambiguateNickname, nicknameIssue, normalizeRoomCode } from './room-flow';
import { GAMES, LOCALES, TIME_PRESETS, type GameId, type Locale, type TimePreset } from './product';
import { createAdminClient } from './supabase/admin';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RANKING_VISIBILITY = ['podium','top10','public','private'] as const;

function configuredCodeLength() {
  const parsed = Number(process.env.ROOM_CODE_LENGTH ?? 6);
  return Number.isInteger(parsed) && parsed >= 4 && parsed <= 10 ? parsed : 6;
}

function configuredRoomTtlMinutes() {
  const parsed = Number(process.env.ROOM_TTL_MINUTES ?? 120);
  return Number.isFinite(parsed) && parsed >= 15 && parsed <= 1440 ? parsed : 120;
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
    }).select('id,join_code,status,room_language,context,host_cap,game_type,duration_minutes,allow_custom_photos,allow_late_join,ranking_visibility,expires_at').single();

    if (!error && data) return data;
    if (error?.code !== '23505') throw new Error(error?.message ?? 'Could not create room.');
  }
  throw new Error('Could not allocate a unique room code. Please try again.');
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

export async function joinRoom(input: JoinRoomInput) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: room, error: roomError } = await admin.from('rooms')
    .select('id,join_code,status,room_language,context,host_cap,game_type,duration_minutes,locked,allow_custom_photos,allow_late_join,ranking_visibility,expires_at')
    .eq('join_code', input.roomCode)
    .neq('status', 'closed')
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room not found or already closed.');
  if (room.expires_at && room.expires_at <= now) throw new Error('This room code has expired.');
  if (room.locked) throw new Error('This room is locked by the host.');
  if (room.status === 'results') throw new Error('This room is showing results. Wait for the host to start the next game.');
  if (room.status === 'playing' && !room.allow_late_join) throw new Error('Late joining is disabled for this room.');

  const classroomSafe = room.context === 'Classroom';
  const issue = nicknameIssue(input.nickname, classroomSafe);
  if (issue) throw new Error(issue);

  const { data: existing, error: existingError } = await admin.from('participants').select('nickname').eq('room_id', room.id);
  if (existingError) throw new Error(existingError.message);
  const nickname = disambiguateNickname(input.nickname, (existing ?? []).map((participant) => participant.nickname));
  const avatar = AVATARS.find((candidate) => candidate.id === input.avatarId)!;
  const role = room.status === 'playing' ? 'spectator' : 'participant';

  const { data: participant, error: participantError } = await admin.from('participants').insert({
    room_id: room.id,
    nickname,
    avatar_category: avatar.category,
    avatar_key: avatar.id,
    ui_language: input.uiLanguage,
    role,
    online: true,
    last_seen_at: now,
  }).select('id,session_token,nickname,avatar_category,avatar_key,ui_language,role,online').single();
  if (participantError || !participant) throw new Error(participantError?.message ?? 'Could not join room.');

  return { room, participant };
}

export async function reconnectParticipant(roomCodeValue: string, sessionToken: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms').select('id,join_code,status,game_type,duration_minutes,ranking_visibility').eq('join_code', roomCode).neq('status','closed').maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room) throw new Error('Room is no longer available.');

  const { data: participant, error } = await admin.from('participants')
    .update({ online: true, disconnected_at: null, last_seen_at: new Date().toISOString() })
    .eq('room_id', room.id)
    .eq('session_token', sessionToken)
    .select('id,session_token,nickname,avatar_category,avatar_key,ui_language,role,online')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!participant) throw new Error('Session identity could not be recovered.');
  return { room, participant };
}
