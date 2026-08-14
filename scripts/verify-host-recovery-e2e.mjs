import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000';
if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Supabase integration environment is incomplete');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function createPermanent(label) {
  const email = `${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@qa.timefillergames.invalid`;
  const password = `Qa-${crypto.randomUUID()}-R1!`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) throw createError ?? new Error(`Could not create ${label}`);
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await client.auth.signInWithPassword({ email, password });
  if (authError || !auth.session) throw authError ?? new Error(`${label} could not sign in`);
  return { client, token: auth.session.access_token, userId: created.user.id };
}

async function createAnonymous() {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session || !data.user) throw error ?? new Error('Anonymous recovery player could not sign in');
  return { client, token: data.session.access_token, userId: data.user.id };
}

async function api(path, token, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${token}`);
  if (init.body) headers.set('content-type', 'application/json');
  const response = await fetch(`${appUrl}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  return payload;
}

const host = await createPermanent('recovery-host');
const cohost = await createPermanent('recovery-cohost');
const player2 = await createAnonymous();
const player3 = await createAnonymous();

const createdRoom = await api('/api/rooms', host.token, {
  method: 'POST',
  body: JSON.stringify({ minutes: 3, context: 'Friends', gameId: 'majority-match', hostCap: 6, roomLanguage: 'en', allowCustomPhotos: false, allowLateJoin: true, rankingVisibility: 'podium' }),
});
const roomCode = createdRoom?.room?.join_code;
if (!roomCode) throw new Error('Recovery room creation returned no code');

async function join(identity, nickname, avatarId) {
  const joined = await api(`/api/rooms/${encodeURIComponent(roomCode)}/join`, identity.token, {
    method: 'POST',
    body: JSON.stringify({ uiLanguage: 'en', avatarId, nickname }),
  });
  await api(`/api/rooms/${encodeURIComponent(roomCode)}/ready`, identity.token, {
    method: 'POST',
    body: JSON.stringify({ sessionToken: joined.participant.session_token, ready: true }),
  });
  return joined.participant;
}

const cohostSeat = await join(cohost, 'Recovery CoHost', 'animals:owl');
await join(player2, 'Recovery Player 2', 'animals:fox');
await join(player3, 'Recovery Player 3', 'fruits:mango');

const designation = await api(`/api/rooms/${encodeURIComponent(roomCode)}/cohost`, host.token, {
  method: 'PATCH',
  body: JSON.stringify({ participantId: cohostSeat.id }),
});
if (designation?.role !== 'cohost') throw new Error('Host could not designate the verified recovery co-host');

await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/majority-match`, host.token, {
  method: 'POST',
  body: JSON.stringify({ category: 'General', questionCount: 1, answerSeconds: 15, anonymousResults: false, showPercentages: true }),
});

const before = await api(`/api/rooms/${encodeURIComponent(roomCode)}/cohost`, cohost.token);
if (before?.isCoHost !== true || before?.canClaim !== false) throw new Error('Co-host recovery state is incorrect before Host becomes stale');
if (!Number.isFinite(before.recoveryGraceSeconds) || before.recoveryGraceSeconds < 30) {
  throw new Error(`Host recovery returned an unsafe grace period: ${JSON.stringify(before)}`);
}

// Simulate the Host heartbeat stopping without weakening the production minimum
// grace period or making CI sleep for more than 30 seconds.
const staleHeartbeat = new Date(Date.now() - (before.recoveryGraceSeconds + 5) * 1000).toISOString();
const { error: staleError } = await admin
  .from('rooms')
  .update({ host_last_seen_at: staleHeartbeat })
  .eq('join_code', roomCode)
  .eq('host_user_id', host.userId);
if (staleError) throw staleError;

const stale = await api(`/api/rooms/${encodeURIComponent(roomCode)}/cohost`, cohost.token);
if (stale?.canClaim !== true) throw new Error(`Co-host did not become recovery-eligible after QA grace period: ${JSON.stringify(stale)}`);

const claim = await api(`/api/rooms/${encodeURIComponent(roomCode)}/claim-host`, cohost.token, { method: 'POST' });
if (claim?.paused !== true) throw new Error('Host recovery did not pause the active game');

const recoveredRoom = await api(`/api/rooms/${encodeURIComponent(roomCode)}`, cohost.token);
if (recoveredRoom?.viewer?.isHost !== true || recoveredRoom?.room?.status !== 'paused') {
  throw new Error('Recovered co-host did not become authoritative Host of a paused room');
}
const recoveredGame = await api(`/api/rooms/${encodeURIComponent(roomCode)}/games/majority-match`, cohost.token);
if (recoveredGame?.session?.status !== 'paused') throw new Error('Recovered Majority Match session was not paused');

const oldHostResponse = await fetch(`${appUrl}/api/rooms/${encodeURIComponent(roomCode)}`, {
  headers: { authorization: `Bearer ${host.token}` },
});
if (oldHostResponse.status !== 403) {
  const oldHostPayload = await oldHostResponse.json().catch(() => ({}));
  throw new Error(`Original stale Host retained room access after transfer: ${oldHostResponse.status} ${JSON.stringify(oldHostPayload)}`);
}

await admin.from('rooms').delete().eq('id', recoveredRoom.room.id);
for (const identity of [host, cohost, player2, player3]) await admin.auth.admin.deleteUser(identity.userId);

console.log('Host recovery integration passed: verified co-host designation, stale grace, race-safe claim, automatic pause and authority transfer.');
