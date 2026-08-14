import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000';
if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Supabase integration environment is incomplete');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const hostEmail = `people-host-${Date.now()}@qa.timefillergames.invalid`;
const hostPassword = `Qa-${crypto.randomUUID()}-P1!`;
const { data: hostCreated, error: hostCreateError } = await admin.auth.admin.createUser({ email: hostEmail, password: hostPassword, email_confirm: true });
if (hostCreateError || !hostCreated.user) throw hostCreateError ?? new Error('Could not create People Bingo QA Host');

const hostClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: hostAuth, error: hostAuthError } = await hostClient.auth.signInWithPassword({ email: hostEmail, password: hostPassword });
if (hostAuthError || !hostAuth.session) throw hostAuthError ?? new Error('People Bingo QA Host could not sign in');
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
    minutes: 8,
    context: 'Friends',
    gameId: 'bingo',
    hostCap: 30,
    roomLanguage: 'en',
    allowCustomPhotos: false,
    allowLateJoin: false,
    rankingVisibility: 'podium',
  }),
});
const roomCode = created?.room?.join_code;
if (!roomCode) throw new Error('People Bingo room creation returned no join code');

const avatarIds = ['animals:fox', 'animals:panda', 'fruits:mango', 'fruits:apple', 'vegetables:carrot'];
const players = [];
for (let index = 0; index < 26; index += 1) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await client.auth.signInAnonymously();
  if (authError || !auth.session || !auth.user) throw authError ?? new Error(`Anonymous sign-in ${index + 1} failed`);
  const token = auth.session.access_token;
  const joined = await api(`/api/rooms/${encodeURIComponent(roomCode)}/join`, token, {
    method: 'POST',
    body: JSON.stringify({
      uiLanguage: index % 2 === 0 ? 'en' : 'zh-Hant',
      avatarId: avatarIds[index % avatarIds.length],
      nickname: `QA Player ${index + 1}`,
    }),
  });
  if (!joined?.participant?.session_token || !joined?.participant?.id) throw new Error(`Join ${index + 1} returned no participant seat`);
  await api(`/api/rooms/${encodeURIComponent(roomCode)}/ready`, token, {
    method: 'POST',
    body: JSON.stringify({ sessionToken: joined.participant.session_token, ready: true }),
  });
  players.push({ client, token, userId: auth.user.id });
}

const hostSnapshot = await api(`/api/rooms/${encodeURIComponent(roomCode)}`, hostToken);
if (hostSnapshot?.counts?.active !== 26 || hostSnapshot?.counts?.ready !== 26) {
  throw new Error(`Expected 26 active/ready People Bingo players, got ${JSON.stringify(hostSnapshot?.counts)}`);
}

const started = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people`, hostToken, {
  method: 'POST',
  body: JSON.stringify({ cardChoiceSeconds: 30 }),
});
const pool = started?.session?.state?.pool ?? [];
const directory = started?.session?.directory ?? {};
if (started?.session?.config?.mode !== 'people') throw new Error('People Bingo did not start in people mode');
if (pool.length !== 26 || new Set(pool).size !== 26) throw new Error(`Expected all 26 eligible identities in draw pool, got ${pool.length}`);
if (Object.keys(directory).length !== 26) throw new Error(`Expected 26 directory entries, got ${Object.keys(directory).length}`);
if (started?.session?.selection?.total !== 26) throw new Error('People Bingo selection total does not match active participants');

const poolSet = new Set(pool);
for (let index = 0; index < players.length; index += 1) {
  const state = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people`, players[index].token);
  const candidates = state?.session?.ownCard?.candidate_cards ?? [];
  if (candidates.length !== 3) throw new Error(`Player ${index + 1} did not receive three People Bingo candidates`);
  for (const card of candidates) {
    if (card.length !== 25 || new Set(card).size !== 25) throw new Error(`Player ${index + 1} received a non-unique/non-25-cell People Bingo card`);
    if (card.some((participantId) => !poolSet.has(participantId))) throw new Error('People Bingo card referenced an identity outside the eligible pool');
  }
  await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people/select`, players[index].token, {
    method: 'POST',
    body: JSON.stringify({ candidateIndex: index % 3 }),
  });
}

const draw = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people/draw`, hostToken, { method: 'POST' });
if (draw?.session?.state?.drawn?.length !== 1 || !poolSet.has(draw?.session?.state?.latestDraw)) {
  throw new Error('People Bingo did not produce one server-authoritative eligible identity draw');
}
await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/bingo/people/end`, hostToken, { method: 'POST' });

await admin.from('rooms').delete().eq('host_user_id', hostCreated.user.id);
for (const player of players) await admin.auth.admin.deleteUser(player.userId);
await admin.auth.admin.deleteUser(hostCreated.user.id);

console.log('26-player People Bingo integration passed: readiness, full eligible pool, 25-unique-cell cards for every player, selection, draw and end.');
