import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000';
if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Supabase integration environment is incomplete');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `games-host-${Date.now()}@qa.timefillergames.invalid`;
const password = `Qa-${crypto.randomUUID()}-G1!`;
const { data: hostCreated, error: hostCreateError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (hostCreateError || !hostCreated.user) throw hostCreateError ?? new Error('Could not create game QA Host');
const hostClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: hostAuth, error: hostAuthError } = await hostClient.auth.signInWithPassword({ email, password });
if (hostAuthError || !hostAuth.session) throw hostAuthError ?? new Error('Game QA Host could not sign in');
const hostToken = hostAuth.session.access_token;

async function api(path, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(`${appUrl}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

async function createRoom(gameId) {
  const result = await api('/api/rooms', hostToken, {
    method: 'POST',
    body: JSON.stringify({
      minutes: 5,
      context: 'Friends',
      gameId,
      hostCap: 8,
      roomLanguage: 'en',
      allowCustomPhotos: false,
      allowLateJoin: true,
      rankingVisibility: 'podium',
    }),
  });
  if (!result?.room?.join_code) throw new Error(`${gameId} room creation returned no code`);
  return result.room.join_code;
}

async function joinThree(roomCode) {
  const avatars = ['animals:fox', 'fruits:mango', 'vegetables:carrot'];
  const players = [];
  for (let index = 0; index < 3; index += 1) {
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await client.auth.signInAnonymously();
    if (authError || !auth.session || !auth.user) throw authError ?? new Error(`Player ${index + 1} anonymous sign-in failed`);
    const token = auth.session.access_token;
    const joined = await api(`/api/rooms/${encodeURIComponent(roomCode)}/join`, token, {
      method: 'POST',
      body: JSON.stringify({ uiLanguage: 'en', avatarId: avatars[index], nickname: `Game QA ${index + 1}` }),
    });
    await api(`/api/rooms/${encodeURIComponent(roomCode)}/ready`, token, {
      method: 'POST',
      body: JSON.stringify({ sessionToken: joined.participant.session_token, ready: true }),
    });
    players.push({ client, token, userId: auth.user.id, participantId: joined.participant.id });
  }
  return players;
}

const majorityRoom = await createRoom('majority-match');
const majorityPlayers = await joinThree(majorityRoom);
const majorityStarted = await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match`, hostToken, {
  method: 'POST',
  body: JSON.stringify({ category: 'General', questionCount: 1, answerSeconds: 15, anonymousResults: false, showPercentages: true }),
});
const choices = majorityStarted?.session?.state?.currentQuestion?.choices ?? [];
if (majorityStarted?.session?.state?.phase !== 'answering' || choices.length !== 4) throw new Error('Majority Match did not start with a four-choice answering round');

await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match/vote`, majorityPlayers[0].token, { method: 'POST', body: JSON.stringify({ choice: choices[0] }) });
await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match/vote`, majorityPlayers[1].token, { method: 'POST', body: JSON.stringify({ choice: choices[0] }) });
await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match/vote`, majorityPlayers[2].token, { method: 'POST', body: JSON.stringify({ choice: choices[1] }) });
const majorityReveal = await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match/reveal`, hostToken, { method: 'POST', body: JSON.stringify({ force: true }) });
if (majorityReveal?.session?.state?.phase !== 'revealing') throw new Error('Majority Match did not reveal');
if (majorityReveal?.session?.state?.reveal?.totalVotes !== 3) throw new Error('Majority Match reveal did not count all three votes');
if (!(majorityReveal?.session?.state?.reveal?.majorityChoices ?? []).includes(choices[0])) throw new Error('Majority Match majority choice was not server-computed correctly');
await api(`/api/rooms/${encodeURIComponent(majorityRoom)}/games/majority-match/end`, hostToken, { method: 'POST' });

const quickRoom = await createRoom('quick-draw');
const quickPlayers = await joinThree(quickRoom);
const quickStarted = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw`, hostToken, {
  method: 'POST',
  body: JSON.stringify({
    drawingSeconds: 30,
    artistTurns: 1,
    artistSelection: 'join-order',
    wordCategory: 'Everyday',
    wordDifficulty: 'easy',
    guessVisibility: 'hidden-until-correct',
    audienceGuessing: true,
    timeBonus: false,
  }),
});
if (quickStarted?.session?.state?.phase !== 'drawing') throw new Error('Quick Draw did not enter drawing phase');
const artistId = quickStarted?.session?.state?.currentArtistId;
const artist = quickPlayers.find((player) => player.participantId === artistId);
const guesser = quickPlayers.find((player) => player.participantId !== artistId);
if (!artist || !guesser) throw new Error('Could not resolve Quick Draw artist/guesser');

const artistState = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw`, artist.token);
const secretWord = artistState?.session?.secretWord;
if (typeof secretWord !== 'string' || !secretWord) throw new Error('Artist did not receive the Quick Draw secret word');
const guesserState = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw`, guesser.token);
if (guesserState?.session?.secretWord !== null) throw new Error('Quick Draw leaked the secret word to a guesser');

await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw/stroke`, artist.token, {
  method: 'POST',
  body: JSON.stringify({ payload: { type: 'stroke', points: [{ x: 0.15, y: 0.2 }, { x: 0.35, y: 0.4 }], width: 4 } }),
});
const afterStroke = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw`, guesser.token);
if (!(afterStroke?.session?.strokes ?? []).some((stroke) => stroke?.payload?.type === 'stroke')) throw new Error('Quick Draw stroke was not synchronized to a guesser snapshot');

const wrongGuess = `not-${secretWord}`;
const wrong = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw/guess`, guesser.token, { method: 'POST', body: JSON.stringify({ guess: wrongGuess }) });
if ((wrong?.session?.ownGuesses ?? []).at(-1)?.accepted === true) throw new Error('Quick Draw accepted an intentionally incorrect guess');
const correct = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw/guess`, guesser.token, { method: 'POST', body: JSON.stringify({ guess: secretWord }) });
if ((correct?.session?.ownGuesses ?? []).at(-1)?.accepted !== true) throw new Error('Quick Draw did not accept the exact secret word');

const revealed = await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw/finish`, hostToken, { method: 'POST', body: JSON.stringify({ force: true }) });
if (revealed?.session?.state?.phase !== 'revealing' || revealed?.session?.state?.revealWord !== secretWord) throw new Error('Quick Draw did not reveal the completed round word');
await api(`/api/rooms/${encodeURIComponent(quickRoom)}/games/quick-draw/end`, hostToken, { method: 'POST' });

await admin.from('rooms').delete().eq('host_user_id', hostCreated.user.id);
for (const player of [...majorityPlayers, ...quickPlayers]) await admin.auth.admin.deleteUser(player.userId);
await admin.auth.admin.deleteUser(hostCreated.user.id);

console.log('Majority Match and Quick Draw integration passed: votes/reveal/majority scoring boundary plus artist-only word secrecy, stroke sync, wrong/correct guesses, reveal and end.');
