import 'server-only';

import { createAdminClient } from './supabase/admin';
import { normalizeRoomCode } from './room-flow';
import { isAcceptedQuickDrawGuess, normalizeGuess, quickDrawArtistPoints, quickDrawGuesserPoints, shuffle } from './release1-games';
import { rankWithCompetitionTies } from './game-rules';
import { quickDrawWords, type QuickDrawCategory, type QuickDrawDifficulty } from './quick-draw-content';

const CATEGORIES: QuickDrawCategory[] = ['Everyday', 'Animals', 'Food', 'Places'];
const DIFFICULTIES: QuickDrawDifficulty[] = ['easy', 'medium', 'hard'];
const ARTIST_SELECTIONS = ['random', 'join-order'] as const;
const GUESS_VISIBILITY = ['hidden-until-correct', 'moderated-stream'] as const;

// Engineering defaults: the Product Plan specifies relative scoring behavior but not an exact point scale.
const FIXED_CORRECT_GUESS_POINTS = 1000;
const STROKE_EVENTS_PER_SECOND = 25;
const GUESSES_PER_SECOND = 5;

type ArtistSelection = (typeof ARTIST_SELECTIONS)[number];
type GuessVisibility = (typeof GUESS_VISIBILITY)[number];

type QuickDrawConfig = {
  drawingSeconds: number;
  artistTurns: number;
  artistSelection: ArtistSelection;
  wordCategory: QuickDrawCategory;
  wordDifficulty: QuickDrawDifficulty;
  guessVisibility: GuessVisibility;
  audienceGuessing: boolean;
  timeBonus: boolean;
};

type QuickDrawState = {
  phase: 'drawing' | 'revealing' | 'ended';
  roundIndex: number;
  artistSequence: string[];
  currentArtistId: string;
  currentArtistNickname: string;
  deadline: string;
  revealWord: string | null;
};

type StrokePoint = { x: number; y: number };
type StrokePayload =
  | { type: 'stroke'; points: StrokePoint[]; width: number }
  | { type: 'clear' };

function validateDrawingSeconds(value: unknown) {
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 20 || seconds > 120) throw new Error('Drawing time must be between 20 and 120 seconds.');
  return seconds;
}

function validateArtistTurns(value: unknown, activeCount: number) {
  const turns = Number(value);
  if (!Number.isInteger(turns) || turns < 1 || turns > activeCount) throw new Error(`Choose between 1 and ${activeCount} artist turns for this room.`);
  return turns;
}

function validateCategory(value: unknown): QuickDrawCategory {
  const category = String(value ?? 'Everyday') as QuickDrawCategory;
  if (!CATEGORIES.includes(category)) throw new Error('Choose a supported Quick Draw word category.');
  return category;
}

function validateDifficulty(value: unknown): QuickDrawDifficulty {
  const difficulty = String(value ?? 'easy') as QuickDrawDifficulty;
  if (!DIFFICULTIES.includes(difficulty)) throw new Error('Choose easy, medium, or hard Quick Draw words.');
  return difficulty;
}

function validateArtistSelection(value: unknown): ArtistSelection {
  const selection = String(value ?? 'random') as ArtistSelection;
  if (!ARTIST_SELECTIONS.includes(selection)) throw new Error('Choose random or join-order artist selection.');
  return selection;
}

function validateGuessVisibility(value: unknown): GuessVisibility {
  const visibility = String(value ?? 'hidden-until-correct') as GuessVisibility;
  if (!GUESS_VISIBILITY.includes(visibility)) throw new Error('Choose a supported guess visibility mode.');
  return visibility;
}

