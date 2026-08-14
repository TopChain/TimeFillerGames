'use client';

import type { QuickDrawCategory, QuickDrawDifficulty } from './quick-draw-content';

export type QuickDrawSnapshot = {
  room: { joinCode: string; status: string; rankingVisibility: string };
  session: {
    id: string;
    status: 'active' | 'paused' | 'ended';
    config: {
      drawingSeconds: number;
      artistTurns: number;
      artistSelection: 'random' | 'join-order';
      wordCategory: QuickDrawCategory;
      wordDifficulty: QuickDrawDifficulty;
      guessVisibility: 'hidden-until-correct' | 'moderated-stream';
      audienceGuessing: boolean;
      timeBonus: boolean;
    };
    state: {
      phase: 'drawing' | 'revealing' | 'ended';
      roundIndex: number;
      artistSequence: string[];
      currentArtistId: string;
      currentArtistNickname: string;
      deadline: string;
      pauseStartedAt?: string | null;
      revealWord: string | null;
    };
    artist: { participantId: string; nickname: string; isSelf: boolean };
    secretWord: string | null;
    strokes: Array<{ sequence: number; payload: { type: 'clear' } | { type: 'stroke'; points: Array<{ x: number; y: number }>; width: number } }>;
    strokesAreDelta?: boolean;
    correctGuessers: Array<{ participant_id: string; nickname: string; points: number; created_at: string }>;
    ownGuesses: Array<{ guess: string; accepted: boolean; points_awarded: number; created_at: string }>;
    hostGuessStream: Array<{ guess: string; accepted: boolean; nickname: string; created_at: string }>;
    rankings: Array<{ participant_id: string; nickname: string; avatarKey: string | null; role: string; points: number; placement: number }>;
    ownResult: null | { participant_id: string; nickname: string; avatarKey: string | null; role: string; points: number; placement: number };
  };
};

type Stroke = QuickDrawSnapshot['session']['strokes'][number];
type StrokeCacheEntry = { sessionId: string; roundIndex: number; strokes: Stroke[] };
const strokeCache = new Map<string, StrokeCacheEntry>();

async function request<T>(url: string, accessToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${accessToken}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `Quick Draw request failed (${response.status}).`);
  return payload as T;
}

function base(roomCode: string) {
  return `/api/rooms/${encodeURIComponent(roomCode)}/games/quick-draw`;
}

function cacheKey(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

export function compactQuickDrawStrokes(strokes: Stroke[]) {
  let lastClear = -1;
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    if (strokes[index].payload.type === 'clear') { lastClear = index; break; }
  }
  return lastClear >= 0 ? strokes.slice(lastClear) : strokes;
}

function rememberSnapshot(roomCode: string, snapshot: QuickDrawSnapshot) {
  const key = cacheKey(roomCode);
  const prior = strokeCache.get(key);
  let strokes = snapshot.session.strokes;

  if (snapshot.session.strokesAreDelta && prior
      && prior.sessionId === snapshot.session.id
      && prior.roundIndex === snapshot.session.state.roundIndex) {
    const merged = new Map<number, Stroke>();
    for (const stroke of prior.strokes) merged.set(stroke.sequence, stroke);
    for (const stroke of snapshot.session.strokes) merged.set(stroke.sequence, stroke);
    strokes = [...merged.values()].sort((a, b) => a.sequence - b.sequence);
  }
  strokes = compactQuickDrawStrokes(strokes);

  const mergedSnapshot: QuickDrawSnapshot = {
    ...snapshot,
    session: { ...snapshot.session, strokes, strokesAreDelta: false },
  };
  strokeCache.set(key, {
    sessionId: mergedSnapshot.session.id,
    roundIndex: mergedSnapshot.session.state.roundIndex,
    strokes: mergedSnapshot.session.strokes,
  });
  return mergedSnapshot;
}

export async function fetchQuickDraw(accessToken: string, roomCode: string) {
  const cached = strokeCache.get(cacheKey(roomCode));
  const url = new URL(base(roomCode), window.location.origin);
  if (cached) {
    url.searchParams.set('session', cached.sessionId);
    url.searchParams.set('round', String(cached.roundIndex));
    url.searchParams.set('after', String(cached.strokes.at(-1)?.sequence ?? -1));
  }
  const snapshot = await request<QuickDrawSnapshot>(`${url.pathname}${url.search}`, accessToken);
  return rememberSnapshot(roomCode, snapshot);
}

export async function startQuickDrawClient(accessToken: string, roomCode: string, input: {
  drawingSeconds: number;
  artistTurns: number;
  artistSelection: 'random' | 'join-order';
  wordCategory: QuickDrawCategory;
  wordDifficulty: QuickDrawDifficulty;
  guessVisibility: 'hidden-until-correct' | 'moderated-stream';
  audienceGuessing: boolean;
  timeBonus: boolean;
}) {
  const snapshot = await request<QuickDrawSnapshot>(base(roomCode), accessToken, { method: 'POST', body: JSON.stringify(input) });
  return rememberSnapshot(roomCode, snapshot);
}

export function sendQuickDrawStroke(accessToken: string, roomCode: string, payload: unknown) {
  return request<{ ok: true; sequence: number }>(`${base(roomCode)}/stroke`, accessToken, { method: 'POST', body: JSON.stringify({ payload }) });
}

export async function submitQuickDrawGuessClient(accessToken: string, roomCode: string, guess: string) {
  const snapshot = await request<QuickDrawSnapshot>(`${base(roomCode)}/guess`, accessToken, { method: 'POST', body: JSON.stringify({ guess }) });
  return rememberSnapshot(roomCode, snapshot);
}

export async function finishQuickDrawRoundClient(accessToken: string, roomCode: string, force = false) {
  const snapshot = await request<QuickDrawSnapshot>(`${base(roomCode)}/finish`, accessToken, { method: 'POST', body: JSON.stringify({ force }) });
  return rememberSnapshot(roomCode, snapshot);
}

export async function nextQuickDrawRoundClient(accessToken: string, roomCode: string) {
  const snapshot = await request<QuickDrawSnapshot>(`${base(roomCode)}/next`, accessToken, { method: 'POST' });
  return rememberSnapshot(roomCode, snapshot);
}

export async function endQuickDrawClient(accessToken: string, roomCode: string) {
  const snapshot = await request<QuickDrawSnapshot>(`${base(roomCode)}/end`, accessToken, { method: 'POST' });
  return rememberSnapshot(roomCode, snapshot);
}
