import 'server-only';
import { createAdminClient } from './supabase/admin';
import { bingoWinnersOnDraw, buildBingoNumberPool, drawNextUnused, generateBingoCandidates } from './release1-games';
import { normalizeRoomCode } from './room-flow';

const CARD_TIMERS = [10, 15, 20, 30, 60] as const;
const CANDIDATE_COUNT = 3;

type BingoState = {
  phase: 'card-selection' | 'drawing' | 'ended';
  pool: number[];
  drawn: number[];
  latestDraw: number | null;
  selectionDeadline: string;
};

type BingoConfig = {
  mode: 'standard-number';
  boardSize: number;
  candidateCount: number;
  cardChoiceSeconds: number;
  poolMultiplier: number;
  winningRule: 'one-line';
};

function poolMultiplier() {
  const parsed = Number(process.env.BINGO_POOL_MULTIPLIER ?? 3);
  return Number.isInteger(parsed) && parsed >= 2 && parsed <= 8 ? parsed : 3;
}

function validateBoardSize(value: unknown) {
  const size = Number(value);
  if (![5, 6, 7, 8, 9, 10].includes(size)) throw new Error('Choose a supported Bingo board size.');
  return size;
}

function validateCardTimer(value: unknown) {
  const seconds = Number(value);
  if (!(CARD_TIMERS as readonly number[]).includes(seconds)) throw new Error('Choose a 10, 15, 20, 30, or 60 second card-selection timer.');
  return seconds;
}

async function roomByCode(roomCodeValue: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data, error } = await admin.from('rooms')
    .select('id,join_code,host_user_id,status,game_type,duration_minutes,host_cap')
    .eq('join_code', roomCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status === 'closed') throw new Error('Room is no longer available.');
  return data;
}