function validateStrokePayload(value: unknown): StrokePayload {
  if (!value || typeof value !== 'object') throw new Error('Invalid drawing event.');
  const payload = value as Record<string, unknown>;
  if (payload.type === 'clear') return { type: 'clear' };
  if (payload.type !== 'stroke' || !Array.isArray(payload.points)) throw new Error('Invalid drawing stroke.');
  if (payload.points.length < 1 || payload.points.length > 32) throw new Error('A drawing stroke must contain 1-32 points.');
  const points = payload.points.map((point) => {
    if (!point || typeof point !== 'object') throw new Error('Invalid drawing point.');
    const raw = point as Record<string, unknown>;
    const x = Number(raw.x);
    const y = Number(raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) throw new Error('Drawing coordinates must be normalized between 0 and 1.');
    return { x, y };
  });
  const width = Number(payload.width ?? 4);
  if (!Number.isFinite(width) || width < 1 || width > 20) throw new Error('Unsupported drawing stroke width.');
  return { type: 'stroke', points, width };
}

async function roomByCode(roomCodeValue: string) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data, error } = await admin.from('rooms')
    .select('id,join_code,host_user_id,status,game_type,ranking_visibility')
    .eq('join_code', roomCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status === 'closed') throw new Error('Room is no longer available.');
  return data;
}

async function memberByUser(roomId: string, userId: string, hostUserId: string | null) {
  if (hostUserId === userId) return { role: 'host' as const, participantId: null as string | null, nickname: 'Host' };
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants')
    .select('id,role,nickname')
    .eq('room_id', roomId)
    .eq('auth_user_id', userId)
    .is('left_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('You are not a member of this room.');
  return { role: data.role as 'participant' | 'spectator' | 'cohost', participantId: data.id, nickname: data.nickname };
}

async function latestSession(roomId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('game_sessions')
    .select('id,room_id,game_type,config,state,status,started_at,ended_at')
    .eq('room_id', roomId)
    .eq('game_type', 'quick-draw')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No Quick Draw session exists for this room yet.');
  return data as typeof data & { config: QuickDrawConfig; state: QuickDrawState };
}

async function currentRound(sessionId: string, roundIndex: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('quick_draw_rounds')
    .select('id,game_session_id,round_index,artist_participant_id,secret_word,word_category,word_difficulty,started_at,deadline,ended_at,status')
    .eq('game_session_id', sessionId)
    .eq('round_index', roundIndex)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('The current Quick Draw round could not be found.');
  return data;
}

function chooseWord(config: Pick<QuickDrawConfig, 'wordCategory' | 'wordDifficulty'>) {
  const pool = quickDrawWords(config.wordCategory, config.wordDifficulty);
  if (!pool.length) throw new Error('No starter words exist for this category and difficulty yet.');
  return pool[Math.floor(Math.random() * pool.length)];
}

async function participantSummary(participantId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants').select('id,nickname,avatar_key').eq('id', participantId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Artist participant could not be found.');
  return data;
}

async function createRound(sessionId: string, roundIndex: number, artistParticipantId: string, config: QuickDrawConfig) {
  const admin = createAdminClient();
  const word = chooseWord(config);
  const artist = await participantSummary(artistParticipantId);
  const now = Date.now();
  const deadline = new Date(now + config.drawingSeconds * 1000).toISOString();
  const { error } = await admin.from('quick_draw_rounds').insert({
    game_session_id: sessionId,
    round_index: roundIndex,
    artist_participant_id: artistParticipantId,
    secret_word: word.word,
    word_category: word.category,
    word_difficulty: word.difficulty,
    started_at: new Date(now).toISOString(),
    deadline,
    status: 'drawing',
  });
  if (error) throw new Error(error.message);
  return { artist, deadline };
}

