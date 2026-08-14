import { performance } from 'node:perf_hooks';
import { createClient } from '@supabase/supabase-js';

const baseUrl = String(process.env.STAGING_BASE_URL ?? '').replace(/\/$/, '');
const supabaseUrl = String(process.env.STAGING_SUPABASE_URL ?? '');
const publishableKey = String(process.env.STAGING_SUPABASE_PUBLISHABLE_KEY ?? '');
const hostToken = String(process.env.LOAD_TEST_HOST_TOKEN ?? '');
const playerCount = Math.max(3, Math.min(100, Number(process.env.LOAD_TEST_PLAYERS ?? 30)));

if (!baseUrl.startsWith('https://')) throw new Error('STAGING_BASE_URL must be a real HTTPS origin.');
if (!supabaseUrl.startsWith('https://')) throw new Error('STAGING_SUPABASE_URL must be a real HTTPS Supabase origin.');
if (!publishableKey) throw new Error('STAGING_SUPABASE_PUBLISHABLE_KEY is required.');
if (!hostToken) throw new Error('LOAD_TEST_HOST_TOKEN is required for the temporary Host room.');

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return Math.round(sorted[index]);
}

async function api(path, token, init = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const elapsedMs = performance.now() - started;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status, elapsedMs });
  }
  return { body, elapsedMs };
}

async function createGuest(index) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session?.access_token) throw new Error(`Guest ${index + 1} auth failed: ${error?.message ?? 'no session'}`);
  return { client, token: data.session.access_token };
}

let roomCode = null;
const guests = [];
try {
  const created = await api('/api/rooms', hostToken, {
    method: 'POST',
    body: JSON.stringify({
      minutes: 3,
      context: 'Friends',
      gameId: 'majority-match',
      hostCap: null,
      roomLanguage: 'en',
      allowCustomPhotos: false,
      allowLateJoin: true,
      rankingVisibility: 'podium',
    }),
  });
  roomCode = created.body?.room?.join_code;
  if (!roomCode) throw new Error('Temporary load-test room did not return a join code.');

  const authStarted = performance.now();
  const guestResults = await Promise.allSettled(Array.from({ length: playerCount }, (_, index) => createGuest(index)));
  const authMs = performance.now() - authStarted;
  const authFailures = guestResults.filter((result) => result.status === 'rejected');
  if (authFailures.length) throw new Error(`${authFailures.length}/${playerCount} anonymous auth requests failed.`);
  for (const result of guestResults) if (result.status === 'fulfilled') guests.push(result.value);

  const joinResults = await Promise.allSettled(guests.map(async (guest, index) => {
    const result = await api(`/api/rooms/${roomCode}/join`, guest.token, {
      method: 'POST',
      body: JSON.stringify({
        uiLanguage: 'en',
        avatarId: index % 2 === 0 ? 'animals:panda' : 'fruits:apple',
        nickname: `Load Player ${String(index + 1).padStart(2, '0')}`,
      }),
    });
    return { ...result, sessionToken: result.body?.participant?.session_token };
  }));

  const joined = joinResults.filter((result) => result.status === 'fulfilled');
  const joinFailures = joinResults.filter((result) => result.status === 'rejected');
  const joinLatencies = joined.map((result) => result.value.elapsedMs);
  if (joinFailures.length) {
    console.error('Join failures:', joinFailures.map((result) => result.reason?.message ?? String(result.reason)));
  }

  const heartbeatResults = await Promise.allSettled(joined.map((result, index) => api(
    `/api/rooms/${roomCode}/heartbeat`,
    guests[index].token,
    { method: 'POST', body: JSON.stringify({ sessionToken: result.value.sessionToken }) },
  )));
  const heartbeatSuccesses = heartbeatResults.filter((result) => result.status === 'fulfilled');
  const heartbeatLatencies = heartbeatSuccesses.map((result) => result.value.elapsedMs);

  const snapshotResults = await Promise.allSettled(guests.slice(0, Math.min(10, guests.length)).map((guest) =>
    api(`/api/rooms/${roomCode}`, guest.token, { method: 'GET' })
  ));
  const snapshotSuccesses = snapshotResults.filter((result) => result.status === 'fulfilled');
  const snapshotLatencies = snapshotSuccesses.map((result) => result.value.elapsedMs);

  const report = {
    roomCode,
    requestedPlayers: playerCount,
    anonymousAuth: { success: guests.length, failed: authFailures.length, totalMs: Math.round(authMs) },
    joins: {
      success: joined.length,
      failed: joinFailures.length,
      p50Ms: percentile(joinLatencies, 50),
      p95Ms: percentile(joinLatencies, 95),
      maxMs: Math.round(Math.max(0, ...joinLatencies)),
    },
    heartbeats: {
      success: heartbeatSuccesses.length,
      failed: heartbeatResults.length - heartbeatSuccesses.length,
      p95Ms: percentile(heartbeatLatencies, 95),
      maxMs: Math.round(Math.max(0, ...heartbeatLatencies)),
    },
    snapshots: {
      success: snapshotSuccesses.length,
      failed: snapshotResults.length - snapshotSuccesses.length,
      p95Ms: percentile(snapshotLatencies, 95),
      maxMs: Math.round(Math.max(0, ...snapshotLatencies)),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (joinFailures.length || heartbeatResults.some((result) => result.status === 'rejected') || snapshotResults.some((result) => result.status === 'rejected')) {
    process.exitCode = 1;
  }
} finally {
  if (roomCode) {
    try {
      await api(`/api/rooms/${roomCode}`, hostToken, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) });
    } catch (error) {
      console.error(`Could not close temporary load-test room ${roomCode}:`, error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
  await Promise.allSettled(guests.map(({ client }) => client.auth.signOut()));
}
