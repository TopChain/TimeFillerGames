'use client';

import type { GameId, Locale, TimePreset } from './product';
import type { GroupContext, RankingVisibility } from './room-flow';

export type LiveRoom = {
  id: string;
  join_code: string;
  status: 'lobby' | 'playing' | 'paused' | 'results' | 'closed';
  room_language: Locale;
  context: GroupContext | null;
  host_cap: number | null;
  game_type: GameId;
  duration_minutes: TimePreset;
  locked: boolean;
  allow_custom_photos: boolean;
  allow_late_join: boolean;
  ranking_visibility: RankingVisibility;
  room_theme?: string;
  expires_at?: string | null;
};

export type ParticipantSession = {
  id: string;
  session_token: string;
  nickname: string;
  nickname_locked?: boolean;
  avatar_category: string | null;
  avatar_key: string | null;
  ui_language: Locale;
  role: 'host' | 'participant' | 'spectator' | 'cohost';
  ready: boolean;
  online: boolean;
  last_seen_at?: string;
  disconnected_at?: string | null;
};

export type PublicParticipant = Omit<ParticipantSession, 'session_token'> & { left_at?: string | null };

export type ModerationEvent = {
  id: string;
  participant_id: string | null;
  action: 'role_changed' | 'participant_removed' | 'nickname_overridden' | 'nickname_unlocked';
  details: Record<string, unknown>;
  created_at: string;
};

export type RoomSnapshot = {
  room: LiveRoom;
  viewer: { isHost: boolean };
  participants: PublicParticipant[];
  counts: {
    active: number;
    online: number;
    ready: number;
    reconnecting: number;
    spectators: number;
  };
};

type CreateRoomPayload = {
  minutes: TimePreset;
  context: GroupContext | null;
  gameId: GameId;
  hostCap: number | null;
  roomLanguage: Locale;
  allowCustomPhotos: boolean;
  allowLateJoin: boolean;
  rankingVisibility: RankingVisibility;
};

type JoinRoomPayload = {
  uiLanguage: Locale;
  avatarId: string;
  nickname: string;
};

type RoomUpdatePayload = Partial<{
  status: LiveRoom['status'];
  locked: boolean;
  allowCustomPhotos: boolean;
  allowLateJoin: boolean;
  rankingVisibility: RankingVisibility;
  gameId: GameId;
  minutes: TimePreset;
  context: GroupContext | null;
  hostCap: number | null;
  roomLanguage: Locale;
}>;

async function requestJson<T>(url: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export async function createLiveRoom(accessToken: string, input: CreateRoomPayload) {
  return requestJson<{ room: LiveRoom }>('/api/rooms', { method: 'POST', body: JSON.stringify(input) }, accessToken);
}

export async function joinLiveRoom(accessToken: string, roomCode: string, input: JoinRoomPayload) {
  return requestJson<{ room: LiveRoom; participant: ParticipantSession }>(`/api/rooms/${encodeURIComponent(roomCode)}/join`, { method: 'POST', body: JSON.stringify(input) }, accessToken);
}

export async function reconnectLiveRoom(accessToken: string, roomCode: string, sessionToken: string) {
  return requestJson<{ room: LiveRoom; participant: ParticipantSession }>(`/api/rooms/${encodeURIComponent(roomCode)}/reconnect`, { method: 'POST', body: JSON.stringify({ sessionToken }) }, accessToken);
}

export async function fetchRoomSnapshot(accessToken: string, roomCode: string) {
  return requestJson<RoomSnapshot>(`/api/rooms/${encodeURIComponent(roomCode)}`, { method: 'GET' }, accessToken);
}

export async function updateLiveRoom(accessToken: string, roomCode: string, input: RoomUpdatePayload) {
  return requestJson<{ room: LiveRoom }>(`/api/rooms/${encodeURIComponent(roomCode)}`, { method: 'PATCH', body: JSON.stringify(input) }, accessToken);
}

export async function heartbeatRoom(accessToken: string, roomCode: string, sessionToken: string) {
  return requestJson<{ ok: true; serverTime: string }>(`/api/rooms/${encodeURIComponent(roomCode)}/heartbeat`, { method: 'POST', body: JSON.stringify({ sessionToken }) }, accessToken);
}

export async function setReadyState(accessToken: string, roomCode: string, sessionToken: string, ready: boolean) {
  return requestJson<{ participant: ParticipantSession }>(`/api/rooms/${encodeURIComponent(roomCode)}/ready`, { method: 'POST', body: JSON.stringify({ sessionToken, ready }) }, accessToken);
}

export async function leaveLiveRoom(accessToken: string, roomCode: string, sessionToken: string) {
  return requestJson<{ ok: true }>(`/api/rooms/${encodeURIComponent(roomCode)}/leave`, { method: 'POST', body: JSON.stringify({ sessionToken }) }, accessToken);
}

export async function setParticipantRole(accessToken: string, roomCode: string, participantId: string, role: 'participant' | 'spectator') {
  return requestJson<{ participant: PublicParticipant }>(`/api/rooms/${encodeURIComponent(roomCode)}/participants/${encodeURIComponent(participantId)}`, { method: 'PATCH', body: JSON.stringify({ role }) }, accessToken);
}

export async function renameParticipant(accessToken: string, roomCode: string, participantId: string, nickname: string) {
  return requestJson<{ participant: PublicParticipant }>(`/api/rooms/${encodeURIComponent(roomCode)}/participants/${encodeURIComponent(participantId)}`, { method: 'PATCH', body: JSON.stringify({ nickname }) }, accessToken);
}

export async function unlockParticipantNickname(accessToken: string, roomCode: string, participantId: string) {
  return requestJson<{ participant: PublicParticipant }>(`/api/rooms/${encodeURIComponent(roomCode)}/participants/${encodeURIComponent(participantId)}`, { method: 'PATCH', body: JSON.stringify({ unlockNickname: true }) }, accessToken);
}

export async function removeParticipant(accessToken: string, roomCode: string, participantId: string) {
  return requestJson<{ ok: true; participantId: string; nickname: string }>(`/api/rooms/${encodeURIComponent(roomCode)}/participants/${encodeURIComponent(participantId)}`, { method: 'DELETE' }, accessToken);
}

export async function fetchModerationEvents(accessToken: string, roomCode: string) {
  return requestJson<{ events: ModerationEvent[] }>(`/api/rooms/${encodeURIComponent(roomCode)}/moderation`, { method: 'GET' }, accessToken);
}
