import { createClient } from '@supabase/supabase-js';

const baseUrl = String(process.env.STAGING_BASE_URL ?? '').replace(/\/$/, '');
const supabaseUrl = String(process.env.STAGING_SUPABASE_URL ?? '');
const publishableKey = String(process.env.STAGING_SUPABASE_PUBLISHABLE_KEY ?? '');
const hostToken = String(process.env.E2E_HOST_TOKEN ?? process.env.LOAD_TEST_HOST_TOKEN ?? '');

if (!baseUrl.startsWith('https://')) throw new Error('STAGING_BASE_URL must be a real HTTPS origin.');
if (!supabaseUrl.startsWith('https://')) throw new Error('STAGING_SUPABASE_URL must be a real HTTPS Supabase origin.');
if (!publishableKey) throw new Error('STAGING_SUPABASE_PUBLISHABLE_KEY is required.');
if (!hostToken) throw new Error('E2E_HOST_TOKEN (or LOAD_TEST_HOST_TOKEN) is required.');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(path, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path}: ${typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`}`);
  }
  return payload;
}

async function guest(index) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session?.access_token) throw new Error(`Anonymous test identity ${index} failed: ${error?.message ?? 'no session'}`);
  return { client, token: data.session.access_token, participant: null };
}

async function createRoom(gameId) {
  const result = await api('/api/rooms', hostToken, {
    method: 'POST',
    body: JSON.stringify({
      minutes: 3,
      context: 'Friends',
      gameId,
      hostCap: null,
      roomLanguage: 'en',
      allowCustomPhotos: false,
      allowLateJoin: true,
      rankingVisibility: 'podium',
    }),
  });
  const code = result?.room?.join_code;
  assert(typeof code === 'string' && code.length >= 4, `${gameId}: room creation did not return a join code.`);
  return code;
}

async function joinPlayers(roomCode, count, label) {
  const players = await Promise.all(Array.from({ length: count }, (_, i) => guest(i + 1)));
  try {
    await Promise.all(players.map(async (player, index) => {
      const result = await api(`/api/rooms/${roomCode}/join`, player.token, {
        method: 'POST',
        body: JSON.stringify({
          uiLanguage: 'en',
          avatarId: index % 2 === 0 ? 'animals:panda' : 'fruits:apple',
          nickname: `${label} ${index + 1}`,
        }),
      });
      assert(result?.participant?.id, `${label}: player ${index + 1} join did not return an id.`);
      assert(result?.participant?.session_token, `${label}: player ${index + 1} join did not return a seat token.`);
      player.participant = result.participant;
    }));
    return players;
  } catch (error) {
    await Promise.allSettled(players.map(({ client }) => client.auth.signOut()));
    throw error;
  }
}

