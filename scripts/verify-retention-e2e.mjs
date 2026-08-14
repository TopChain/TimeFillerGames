import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_BASE_URL ?? 'http://127.0.0.1:3000';
const cronSecret = process.env.CRON_SECRET;
if (!supabaseUrl || !serviceRoleKey || !cronSecret) throw new Error('Retention integration environment is incomplete');

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const expiredAt = new Date(Date.now() - 60_000).toISOString();
const oldBucketAt = new Date(Date.now() - 48 * 60 * 60_000).toISOString();

const { data: room, error: roomError } = await admin.from('rooms').insert({
  join_code: `RT${Date.now().toString(36).slice(-6).toUpperCase()}`,
  status: 'closed',
  room_language: 'en',
  expires_at: expiredAt,
}).select('id').single();
if (roomError || !room) throw roomError ?? new Error('Could not create expired retention room');

const { data: game, error: gameError } = await admin.from('game_sessions').insert({
  room_id: room.id,
  game_type: 'bingo',
  config: {},
  state: {},
  status: 'ended',
  started_at: oldBucketAt,
  ended_at: expiredAt,
}).select('id').single();
if (gameError || !game) throw gameError ?? new Error('Could not create linked expired game session');

const bucketKey = `retention-e2e-${crypto.randomUUID()}`;
const { error: bucketError } = await admin.from('server_rate_limits').insert({
  bucket_key: bucketKey,
  window_started_at: oldBucketAt,
  request_count: 1,
  updated_at: oldBucketAt,
});
if (bucketError) throw bucketError;

const denied = await fetch(`${appUrl}/api/cron/retention`, { cache: 'no-store' });
if (denied.status !== 401) throw new Error(`Retention endpoint did not fail closed without cron auth: ${denied.status}`);

const response = await fetch(`${appUrl}/api/cron/retention`, {
  headers: { Authorization: `Bearer ${cronSecret}` },
  cache: 'no-store',
});
const payload = await response.json().catch(() => ({}));
if (!response.ok || payload?.ok !== true || payload?.deletedRooms < 1 || payload?.deletedRateLimitBuckets < 1) {
  throw new Error(`Authenticated retention cleanup failed: HTTP ${response.status} ${JSON.stringify(payload)}`);
}

const { data: rooms, error: roomsError } = await admin.from('rooms').select('id').eq('id', room.id);
if (roomsError) throw roomsError;
if (rooms?.length) throw new Error('Expired room survived retention cleanup');

const { data: games, error: gamesError } = await admin.from('game_sessions').select('id').eq('id', game.id);
if (gamesError) throw gamesError;
if (games?.length) throw new Error('Expired room-linked game data did not cascade-delete');

const { data: buckets, error: bucketsError } = await admin.from('server_rate_limits').select('bucket_key').eq('bucket_key', bucketKey);
if (bucketsError) throw bucketsError;
if (buckets?.length) throw new Error('Stale rate-limit bucket survived retention cleanup');

console.log('Retention integration passed: fail-closed cron auth, expired-room cascade deletion and stale rate-limit cleanup.');
