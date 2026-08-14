import 'server-only';

import { rankWithCompetitionTies } from './game-rules';
import { normalizeRoomCode } from './room-flow';
import { createAdminClient } from './supabase/admin';

type QuickDrawConfig = {
  drawingSeconds: number;
  artistTurns: number;
  artistSelection: 'random' | 'join-order';
  wordCategory: 'Everyday' | 'Animals' | 'Food' | 'Places';
  wordDifficulty: 'easy' | 'medium' | 'hard';
  guessVisibility: 'hidden-until-correct' | 'moderated-stream';
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
  pauseStartedAt?: string | null;
  revealWord: string | null;
};

type ReadCursor = { sessionId?: string | null; roundIndex?: number | null; afterSequence?: number | null };

function normalizedCursor(cursor: ReadCursor | undefined) {
  const roundIndex = Number(cursor?.roundIndex);
  const afterSequence = Number(cursor?.afterSequence);
  return {
    sessionId: typeof cursor?.sessionId === 'string' && cursor.sessionId.length > 0 ? cursor.sessionId : null,
    roundIndex: Number.isInteger(roundIndex) && roundIndex >= 0 ? roundIndex : null,
    afterSequence: Number.isInteger(afterSequence) && afterSequence >= -1 ? afterSequence : null,
  };
}

export async function getQuickDrawReadState(roomCodeValue: string, userId: string, cursor?: ReadCursor) {
  const admin = createAdminClient();
  const roomCode = normalizeRoomCode(roomCodeValue);
  const { data: room, error: roomError } = await admin.from('rooms')
    .select('id,join_code,host_user_id,status,ranking_visibility')
    .eq('join_code', roomCode)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!room || room.status === 'closed') throw new Error('Room is no longer available.');

  let member: { role: 'host' | 'participant' | 'spectator' | 'cohost'; participantId: string | null; nickname: string };
  if (room.host_user_id === userId) {
    member = { role: 'host', participantId: null, nickname: 'Host' };
  } else {
    const { data: participant, error } = await admin.from('participants')
      .select('id,role,nickname')
      .eq('room_id', room.id)
      .eq('auth_user_id', userId)
      .is('left_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!participant) throw new Error('You are not a member of this room.');
    member = { role: participant.role as 'participant' | 'spectator' | 'cohost', participantId: participant.id, nickname: participant.nickname };
  }

  const { data: sessionData, error: sessionError } = await admin.from('game_sessions')
    .select('id,room_id,game_type,config,state,status,started_at,ended_at')
    .eq('room_id', room.id)
    .eq('game_type', 'quick-draw')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionError) throw new Error(sessionError.message);
  if (!sessionData) throw new Error('No Quick Draw session exists for this room yet.');
  const session = sessionData as typeof sessionData & { config: QuickDrawConfig; state: QuickDrawState };

  const { data: round, error: roundError } = await admin.from('quick_draw_rounds')
    .select('id,game_session_id,round_index,artist_participant_id,secret_word,word_category,word_difficulty,started_at,deadline,ended_at,status')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex)
    .maybeSingle();
  if (roundError) throw new Error(roundError.message);
  if (!round) throw new Error('The current Quick Draw round could not be found.');

  const readCursor = normalizedCursor(cursor);
  const deltaMode = readCursor.sessionId === session.id
    && readCursor.roundIndex === session.state.roundIndex
    && readCursor.afterSequence !== null;

  let strokeQuery = admin.from('quick_draw_strokes')
    .select('sequence,payload')
    .eq('game_session_id', session.id)
    .eq('round_index', session.state.roundIndex);
  if (deltaMode) strokeQuery = strokeQuery.gt('sequence', readCursor.afterSequence as number);
  const { data: strokes, error: strokeError } = await strokeQuery.order('sequence', { ascending: true });
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

  const canSeeSecret = member.role === 'host' || member.participantId === session.state.currentArtistId || session.state.phase !== 'drawing';
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
      strokesAreDelta: deltaMode,
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
