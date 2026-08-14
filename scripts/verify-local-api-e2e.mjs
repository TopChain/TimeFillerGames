import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000';

if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Supabase integration environment is incomplete');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `host-${Date.now()}@qa.timefillergames.invalid`;
const password = `Qa-${crypto.randomUUID()}-A1!`;
const { data: createdHost, error: createHostError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (createHostError || !createdHost.user) throw createHostError ?? new Error('Could not create QA Host');

const hostClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: hostAuth, error: hostSignInError } = await hostClient.auth.signInWithPassword({ email, password });
if (hostSignInError || !hostAuth.session) throw hostSignInError ?? new Error('QA Host could not sign in');
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

const created = await api('/api/rooms', hostToken, {
  method: 'POST',
  body: JSON.stringify({
    minutes: 3,
    context: 'Friends',
    gameId: 'bingo',
    hostCap: 8,
    roomLanguage: 'en',
    allowCustomPhotos: false,
    allowLateJoin: true,
    rankingVisibility: 'podium',
  }),
});
const roomCode = created?.room?.join_code;
if (typeof roomCode !== 'string' || roomCode.length < 4) throw new Error('Room creation did not return a join code');

async function makePlayer(index) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) throw error ?? new Error(`Player ${index} anonymous sign-in failed`);
  const token = data.session.access_token;
  const joined = await api(`/api/rooms/${encodeURIComponent(roomCode)}/join`, token, {
    method: 'POST',
    body: JSON.stringify({
      uiLanguage: index === 1 ? 'es' : 'ja',
      avatarId: index === 1 ? 'animals:fox' : 'fruits:mango',
      nickname: index === 1 ? 'Swift Fox' : 'Lucky Mango',
    }),
  });
  const participant = joined?.participant;
  if (!participant?.session_token || !participant?.id) throw new Error(`Player ${index} join did not return a seat`);
  await api(`/api/rooms/${encodeURIComponent(roomCode)}/ready`, token, {
    method: 'POST',
    body: JSON.stringify({ sessionToken: participant.session_token, ready: true }),
  });
  return { client, token, participant };
}

const [player1, player2] = await Promise.all([makePlayer(1), makePlayer(2)]);
const hostSnapshot = await api(`/api/rooms/${encodeURIComponent(roomCode)}`, hostToken);
if (hostSnapshot?.counts?.active !== 2 || hostSnapshot?.counts?.ready !== 2) {
  throw new Error(`Host roster aggregate mismatch: ${JSON.stringify(hostSnapshot?.counts)}`);
}

const playerSnapshot = await api(`/api/rooms/${encodeURIComponent(roomCode)}`, player1.token);
if (playerSnapshot?.viewer?.isHost !== false) throw new Error('Player snapshot incorrectly has Host authority');
if ((playerSnapshot?.participants ?? []).some((row) => row.session_token)) throw new Error('Player snapshot exposed a seat token');

const bingo = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo`, hostToken, {
  method: 'POST',
  body: JSON.stringify({ boardSize: 5, cardChoiceSeconds: 10 }),
});
if (bingo?.session?.state?.phase !== 'card-selection') throw new Error('Bingo did not enter card-selection phase');

for (const [player, candidateIndex] of [[player1, 0], [player2, 1]]) {
  const state = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo`, player.token);
  if (state?.ownCard?.candidate_cards?.length !== 3) throw new Error('Bingo player did not receive exactly three candidate cards');
  await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/select`, player.token, {
    method: 'POST',
    body: JSON.stringify({ candidateIndex }),
  });
}

const draw = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/draw`, hostToken, { method: 'POST' });
if (draw?.session?.state?.drawn?.length !== 1 || draw?.session?.state?.latestDraw == null) {
  throw new Error('Server-authoritative Bingo draw did not advance exactly once');
}

await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/end`, hostToken, { method: 'POST' });

await admin.auth.admin.deleteUser(createdHost.user.id);
await admin.auth.admin.deleteUser((await player1.client.auth.getUser()).data.user?.id ?? '');
await admin.auth.admin.deleteUser((await player2.client.auth.getUser()).data.user?.id ?? '');

console.log('Local API E2E passed: permanent Host auth, room creation, two anonymous joins, Ready aggregation, snapshot privacy, Bingo candidate selection, server draw, and game end.');
