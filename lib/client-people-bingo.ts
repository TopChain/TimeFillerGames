'use client';

export type PeopleDirectoryEntry = { nickname: string; avatarKey: string | null };

export type PeopleBingoSnapshot = {
  room: { joinCode: string; status: string };
  session: {
    id: string;
    status: 'active' | 'ended';
    config: {
      mode: 'people';
      boardSize: 5;
      candidateCount: 3;
      cardChoiceSeconds: number;
      winningRule: 'one-line';
      fairnessStatus: 'release1-test-required';
    };
    state: {
      phase: 'card-selection' | 'drawing' | 'ended';
      pool: string[];
      drawn: string[];
      latestDraw: string | null;
      selectionDeadline: string;
    };
    selection: { selected: number; total: number };
    directory: Record<string, PeopleDirectoryEntry>;
    ownCard: null | {
      candidate_cards: string[][];
      selected_candidate: number | null;
      selected_card: string[] | null;
      locked_at: string | null;
    };
    winners: Array<{ participant_id: string; completing_draw_index: number; placement: number; nickname: string; avatarKey: string | null }>;
  };
};

async function request<T>(url: string, accessToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${accessToken}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `People Bingo request failed (${response.status}).`);
  return payload as T;
}

function base(roomCode: string) {
  return `/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people`;
}

export function fetchPeopleBingo(accessToken: string, roomCode: string) {
  return request<PeopleBingoSnapshot>(base(roomCode), accessToken);
}

export function startPeopleBingoClient(accessToken: string, roomCode: string, cardChoiceSeconds: number) {
  return request<PeopleBingoSnapshot>(base(roomCode), accessToken, { method: 'POST', body: JSON.stringify({ cardChoiceSeconds }) });
}

export function selectPeopleBingoCardClient(accessToken: string, roomCode: string, candidateIndex: number) {
  return request<PeopleBingoSnapshot>(`${base(roomCode)}/select`, accessToken, { method: 'POST', body: JSON.stringify({ candidateIndex }) });
}

export function drawPeopleBingoClient(accessToken: string, roomCode: string) {
  return request<PeopleBingoSnapshot>(`${base(roomCode)}/draw`, accessToken, { method: 'POST' });
}

export function endPeopleBingoClient(accessToken: string, roomCode: string) {
  return request<PeopleBingoSnapshot>(`${base(roomCode)}/end`, accessToken, { method: 'POST' });
}

export function fetchLatestBingoMode(accessToken: string, roomCode: string) {
  return request<{ mode: 'standard-number' | 'people'; status: string }>(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/mode`, accessToken);
}
