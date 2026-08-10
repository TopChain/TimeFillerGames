import 'server-only';
import { createClient } from '@supabase/supabase-js';

function required(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the room service.`);
  return value;
}

export function createAdminClient() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