export async function startQuickDraw(roomCodeValue: string, hostUserId: string, input: {
  drawingSeconds: unknown;
  artistTurns: unknown;
  artistSelection: unknown;
  wordCategory: unknown;
  wordDifficulty: unknown;
  guessVisibility: unknown;
  audienceGuessing?: unknown;
  timeBonus?: unknown;
}) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can start Quick Draw & Guess.');
  if (room.game_type !== 'quick-draw') throw new Error('The room is not configured for Quick Draw & Guess.');
  if (!['lobby', 'results'].includes(room.status)) throw new Error('Return the room to the lobby before starting Quick Draw & Guess.');

  const { data: participants, error: participantError } = await admin.from('participants')
    .select('id,role,joined_at')
    .eq('room_id', room.id)
    .is('left_at', null)
    .order('joined_at', { ascending: true });
  if (participantError) throw new Error(participantError.message);
  const active = (participants ?? []).filter((participant) => participant.role !== 'spectator');
  if (active.length < 3) throw new Error(`${3 - active.length} more player${active.length === 2 ? '' : 's'} required for Quick Draw & Guess.`);

  const artistSelection = validateArtistSelection(input.artistSelection);
  const artistTurns = validateArtistTurns(input.artistTurns, active.length);
  const config: QuickDrawConfig = {
    drawingSeconds: validateDrawingSeconds(input.drawingSeconds),
    artistTurns,
    artistSelection,
    wordCategory: validateCategory(input.wordCategory),
    wordDifficulty: validateDifficulty(input.wordDifficulty),
    guessVisibility: validateGuessVisibility(input.guessVisibility),
    audienceGuessing: input.audienceGuessing !== false,
    timeBonus: input.timeBonus !== false,
  };

  const orderedIds = active.map((participant) => participant.id);
  const artistSequence = (artistSelection === 'random' ? shuffle(orderedIds) : orderedIds).slice(0, artistTurns);

  await admin.from('game_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('room_id', room.id).eq('status', 'active');
  const placeholderState: QuickDrawState = {
    phase: 'drawing',
    roundIndex: 0,
    artistSequence,
    currentArtistId: artistSequence[0],
    currentArtistNickname: '',
    deadline: new Date().toISOString(),
    revealWord: null,
  };
  const { data: session, error: sessionError } = await admin.from('game_sessions').insert({
    room_id: room.id,
    game_type: 'quick-draw',
    config,
    state: placeholderState,
    status: 'active',
    started_at: new Date().toISOString(),
  }).select('id').single();
  if (sessionError || !session) throw new Error(sessionError?.message ?? 'Could not create Quick Draw session.');

  const first = await createRound(session.id, 0, artistSequence[0], config);
  const state: QuickDrawState = {
    ...placeholderState,
    currentArtistNickname: first.artist.nickname,
    deadline: first.deadline,
  };
  const { error: stateError } = await admin.from('game_sessions').update({ state }).eq('id', session.id);
  if (stateError) throw new Error(stateError.message);
  const { error: roomError } = await admin.from('rooms').update({ status: 'playing' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getQuickDrawState(room.join_code, hostUserId);
}

export async function submitQuickDrawStroke(roomCodeValue: string, userId: string, payloadValue: unknown) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await memberByUser(room.id, userId, room.host_user_id);
  if (!member.participantId) throw new Error('The Host is not the current drawing participant.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'drawing') throw new Error('Drawing is not active.');
  if (session.state.currentArtistId !== member.participantId) throw new Error('Only the current artist can draw.');
  if (Date.now() >= new Date(session.state.deadline).getTime()) throw new Error('This drawing turn has ended.');
  const payload = validateStrokePayload(payloadValue);

  const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
  const { count, error: rateError } = await admin.from('quick_draw_strokes')
    .select('id', { count: 'exact', head: true })
    .eq('participant_id', member.participantId)
    .gte('created_at', oneSecondAgo);
  if (rateError) throw new Error(rateError.message);
  if ((count ?? 0) >= STROKE_EVENTS_PER_SECOND) throw new Error('Drawing input is arriving too quickly. Slow down briefly.');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: last } = await admin.from('quick_draw_strokes')
      .select('sequence')
      .eq('game_session_id', session.id)
      .eq('round_index', session.state.roundIndex)
      .order('sequence', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sequence = (last?.sequence ?? -1) + 1;
    const { error } = await admin.from('quick_draw_strokes').insert({
      game_session_id: session.id,
      round_index: session.state.roundIndex,
      participant_id: member.participantId,
      sequence,
      payload,
    });
    if (!error) return { ok: true, sequence };
    if (error.code !== '23505' || attempt === 2) throw new Error(error.message);
  }
  throw new Error('Could not store drawing event.');
}

export async function submitQuickDrawGuess(roomCodeValue: string, userId: string, guessValue: unknown) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await memberByUser(room.id, userId, room.host_user_id);
  if (!member.participantId) throw new Error('The Host cannot submit a player guess from the Host account.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'drawing') throw new Error('Guessing is not active.');
  if (Date.now() >= new Date(session.state.deadline).getTime()) throw new Error('This guessing turn has ended.');
  if (member.participantId === session.state.currentArtistId) throw new Error('The artist cannot guess the secret word.');
  if (member.role === 'spectator' && !session.config.audienceGuessing) throw new Error('Audience guessing is disabled for this room.');

  const guess = String(guessValue ?? '').trim();
  if (!guess || guess.length > 80) throw new Error('Enter a guess between 1 and 80 characters.');

  const oneSecondAgo = new Date(Date.now() - 1000).toISOString();
  const { count, error: rateError } = await admin.from('quick_draw_guesses')
    .select('id', { count: 'exact', head: true })
    .eq('participant_id', member.participantId)
    .gte('created_at', oneSecondAgo);
  if (rateError) throw new Error(rateError.message);
  if ((count ?? 0) >= GUESSES_PER_SECOND) throw new Error('Too many guesses. Wait a moment before trying again.');

  const { data: round, error: roundError } = await admin.from('quick_draw_rounds')
    .select('secret_word')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex)
    .maybeSingle();
  if (roundError) throw new Error(roundError.message);
  if (!round) throw new Error('Quick Draw round not found.');

  const accepted = isAcceptedQuickDrawGuess(guess, round.secret_word);
  let pointsAwarded = 0;
  if (accepted) {
    const { data: priorCorrect, error: priorError } = await admin.from('quick_draw_guesses')
      .select('id')
      .eq('game_session_id', session.id)
      .eq('round_index', session.state.roundIndex)
      .eq('participant_id', member.participantId)
      .eq('accepted', true)
      .maybeSingle();
    if (priorError) throw new Error(priorError.message);
    if (priorCorrect) return getQuickDrawState(room.join_code, userId);
    const remainingMs = Math.max(0, new Date(session.state.deadline).getTime() - Date.now());
    pointsAwarded = session.config.timeBonus
      ? quickDrawGuesserPoints(remainingMs, session.config.drawingSeconds * 1000)
      : FIXED_CORRECT_GUESS_POINTS;
  }

  const { error: guessError } = await admin.from('quick_draw_guesses').insert({
    game_session_id: session.id,
    round_index: session.state.roundIndex,
    participant_id: member.participantId,
    guess,
    normalized_guess: normalizeGuess(guess),
    accepted,
    points_awarded: pointsAwarded,
  });
  if (guessError) throw new Error(guessError.message);

  if (accepted && pointsAwarded > 0) {
    const { error: scoreError } = await admin.from('score_entries').insert({
      game_session_id: session.id,
      participant_id: member.participantId,
      points: pointsAwarded,
      reason: `quick-draw-round-${session.state.roundIndex + 1}-guess`,
    });
    if (scoreError) throw new Error(scoreError.message);
  }

  return getQuickDrawState(room.join_code, userId);
}

