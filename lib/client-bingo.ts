'use client';

export type BingoWinner = {
  participant_id: string;
  completing_draw_index: number;
  placement: number;
  nickname: string;
  avatarKey: string | null;
};

export type BingoSnapshot = {
  room: { joinCode: string; status: string };
  session: {
    id: string;
    status: 'active' | 'ended';
    config: {
      mode: 'standard-number';
      boardSize: number;
      candidateCount: number;
      cardChoiceSeconds: number;
      poolMultiplier: number;
      winningRule: 'one-line';
    };
    state: {
      phase: 'card-selection' | 'drawing' | 'ended';
      pool: number[];
      drawn: number[];
      latestDraw: number | null;
      selectionDeadline: string;
    };
    cardSelection: { selected: number; total: number };
    winners: BingoWinner[];
  };
  ownCard: null | {
    candidate_cards: number[][];
    selected_candidate: number | null;
    selected_card: number[] | null;
    locked_at: string | null;
  };
};

async function bingoRequest<T>(url: string, accessToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${accessToken}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(url, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `Bingo request failed (${response.status}).`);
  return payload as T;
}

function base(roomCode: string) { return `/api/rooms/${encodeURIComponent(roomCode)}/games/bingo`; }

export function fetchBingo(accessToken: string, roomCode: string) {
  return bingoRequest<BingoSnapshot>(base(roomCode), accessToken);
}

export function startBingo(accessToken: string, roomCode: string, boardSize: number, cardChoiceSeconds: number) {
  return bingoRequest<BingoSnapshot>(base(roomCode), accessToken, {
    method: 'POST',
    body: JSON.stringify({ boardSize, cardChoiceSeconds }),
  });
}

export function selectBingoCard(accessToken: string, roomCode: string, candidateIndex: number) {
  return bingoRequest<BingoSnapshot>(`${base(roomCode)}/select`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ candidateIndex }),
  });
}

export function drawNextBingo(accessToken: string, roomCode: string) {
  return bingoRequest<BingoSnapshot>(`${base(roomCode)}/draw`, accessToken, { method: 'POST' });
}

export function endBingo(accessToken: string, roomCode: string) {
  return bingoRequest<BingoSnapshot>(`${base(roomCode)}/end`, accessToken, { method: 'POST' });
}
