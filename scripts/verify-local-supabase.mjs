import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required');
}

const userClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signInData, error: signInError } = await userClient.auth.signInAnonymously();
if (signInError || !signInData.user || !signInData.session) {
  throw signInError ?? new Error('Anonymous sign-in did not return a user/session');
}

const userId = signInData.user.id;
const accessToken = signInData.session.access_token;
const joinCode = `QA${Date.now().toString(36).slice(-6).toUpperCase()}`;

const { data: room, error: roomError } = await admin
  .from('rooms')
  .insert({
    join_code: joinCode,
    host_user_id: userId,
    status: 'lobby',
    room_language: 'en',
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  })
  .select('id')
  .single();
if (roomError || !room) throw roomError ?? new Error('Could not create disposable hosted room');

const response = await fetch(`${url}/functions/v1/erase-account`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ source: 'app' }),
});
const body = await response.json().catch(() => ({}));
if (!response.ok || body?.ok !== true) {
  throw new Error(`erase-account failed: HTTP ${response.status} ${JSON.stringify(body)}`);
}

const { data: deletedUserData, error: deletedUserError } = await admin.auth.admin.getUserById(userId);
if (!deletedUserError && deletedUserData?.user) {
  throw new Error('Auth identity still exists after erase-account completed');
}

const { data: hostedRooms, error: hostedRoomsError } = await admin
  .from('rooms')
  .select('id')
  .eq('host_user_id', userId);
if (hostedRoomsError) throw hostedRoomsError;
if ((hostedRooms ?? []).length !== 0) {
  throw new Error('Hosted room remained after account erasure');
}

const { data: requestRows, error: requestError } = await admin
  .from('privacy_requests')
  .select('status,completed_at')
  .eq('auth_user_id', userId)
  .eq('request_kind', 'erase_account')
  .order('requested_at', { ascending: false })
  .limit(1);
if (requestError) throw requestError;
if (!requestRows?.length || requestRows[0].status !== 'completed' || !requestRows[0].completed_at) {
  throw new Error('Privacy request audit row was not finalized as completed');
}

console.log('Local Supabase integration passed: migrations, anonymous Auth, hosted-room cleanup, audit completion, and Auth deletion.');
