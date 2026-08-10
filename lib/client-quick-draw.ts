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
    correctGuessers: Array<{ participant_id: string; nickname: string; points: number; created_at: string }>;
    ownGuesses: Array<{ guess: string; accepted: boolean; points_awarded: number; created_at: string }>;
    hostGuessStream: Array<{ guess: string; accepted: boolean; nickname: string; created_at: string }>;
    rankings: Array<{ participant_id: string; nickname: string; avatarKey: string | null; role: string; points: number; placement: number }>;
    ownResult: null | { participant_id: string; nickname: string; avatarKey: string | null; role: string; points: number; placement: number };
  };
};

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

export function fetchQuickDraw(accessToken: string, roomCode: string) {
  return request<QuickDrawSnapshot>(base(roomCode), accessToken);
}

export function startQuickDrawClient(accessToken: string, roomCode: string, input: {
  drawingSeconds: number;
  artistTurns: number;
  artistSelection: 'random' | 'join-order';
  wordCategory: QuickDrawCategory;
  wordDifficulty: QuickDrawDifficulty;
  guessVisibility: 'hidden-until-correct' | 'moderated-stream';
  audienceGuessing: boolean;
  timeBonus: boolean;
}) {
  return request<QuickDrawSnapshot>(base(roomCode), accessToken, { method: 'POST', body: JSON.stringify(input) });
}

export function sendQuickDrawStroke(accessToken: string, roomCode: string, payload: unknown) {
  return request<{ ok: true; sequence: number }>(`${base(roomCode)}/stroke`, accessToken, { method: 'POST', body: JSON.stringify({ payload }) });
}

export function submitQuickDrawGuessClient(accessToken: string, roomCode: string, guess: string) {
  return request<QuickDrawSnapshot>(`${base(roomCode)}/guess`, accessToken, { method: 'POST', body: JSON.stringify({ guess }) });
}

export function finishQuickDrawRoundClient(accessToken: string, roomCode: string, force = false) {
  return request<QuickDrawSnapshot>(`${base(roomCode)}/finish`, accessToken, { method: 'POST', body: JSON.stringify({ force }) });
}

export function nextQuickDrawRoundClient(accessToken: string, roomCode: string) {
  return request<QuickDrawSnapshot>(`${base(roomCode)}/next`, accessToken, { method: 'POST' });
}

export function endQuickDrawClient(accessToken: string, roomCode: string) {
  return request<QuickDrawSnapshot>(`${base(roomCode)}/end`, accessToken, { method: 'POST' });
}
