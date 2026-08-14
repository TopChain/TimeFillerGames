'use client';

import { getBrowserSupabase } from './supabase/browser';

export async function getCoHostIdentityStatus() {
  const { data, error } = await getBrowserSupabase().auth.getUser();
  if (error) throw error;
  return { isAnonymous: data.user.is_anonymous === true, email: data.user.email ?? null, confirmed: Boolean(data.user.email_confirmed_at) };
}

export async function secureCoHostIdentity(email: string) {
  const value = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(value)) throw new Error('Enter a valid email address.');
  const { data, error } = await getBrowserSupabase().auth.updateUser({ email: value });
  if (error) throw error;
  return { isAnonymous: data.user.is_anonymous === true, email: data.user.email ?? value, confirmed: Boolean(data.user.email_confirmed_at) };
}
