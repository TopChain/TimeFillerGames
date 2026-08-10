import 'server-only';

import { createAdminClient } from './supabase/admin';
import { normalizeRoomCode } from './room-flow';
import { majorityResult, shuffle } from './release1-games';
import { rankWithCompetitionTies } from './game-rules';
import { majorityQuestionsForCategory, type MajorityCategory, type MajorityQuestion } from './majority-match-content';

const CATEGORIES: MajorityCategory[] = ['Classroom', 'Friends', 'Family', 'Workplace', 'General'];

type MajorityConfig = {
  category: MajorityCategory;
  questionCount: number;
  answerSeconds: number;
  anonymousResults: boolean;
  showPercentages: boolean;
  speedBonus: false;
};

type MajorityReveal = {
  counts: Record<string, number>;
  majorityChoices: string[];
  percentages: Record<string, number> | null;
  totalVotes: number;
};

type MajorityState = {
  phase: 'answering' | 'revealing' | 'ended';
  roundIndex: number;
  questionIds: string[];
  currentQuestion: MajorityQuestion;
  deadline: string;
  reveal: MajorityReveal | null;
};

function validateCategory(value: unknown): MajorityCategory {
  const category = String(value ?? 'General') as MajorityCategory;
  if (!CATEGORIES.includes(category)) throw new Error('Choose a supported Majority Match category.');
  return category;
}

function validateQuestionCount(value: unknown, category: MajorityCategory) {
  const count = Number(value);
  const available = majorityQuestionsForCategory(category).length;
  if (!Number.isInteger(count) || count < 1 || count > available) throw new Error(`Choose between 1 and ${available} Majority Match questions for this starter content bank.`);
  return count;
}

function validateAnswerSeconds(value: unknown) {
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 10 || seconds > 45) throw new Error('Answer timer must be between 10 and 45 seconds.');
  return seconds;
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