async function eligibleGuessers(roomId: string, artistId: string, audienceGuessing: boolean) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('participants')
    .select('id,role')
    .eq('room_id', roomId)
    .is('left_at', null);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((participant) => participant.id !== artistId && (participant.role !== 'spectator' || audienceGuessing));
}

export async function finishQuickDrawRound(roomCodeValue: string, hostUserId: string, force = false) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can end the current Quick Draw turn.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'drawing') throw new Error('No drawing turn is active.');
  const remainingMs = new Date(session.state.deadline).getTime() - Date.now();
  if (!force && remainingMs > 0) throw new Error(`The drawing turn still has ${Math.ceil(remainingMs / 1000)} seconds remaining.`);

  const round = await currentRound(session.id, session.state.roundIndex);
  const eligible = await eligibleGuessers(room.id, round.artist_participant_id, session.config.audienceGuessing);
  const { data: correct, error: correctError } = await admin.from('quick_draw_guesses')
    .select('participant_id')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex)
    .eq('accepted', true);
  if (correctError) throw new Error(correctError.message);
  const correctIds = new Set((correct ?? []).map((guess) => guess.participant_id));
  const correctEligible = eligible.filter((participant) => correctIds.has(participant.id)).length;
  const artistPoints = quickDrawArtistPoints(correctEligible, eligible.length);
  if (artistPoints > 0) {
    const { error: scoreError } = await admin.from('score_entries').insert({
      game_session_id: session.id,
      participant_id: round.artist_participant_id,
      points: artistPoints,
      reason: `quick-draw-round-${session.state.roundIndex + 1}-artist`,
    });
    if (scoreError) throw new Error(scoreError.message);
  }

  const endedAt = new Date().toISOString();
  const { error: roundUpdateError } = await admin.from('quick_draw_rounds').update({ status: 'revealed', ended_at: endedAt }).eq('id', round.id);
  if (roundUpdateError) throw new Error(roundUpdateError.message);
  const state: QuickDrawState = { ...session.state, phase: 'revealing', revealWord: round.secret_word };
  const { error: stateError } = await admin.from('game_sessions').update({ state }).eq('id', session.id).eq('status', 'active');
  if (stateError) throw new Error(stateError.message);
  return getQuickDrawState(room.join_code, hostUserId);
}

