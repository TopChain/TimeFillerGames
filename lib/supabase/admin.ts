import 'server-only';
import { createClient } from '@supabase/supabase-js';

function adminConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error('Supabase URL and server secret key are required for the room service.');
  return { url, secret };
}

export function createAdminClient() {
  const { url, secret } = adminConfig();
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