async function closeRoom(roomCode) {
  try {
    await api(`/api/rooms/${roomCode}`, hostToken, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) });
  } catch (error) {
    console.error(`Cleanup warning for room ${roomCode}:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

async function cleanupPlayers(players) {
  await Promise.allSettled(players.map(({ client }) => client.auth.signOut()));
}

async function runStandardBingo() {
  const roomCode = await createRoom('bingo');
  const players = await joinPlayers(roomCode, 3, 'Bingo E2E');
  try {
    const started = await api(`/api/rooms/${roomCode}/games/bingo`, hostToken, {
      method: 'POST', body: JSON.stringify({ boardSize: 5, cardChoiceSeconds: 10 }),
    });
    assert(started?.session?.state?.phase === 'card-selection', 'Bingo: did not enter card-selection phase.');

    await Promise.all(players.map((player) => api(`/api/rooms/${roomCode}/games/bingo/select`, player.token, {
      method: 'POST', body: JSON.stringify({ candidateIndex: 0 }),
    })));

    const before = await api(`/api/rooms/${roomCode}/games/bingo`, hostToken);
    assert(before?.session?.state?.phase === 'drawing', 'Bingo: selecting all cards did not enter drawing phase.');
    assert(before?.session?.cardSelection?.selected === 3, 'Bingo: expected all 3 cards to be selected.');

    // Exercise the retry/double-click boundary. Depending on scheduling, the requests may
    // serialize into one or two valid draws, but both must return authoritative state and
    // the committed draw history must remain unique/monotonic.
    const [drawA, drawB] = await Promise.all([
      api(`/api/rooms/${roomCode}/games/bingo/draw`, hostToken, { method: 'POST' }),
      api(`/api/rooms/${roomCode}/games/bingo/draw`, hostToken, { method: 'POST' }),
    ]);
    assert(drawA?.session?.state?.drawn && drawB?.session?.state?.drawn, 'Bingo: concurrent draw responses did not return state.');

    const after = await api(`/api/rooms/${roomCode}/games/bingo`, hostToken);
    const drawn = after?.session?.state?.drawn ?? [];
    assert(drawn.length >= 1 && drawn.length <= 2, `Bingo: expected 1–2 committed draws after two concurrent requests, got ${drawn.length}.`);
    assert(new Set(drawn).size === drawn.length, 'Bingo: draw history contains a duplicate number.');
    assert(after?.session?.state?.latestDraw === drawn.at(-1), 'Bingo: latestDraw does not match committed history.');

    await api(`/api/rooms/${roomCode}/games/bingo/end`, hostToken, { method: 'POST' });
    console.log(`✓ Standard Bingo E2E (${roomCode})`);
  } finally {
    await closeRoom(roomCode);
    await cleanupPlayers(players);
  }
}

async function runMajorityMatch() {
  const roomCode = await createRoom('majority-match');
  const players = await joinPlayers(roomCode, 3, 'Majority E2E');
  try {
    const started = await api(`/api/rooms/${roomCode}/games/majority-match`, hostToken, {
      method: 'POST',
      body: JSON.stringify({ category: 'General', questionCount: 1, answerSeconds: 10, anonymousResults: true, showPercentages: true }),
    });
    const choices = started?.session?.state?.currentQuestion?.choices;
    assert(Array.isArray(choices) && choices.length === 4, 'Majority: current question did not have four choices.');
    const [choiceA, choiceB] = choices;

    await Promise.all([
      api(`/api/rooms/${roomCode}/games/majority-match/vote`, players[0].token, { method: 'POST', body: JSON.stringify({ choice: choiceA }) }),
      api(`/api/rooms/${roomCode}/games/majority-match/vote`, players[1].token, { method: 'POST', body: JSON.stringify({ choice: choiceA }) }),
      api(`/api/rooms/${roomCode}/games/majority-match/vote`, players[2].token, { method: 'POST', body: JSON.stringify({ choice: choiceB }) }),
    ]);

    // Send duplicate forced reveals concurrently; the DB transition guard must make the
    // second request harmless rather than double-scoring or replacing the first reveal.
    await Promise.all([
      api(`/api/rooms/${roomCode}/games/majority-match/reveal`, hostToken, { method: 'POST', body: JSON.stringify({ force: true }) }),
      api(`/api/rooms/${roomCode}/games/majority-match/reveal`, hostToken, { method: 'POST', body: JSON.stringify({ force: true }) }),
    ]);

    const revealed = await api(`/api/rooms/${roomCode}/games/majority-match`, hostToken);
    assert(revealed?.session?.state?.phase === 'revealing', 'Majority: reveal phase was not committed.');
    assert(revealed?.session?.state?.reveal?.majorityChoices?.includes(choiceA), 'Majority: expected the 2-of-3 choice to be the majority.');
    const rankingById = new Map((revealed?.session?.rankings ?? []).map((row) => [row.participant_id, row]));
    assert(rankingById.get(players[0].participant.id)?.points === 1000, 'Majority: first majority voter did not receive 1000 points.');
    assert(rankingById.get(players[1].participant.id)?.points === 1000, 'Majority: second majority voter did not receive 1000 points.');
    assert((rankingById.get(players[2].participant.id)?.points ?? 0) === 0, 'Majority: minority voter unexpectedly received points.');

    await api(`/api/rooms/${roomCode}/games/majority-match/end`, hostToken, { method: 'POST' });
    console.log(`✓ Majority Match E2E (${roomCode})`);
  } finally {
    await closeRoom(roomCode);
    await cleanupPlayers(players);
  }
}

async function runQuickDraw() {
  const roomCode = await createRoom('quick-draw');
  const players = await joinPlayers(roomCode, 3, 'QuickDraw E2E');
  try {
    const started = await api(`/api/rooms/${roomCode}/games/quick-draw`, hostToken, {
      method: 'POST',
      body: JSON.stringify({
        drawingSeconds: 30,
        artistTurns: 1,
        artistSelection: 'join-order',
        wordCategory: 'Everyday',
        wordDifficulty: 'easy',
        guessVisibility: 'hidden-until-correct',
        audienceGuessing: true,
        timeBonus: true,
      }),
    });
    const artistId = started?.session?.state?.currentArtistId;
    const secretWord = started?.session?.secretWord;
    assert(typeof artistId === 'string', 'Quick Draw: current artist was not assigned.');
    assert(typeof secretWord === 'string' && secretWord.length > 0, 'Quick Draw: Host could not see the server-selected secret word.');
    const guesser = players.find((player) => player.participant.id !== artistId);
    assert(guesser, 'Quick Draw: could not select a non-artist guesser.');

    const guessed = await api(`/api/rooms/${roomCode}/games/quick-draw/guess`, guesser.token, {
      method: 'POST', body: JSON.stringify({ guess: secretWord }),
    });
    const ownAccepted = guessed?.session?.ownGuesses?.some((guess) => guess.accepted === true && guess.points_awarded > 0);
    assert(ownAccepted, 'Quick Draw: exact secret-word guess was not accepted/scored.');

    const finished = await api(`/api/rooms/${roomCode}/games/quick-draw/finish`, hostToken, {
      method: 'POST', body: JSON.stringify({ force: true }),
    });
    assert(finished?.session?.state?.phase === 'revealing', 'Quick Draw: finish did not reveal the round.');
    const guesserRanking = (finished?.session?.rankings ?? []).find((row) => row.participant_id === guesser.participant.id);
    assert((guesserRanking?.points ?? 0) > 0, 'Quick Draw: accepted guess did not appear in authoritative ranking.');

    // Verify the incremental read contract on the deployed API. A cursor at -1 is valid
    // and must return delta metadata for the current session/round.
    const sessionId = finished.session.id;
    const roundIndex = finished.session.state.roundIndex;
    const delta = await api(`/api/rooms/${roomCode}/games/quick-draw?session=${encodeURIComponent(sessionId)}&round=${roundIndex}&after=-1`, hostToken);
    assert(delta?.session?.strokesAreDelta === true, 'Quick Draw: matching cursor did not activate delta mode.');

    await api(`/api/rooms/${roomCode}/games/quick-draw/end`, hostToken, { method: 'POST' });
    console.log(`✓ Quick Draw E2E (${roomCode})`);
  } finally {
    await closeRoom(roomCode);
    await cleanupPlayers(players);
  }
}

const startedAt = Date.now();
await runStandardBingo();
await runMajorityMatch();
await runQuickDraw();
console.log(`✓ Release 1 staging E2E complete in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