export async function advanceQuickDrawRound(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can advance Quick Draw & Guess.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'revealing') throw new Error('Reveal the current word before advancing.');

  const nextIndex = session.state.roundIndex + 1;
  if (nextIndex >= session.config.artistTurns) {
    const endedState: QuickDrawState = { ...session.state, phase: 'ended' };
    const { error: sessionError } = await admin.from('game_sessions').update({ status: 'ended', state: endedState, ended_at: new Date().toISOString() }).eq('id', session.id);
    if (sessionError) throw new Error(sessionError.message);
    const { error: roomError } = await admin.from('rooms').update({ status: 'results' }).eq('id', room.id).eq('host_user_id', hostUserId);
    if (roomError) throw new Error(roomError.message);
    return getQuickDrawState(room.join_code, hostUserId);
  }

  const nextArtistId = session.state.artistSequence[nextIndex];
  const created = await createRound(session.id, nextIndex, nextArtistId, session.config);
  const nextState: QuickDrawState = {
    ...session.state,
    phase: 'drawing',
    roundIndex: nextIndex,
    currentArtistId: nextArtistId,
    currentArtistNickname: created.artist.nickname,
    deadline: created.deadline,
    revealWord: null,
  };
  const { error } = await admin.from('game_sessions').update({ state: nextState }).eq('id', session.id).eq('status', 'active');
  if (error) throw new Error(error.message);
  return getQuickDrawState(room.join_code, hostUserId);
}