async function requireRoomMember(roomId: string, userId: string, hostUserId: string | null) {
  if (hostUserId === userId) return { role: 'host' as const, participantId: null as string | null };
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants')
    .select('id,role')
    .eq('room_id', roomId)
    .eq('auth_user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('You are not a member of this room.');
  return { role: data.role as 'participant' | 'spectator' | 'cohost', participantId: data.id };
}

async function latestBingoSession(roomId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('game_sessions')
    .select('id,room_id,game_type,config,state,status,started_at,ended_at')
    .eq('room_id', roomId)
    .eq('game_type', 'bingo')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No Bingo session exists for this room yet.');
  return data as typeof data & { config: BingoConfig; state: BingoState };
}

export async function startStandardBingo(roomCodeValue: string, hostUserId: string, input: { boardSize: unknown; cardChoiceSeconds: unknown }) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can start Bingo.');
  if (room.game_type !== 'bingo') throw new Error('The room is not configured for Bingo.');
  if (!['lobby', 'results'].includes(room.status)) throw new Error('Return the room to the lobby before starting a new Bingo session.');

  const boardSize = validateBoardSize(input.boardSize);
  const cardChoiceSeconds = validateCardTimer(input.cardChoiceSeconds);
  const multiplier = poolMultiplier();
  const { data: participants, error: participantError } = await admin.from('participants')
    .select('id,role,online,left_at')
    .eq('room_id', room.id)
    .is('left_at', null);
  if (participantError) throw new Error(participantError.message);
  const active = (participants ?? []).filter((participant) => participant.role !== 'spectator');
  if (active.length < 2) throw new Error(`${2 - active.length} more player${active.length === 1 ? '' : 's'} required for Standard Bingo.`);

  await admin.from('game_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('room_id', room.id).eq('status', 'active');

  const now = Date.now();
  const config: BingoConfig = {
    mode: 'standard-number',
    boardSize,
    candidateCount: CANDIDATE_COUNT,
    cardChoiceSeconds,
    poolMultiplier: multiplier,
    winningRule: 'one-line',
  };
  const state: BingoState = {
    phase: 'card-selection',
    pool: buildBingoNumberPool(boardSize, multiplier),
    drawn: [],
    latestDraw: null,
    selectionDeadline: new Date(now + cardChoiceSeconds * 1000).toISOString(),
  };
  const { data: session, error: sessionError } = await admin.from('game_sessions').insert({
    room_id: room.id,
    game_type: 'bingo',
    config,
    state,
    status: 'active',
    started_at: new Date(now).toISOString(),
  }).select('id,room_id,game_type,config,state,status,started_at').single();
  if (sessionError || !session) throw new Error(sessionError?.message ?? 'Could not create Bingo session.');

  const cards = active.map((participant) => ({
    game_session_id: session.id,
    participant_id: participant.id,
    candidate_cards: generateBingoCandidates(boardSize, CANDIDATE_COUNT, Math.random, multiplier),
  }));
  const { error: cardError } = await admin.from('bingo_cards').insert(cards);
  if (cardError) {
    await admin.from('game_sessions').delete().eq('id', session.id);
    throw new Error(cardError.message);
  }
  const { error: roomError } = await admin.from('rooms').update({ status: 'playing' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getStandardBingoState(room.join_code, hostUserId);
}

export async function selectStandardBingoCard(roomCodeValue: string, userId: string, candidateIndexValue: unknown) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await requireRoomMember(room.id, userId, room.host_user_id);
  if (!member.participantId || member.role === 'spectator') throw new Error('Only an active participant can select a Bingo card.');
  const session = await latestBingoSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'card-selection') throw new Error('Bingo card selection is closed.');
  if (Date.now() > new Date(session.state.selectionDeadline).getTime()) throw new Error('The card-selection timer has expired. The server will assign a card automatically.');

  const index = Number(candidateIndexValue);
  if (!Number.isInteger(index) || index < 0 || index >= session.config.candidateCount) throw new Error('Choose one of the candidate Bingo cards.');
  const { data: row, error } = await admin.from('bingo_cards')
    .select('candidate_cards,selected_card')
    .eq('game_session_id', session.id)
    .eq('participant_id', member.participantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error('Bingo card candidates were not found.');
  if (row.selected_card) throw new Error('Your Bingo card is already locked.');
  const candidates = row.candidate_cards as number[][];
  const selected = candidates[index];
  if (!selected) throw new Error('That Bingo candidate does not exist.');
  const { error: updateError } = await admin.from('bingo_cards').update({
    selected_candidate: index,
    selected_card: selected,
    locked_at: new Date().toISOString(),
  }).eq('game_session_id', session.id).eq('participant_id', member.participantId).is('selected_card', null);
  if (updateError) throw new Error(updateError.message);
  return getStandardBingoState(room.join_code, userId);
}

async function lockUnselectedCards(sessionId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('bingo_cards').select('id,candidate_cards,selected_card').eq('game_session_id', sessionId);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (row.selected_card) continue;
    const candidates = row.candidate_cards as number[][];
    const index = Math.floor(Math.random() * candidates.length);
    const { error: updateError } = await admin.from('bingo_cards').update({
      selected_candidate: index,
      selected_card: candidates[index],
      locked_at: new Date().toISOString(),
    }).eq('id', row.id).is('selected_card', null);
    if (updateError) throw new Error(updateError.message);
  }
}

export async function drawNextStandardBingo(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can trigger the current Release 1 caller action.');
  const session = await latestBingoSession(room.id);
  if (session.status !== 'active') throw new Error('This Bingo session has ended.');

  if (session.state.phase === 'card-selection') {
    const { count, error: countError } = await admin.from('bingo_cards')
      .select('id', { count: 'exact', head: true })
      .eq('game_session_id', session.id)
      .is('selected_card', null);
    if (countError) throw new Error(countError.message);
    const remainingMs = new Date(session.state.selectionDeadline).getTime() - Date.now();
    if ((count ?? 0) > 0 && remainingMs > 0) throw new Error(`Card selection is still open for ${Math.ceil(remainingMs / 1000)} seconds.`);
    await lockUnselectedCards(session.id);
  }

  const { data: cardRows, error: cardError } = await admin.from('bingo_cards')
    .select('participant_id,selected_card')
    .eq('game_session_id', session.id);
  if (cardError) throw new Error(cardError.message);
  const cards: Record<string, readonly number[]> = {};
  for (const row of cardRows ?? []) {
    if (!row.selected_card) throw new Error('A Bingo card could not be locked.');
    cards[row.participant_id] = row.selected_card as number[];
  }

  const newDraw = drawNextUnused(session.state.pool, session.state.drawn);
  const winners = bingoWinnersOnDraw(cards, session.state.drawn, newDraw, session.config.boardSize);
  const drawn = [...session.state.drawn, newDraw];
  const nextState: BingoState = { ...session.state, phase: 'drawing', drawn, latestDraw: newDraw };

  if (winners.length) {
    const { count: priorWinnerCount, error: winnerCountError } = await admin.from('bingo_winners')
      .select('id', { count: 'exact', head: true })
      .eq('game_session_id', session.id);
    if (winnerCountError) throw new Error(winnerCountError.message);
    const placement = (priorWinnerCount ?? 0) + 1;
    const { error: insertWinnerError } = await admin.from('bingo_winners').insert(winners.map((participantId) => ({
      game_session_id: session.id,
      participant_id: participantId,
      completing_draw_index: drawn.length - 1,
      placement,
    })));
    if (insertWinnerError) throw new Error(insertWinnerError.message);
  }

  const { error: stateError } = await admin.from('game_sessions').update({ state: nextState }).eq('id', session.id).eq('status', 'active');
  if (stateError) throw new Error(stateError.message);
  return getStandardBingoState(room.join_code, hostUserId);
}

export async function endStandardBingo(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can end Bingo.');
  const session = await latestBingoSession(room.id);
  if (session.status === 'ended') return getStandardBingoState(room.join_code, hostUserId);
  const state = { ...session.state, phase: 'ended' as const };
  const { error } = await admin.from('game_sessions').update({ status: 'ended', state, ended_at: new Date().toISOString() }).eq('id', session.id);
  if (error) throw new Error(error.message);
  const { error: roomError } = await admin.from('rooms').update({ status: 'results' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getStandardBingoState(room.join_code, hostUserId);
}

export async function getStandardBingoState(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await requireRoomMember(room.id, userId, room.host_user_id);
  const session = await latestBingoSession(room.id);

  const { count: totalCards, error: totalError } = await admin.from('bingo_cards').select('id', { count: 'exact', head: true }).eq('game_session_id', session.id);
  if (totalError) throw new Error(totalError.message);
  const { count: selectedCards, error: selectedError } = await admin.from('bingo_cards').select('id', { count: 'exact', head: true }).eq('game_session_id', session.id).not('selected_card', 'is', null);
  if (selectedError) throw new Error(selectedError.message);

  const { data: winnerRows, error: winnerError } = await admin.from('bingo_winners')
    .select('participant_id,completing_draw_index,placement')
    .eq('game_session_id', session.id)
    .order('placement', { ascending: true });
  if (winnerError) throw new Error(winnerError.message);
  const winnerIds = (winnerRows ?? []).map((winner) => winner.participant_id);
  const { data: winnerPeople, error: peopleError } = winnerIds.length
    ? await admin.from('participants').select('id,nickname,avatar_key').in('id', winnerIds)
    : { data: [], error: null };
  if (peopleError) throw new Error(peopleError.message);
  const winnerMap = new Map((winnerPeople ?? []).map((person) => [person.id, person]));

  let ownCard: null | { candidate_cards: number[][]; selected_candidate: number | null; selected_card: number[] | null; locked_at: string | null } = null;
  if (member.participantId) {
    const { data, error } = await admin.from('bingo_cards')
      .select('candidate_cards,selected_candidate,selected_card,locked_at')
      .eq('game_session_id', session.id)
      .eq('participant_id', member.participantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    ownCard = data as typeof ownCard;
  }

  return {
    room: { joinCode: room.join_code, status: room.status },
    session: {
      id: session.id,
      status: session.status,
      config: session.config,
      state: session.state,
      cardSelection: { selected: selectedCards ?? 0, total: totalCards ?? 0 },
      winners: (winnerRows ?? []).map((winner) => ({ ...winner, nickname: winnerMap.get(winner.participant_id)?.nickname ?? 'Player', avatarKey: winnerMap.get(winner.participant_id)?.avatar_key ?? null })),
    },
    ownCard,
  };
}
