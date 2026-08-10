'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase browser configuration is not available yet.');
  return { url, key };
}

export function hasBrowserSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getBrowserSupabase() {
  if (browserClient) return browserClient;
  const { url, key } = publicConfig();
  browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export async function currentSession(): Promise<Session | null> {
  if (!hasBrowserSupabaseConfig()) return null;
  const { data, error } = await getBrowserSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function ensureParticipantSession() {
  const supabase = getBrowserSupabase();
  const existing = await currentSession();
  if (existing) return existing;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) throw new Error(error?.message ?? 'Could not create a temporary guest session.');
  return data.session;
}

export async function requestHostMagicLink(email: string) {
  const supabase = getBrowserSupabase();
  const redirect = typeof window === 'undefined' ? undefined : `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: redirect ? { emailRedirectTo: redirect } : undefined,
  });
  if (error) throw error;
}

export async function permanentHostSession() {
  const session = await currentSession();
  if (!session || session.user.is_anonymous) return null;
  return session;
}