export async function endQuickDraw(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can end Quick Draw & Guess.');
  const session = await latestSession(room.id);
  const state: QuickDrawState = { ...session.state, phase: 'ended' };
  const { error: sessionError } = await admin.from('game_sessions').update({ status: 'ended', state, ended_at: new Date().toISOString() }).eq('id', session.id);
  if (sessionError) throw new Error(sessionError.message);
  const { error: roomError } = await admin.from('rooms').update({ status: 'results' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getQuickDrawState(room.join_code, hostUserId);
}

export async function getQuickDrawState(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await memberByUser(room.id, userId, room.host_user_id);
  const session = await latestSession(room.id);
  const round = await currentRound(session.id, session.state.roundIndex);
  const canSeeSecret = member.role === 'host' || member.participantId === session.state.currentArtistId || session.state.phase !== 'drawing';

  const { data: strokes, error: strokeError } = await admin.from('quick_draw_strokes')
    .select('sequence,payload')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex)
    .order('sequence', { ascending: true });
  if (strokeError) throw new Error(strokeError.message);

  const { data: correctGuesses, error: correctError } = await admin.from('quick_draw_guesses')
    .select('participant_id,points_awarded,created_at')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex)
    .eq('accepted', true)
    .order('created_at', { ascending: true });
  if (correctError) throw new Error(correctError.message);
  const correctIds = (correctGuesses ?? []).map((guess) => guess.participant_id);
  const { data: correctPeople, error: correctPeopleError } = correctIds.length
    ? await admin.from('participants').select('id,nickname').in('id', correctIds)
    : { data: [], error: null };
  if (correctPeopleError) throw new Error(correctPeopleError.message);
  const correctPeopleMap = new Map((correctPeople ?? []).map((person) => [person.id, person.nickname]));

  let ownGuesses: Array<{ guess: string; accepted: boolean; points_awarded: number; created_at: string }> = [];
  if (member.participantId) {
    const { data, error } = await admin.from('quick_draw_guesses')
      .select('guess,accepted,points_awarded,created_at')
      .eq('game_session_id', session.id)
      .eq('round_index', session.state.roundIndex)
      .eq('participant_id', member.participantId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    ownGuesses = data ?? [];
  }

  let hostGuessStream: Array<{ guess: string; accepted: boolean; nickname: string; created_at: string }> = [];
  if (member.role === 'host' && session.config.guessVisibility === 'moderated-stream') {
    const { data: guesses, error } = await admin.from('quick_draw_guesses')
      .select('participant_id,guess,accepted,created_at')
      .eq('game_session_id', session.id)
      .eq('round_index', session.state.roundIndex)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    const ids = [...new Set((guesses ?? []).map((guess) => guess.participant_id))];
    const { data: people } = ids.length ? await admin.from('participants').select('id,nickname').in('id', ids) : { data: [] };
    const names = new Map((people ?? []).map((person) => [person.id, person.nickname]));
    hostGuessStream = (guesses ?? []).map((guess) => ({ ...guess, nickname: names.get(guess.participant_id) ?? 'Player' }));
  }

  const { data: scores, error: scoreError } = await admin.from('score_entries').select('participant_id,points').eq('game_session_id', session.id);
  if (scoreError) throw new Error(scoreError.message);
  const { data: people, error: peopleError } = await admin.from('participants').select('id,nickname,avatar_key,role').eq('room_id', room.id).is('left_at', null);
  if (peopleError) throw new Error(peopleError.message);
  const totals = new Map<string, number>();
  for (const person of people ?? []) totals.set(person.id, 0);
  for (const score of scores ?? []) totals.set(score.participant_id, (totals.get(score.participant_id) ?? 0) + score.points);
  const peopleMap = new Map((people ?? []).map((person) => [person.id, person]));
  const rankings = rankWithCompetitionTies([...totals.entries()].map(([id, score]) => ({ id, score }))).map((entry) => ({
    participant_id: entry.id,
    nickname: peopleMap.get(entry.id)?.nickname ?? 'Player',
    avatarKey: peopleMap.get(entry.id)?.avatar_key ?? null,
    role: peopleMap.get(entry.id)?.role ?? 'participant',
    points: entry.score,
    placement: entry.rank,
  }));
  const publicRankings = member.role === 'host'
    ? rankings
    : room.ranking_visibility === 'public'
      ? rankings
      : room.ranking_visibility === 'top10'
        ? rankings.slice(0, 10)
        : room.ranking_visibility === 'private'
          ? []
          : rankings.slice(0, 3);

  return {
    room: { joinCode: room.join_code, status: room.status, rankingVisibility: room.ranking_visibility },
    session: {
      id: session.id,
      status: session.status,
      config: session.config,
      state: session.state,
      artist: {
        participantId: session.state.currentArtistId,
        nickname: session.state.currentArtistNickname,
        isSelf: member.participantId === session.state.currentArtistId,
      },
      secretWord: canSeeSecret ? round.secret_word : null,
      strokes: strokes ?? [],
      correctGuessers: (correctGuesses ?? []).map((guess) => ({
        participant_id: guess.participant_id,
        nickname: correctPeopleMap.get(guess.participant_id) ?? 'Player',
        points: guess.points_awarded,
        created_at: guess.created_at,
      })),
      ownGuesses,
      hostGuessStream,
      rankings: publicRankings,
      ownResult: member.participantId ? rankings.find((entry) => entry.participant_id === member.participantId) ?? null : null,
    },
  };
}