async function roomMember(roomId: string, userId: string, hostUserId: string | null) {
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

async function latestSession(roomId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('game_sessions')
    .select('id,room_id,game_type,config,state,status,started_at,ended_at')
    .eq('room_id', roomId)
    .eq('game_type', 'majority-match')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No Majority Match session exists for this room yet.');
  return data as typeof data & { config: MajorityConfig; state: MajorityState };
}

function currentRoundId(state: MajorityState) {
  return `round-${state.roundIndex + 1}`;
}

function questionById(category: MajorityCategory, id: string) {
  const question = majorityQuestionsForCategory(category).find((candidate) => candidate.id === id);
  if (!question) throw new Error('Majority Match question content is unavailable.');
  return question;
}

export async function startMajorityMatch(roomCodeValue: string, hostUserId: string, input: {
  category: unknown;
  questionCount: unknown;
  answerSeconds: unknown;
  anonymousResults?: unknown;
  showPercentages?: unknown;
}) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can start Majority Match.');
  if (room.game_type !== 'majority-match') throw new Error('The room is not configured for Majority Match.');
  if (!['lobby', 'results'].includes(room.status)) throw new Error('Return the room to the lobby before starting Majority Match.');

  const category = validateCategory(input.category);
  const questionCount = validateQuestionCount(input.questionCount, category);
  const answerSeconds = validateAnswerSeconds(input.answerSeconds);
  const config: MajorityConfig = {
    category,
    questionCount,
    answerSeconds,
    anonymousResults: input.anonymousResults !== false,
    showPercentages: input.showPercentages !== false,
    speedBonus: false,
  };

  const { data: participants, error: participantError } = await admin.from('participants')
    .select('id,role')
    .eq('room_id', room.id)
    .is('left_at', null);
  if (participantError) throw new Error(participantError.message);
  const active = (participants ?? []).filter((participant) => participant.role !== 'spectator');
  if (active.length < 3) throw new Error(`${3 - active.length} more player${active.length === 2 ? '' : 's'} required for Majority Match.`);

  const questions = shuffle(majorityQuestionsForCategory(category)).slice(0, questionCount);
  const now = Date.now();
  const state: MajorityState = {
    phase: 'answering',
    roundIndex: 0,
    questionIds: questions.map((question) => question.id),
    currentQuestion: questions[0],
    deadline: new Date(now + answerSeconds * 1000).toISOString(),
    reveal: null,
  };

  await admin.from('game_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('room_id', room.id).eq('status', 'active');
  const { data: session, error: sessionError } = await admin.from('game_sessions').insert({
    room_id: room.id,
    game_type: 'majority-match',
    config,
    state,
    status: 'active',
    started_at: new Date(now).toISOString(),
  }).select('id').single();
  if (sessionError || !session) throw new Error(sessionError?.message ?? 'Could not create Majority Match session.');

  const { error: roomError } = await admin.from('rooms').update({ status: 'playing' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getMajorityMatchState(room.join_code, hostUserId);
}

export async function submitMajorityVote(roomCodeValue: string, userId: string, choiceValue: unknown) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await roomMember(room.id, userId, room.host_user_id);
  if (!member.participantId || member.role === 'spectator') throw new Error('Only an active participant can submit a Majority Match prediction.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'answering') throw new Error('Voting is not open.');
  if (Date.now() > new Date(session.state.deadline).getTime()) throw new Error('Voting has closed for this question.');

  const choice = String(choiceValue ?? '');
  if (!session.state.currentQuestion.choices.includes(choice)) throw new Error('Choose one of the available answers.');
  const { error } = await admin.from('submissions').insert({
    game_session_id: session.id,
    participant_id: member.participantId,
    round_id: currentRoundId(session.state),
    payload: { choice },
  });
  if (error?.code === '23505') throw new Error('Your prediction for this question is already locked.');
  if (error) throw new Error(error.message);
  return getMajorityMatchState(room.join_code, userId);
}

export async function revealMajorityQuestion(roomCodeValue: string, hostUserId: string, force = false) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can reveal Majority Match results.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'answering') throw new Error('This question is not accepting votes.');

  const roundId = currentRoundId(session.state);
  const { data: votes, error: voteError } = await admin.from('submissions')
    .select('participant_id,payload')
    .eq('game_session_id', session.id)
    .eq('round_id', roundId);
  if (voteError) throw new Error(voteError.message);
  const { count: activeCount, error: activeError } = await admin.from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .is('left_at', null)
    .neq('role', 'spectator');
  if (activeError) throw new Error(activeError.message);

  const deadlinePassed = Date.now() >= new Date(session.state.deadline).getTime();
  if (!force && !deadlinePassed && (votes?.length ?? 0) < (activeCount ?? 0)) throw new Error('Voting is still open. Wait for the timer or all active players to answer.');

  const voteMap = Object.fromEntries((votes ?? []).map((vote) => [vote.participant_id, String((vote.payload as { choice?: unknown })?.choice ?? '')]));
  const result = majorityResult(voteMap);
  const totalVotes = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
  const percentages = session.config.showPercentages
    ? Object.fromEntries(Object.entries(result.counts).map(([choice, count]) => [choice, totalVotes ? Math.round((count / totalVotes) * 100) : 0]))
    : null;

  const winners = Object.entries(result.points).filter(([, points]) => points === 1).map(([participantId]) => participantId);
  if (winners.length) {
    const { error: scoreError } = await admin.from('score_entries').insert(winners.map((participantId) => ({
      game_session_id: session.id,
      participant_id: participantId,
      points: 1000,
      reason: roundId,
    })));
    if (scoreError) throw new Error(scoreError.message);
  }

  const reveal: MajorityReveal = {
    counts: result.counts,
    majorityChoices: result.majorityChoices,
    percentages,
    totalVotes,
  };
  const nextState: MajorityState = { ...session.state, phase: 'revealing', reveal };
  const { error: updateError } = await admin.from('game_sessions').update({ state: nextState }).eq('id', session.id).eq('status', 'active');
  if (updateError) throw new Error(updateError.message);
  return getMajorityMatchState(room.join_code, hostUserId);
}

export async function advanceMajorityQuestion(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can advance Majority Match.');
  const session = await latestSession(room.id);
  if (session.status !== 'active' || session.state.phase !== 'revealing') throw new Error('Reveal the current result before advancing.');

  const nextIndex = session.state.roundIndex + 1;
  if (nextIndex >= session.config.questionCount) {
    const endedState: MajorityState = { ...session.state, phase: 'ended' };
    const { error: sessionError } = await admin.from('game_sessions').update({ status: 'ended', state: endedState, ended_at: new Date().toISOString() }).eq('id', session.id);
    if (sessionError) throw new Error(sessionError.message);
    const { error: roomError } = await admin.from('rooms').update({ status: 'results' }).eq('id', room.id).eq('host_user_id', hostUserId);
    if (roomError) throw new Error(roomError.message);
    return getMajorityMatchState(room.join_code, hostUserId);
  }

  const nextQuestion = questionById(session.config.category, session.state.questionIds[nextIndex]);
  const nextState: MajorityState = {
    ...session.state,
    phase: 'answering',
    roundIndex: nextIndex,
    currentQuestion: nextQuestion,
    deadline: new Date(Date.now() + session.config.answerSeconds * 1000).toISOString(),
    reveal: null,
  };
  const { error } = await admin.from('game_sessions').update({ state: nextState }).eq('id', session.id).eq('status', 'active');
  if (error) throw new Error(error.message);
  return getMajorityMatchState(room.join_code, hostUserId);
}

export async function endMajorityMatch(roomCodeValue: string, hostUserId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  if (room.host_user_id !== hostUserId) throw new Error('Only the Host can end Majority Match.');
  const session = await latestSession(room.id);
  if (session.status !== 'ended') {
    const state: MajorityState = { ...session.state, phase: 'ended' };
    const { error } = await admin.from('game_sessions').update({ status: 'ended', state, ended_at: new Date().toISOString() }).eq('id', session.id);
    if (error) throw new Error(error.message);
  }
  const { error: roomError } = await admin.from('rooms').update({ status: 'results' }).eq('id', room.id).eq('host_user_id', hostUserId);
  if (roomError) throw new Error(roomError.message);
  return getMajorityMatchState(room.join_code, hostUserId);
}

export async function getMajorityMatchState(roomCodeValue: string, userId: string) {
  const admin = createAdminClient();
  const room = await roomByCode(roomCodeValue);
  const member = await roomMember(room.id, userId, room.host_user_id);
  const session = await latestSession(room.id);
  const roundId = currentRoundId(session.state);

  const { count: submittedCount, error: submissionCountError } = await admin.from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('game_session_id', session.id)
    .eq('round_id', roundId);
  if (submissionCountError) throw new Error(submissionCountError.message);

  let ownChoice: string | null = null;
  if (member.participantId) {
    const { data: ownSubmission, error } = await admin.from('submissions')
      .select('payload')
      .eq('game_session_id', session.id)
      .eq('participant_id', member.participantId)
      .eq('round_id', roundId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    ownChoice = ownSubmission ? String((ownSubmission.payload as { choice?: unknown })?.choice ?? '') : null;
  }

  const { data: scores, error: scoreError } = await admin.from('score_entries')
    .select('participant_id,points')
    .eq('game_session_id', session.id);
  if (scoreError) throw new Error(scoreError.message);
  const totals = new Map<string, number>();
  for (const score of scores ?? []) totals.set(score.participant_id, (totals.get(score.participant_id) ?? 0) + score.points);

  const participantIds = [...totals.keys()];
  const { data: people, error: peopleError } = participantIds.length
    ? await admin.from('participants').select('id,nickname,avatar_key').in('id', participantIds)
    : { data: [], error: null };
  if (peopleError) throw new Error(peopleError.message);
  const peopleMap = new Map((people ?? []).map((person) => [person.id, person]));
  const ranked = rankWithCompetitionTies([...totals.entries()].map(([id, score]) => ({ id, score }))).map((entry) => ({
    participant_id: entry.id,
    nickname: peopleMap.get(entry.id)?.nickname ?? 'Player',
    avatarKey: peopleMap.get(entry.id)?.avatar_key ?? null,
    points: entry.score,
    placement: entry.rank,
  }));

  const ownResult = member.participantId
    ? ranked.find((entry) => entry.participant_id === member.participantId) ?? { participant_id: member.participantId, nickname: 'Player', avatarKey: null, points: 0, placement: ranked.length + 1 }
    : null;

  const publicRankings = member.role === 'host'
    ? ranked
    : room.ranking_visibility === 'public'
      ? ranked
      : room.ranking_visibility === 'top10'
        ? ranked.slice(0, 10)
        : room.ranking_visibility === 'private'
          ? []
          : ranked.slice(0, 3);

  return {
    room: { joinCode: room.join_code, status: room.status, rankingVisibility: room.ranking_visibility },
    session: {
      id: session.id,
      status: session.status,
      config: session.config,
      state: session.state,
      submittedCount: submittedCount ?? 0,
      ownChoice,
      rankings: publicRankings,
      ownResult,
    },
  };
}
