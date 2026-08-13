import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export function hasBrowserSupabaseConfig() { return Boolean(supabaseUrl && publishableKey); }
export function getBrowserSupabase() { if (!client) client = createClient(supabaseUrl, publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }); return client; }
export async function currentSession(): Promise<Session|null> { if (!hasBrowserSupabaseConfig()) return null; const {data,error}=await getBrowserSupabase().auth.getSession(); if(error) throw error; return data.session; }
export async function ensureParticipantSession(){const existing=await currentSession();if(existing)return existing;const{data,error}=await getBrowserSupabase().auth.signInAnonymously();if(error||!data.session)throw new Error(error?.message??'Could not create a temporary guest session.');return data.session;}
export async function requestHostMagicLink(email:string){const redirect=import.meta.env.VITE_AUTH_REDIRECT_URL||'timefillergames://auth/callback';const{error}=await getBrowserSupabase().auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:redirect}});if(error)throw error;}
export async function permanentHostSession(){const session=await currentSession();return !session||session.user.is_anonymous?null:session;}
export async function importNativeAuthUrl(url:string){const parsed=new URL(url);const code=parsed.searchParams.get('code');if(code){const{data,error}=await getBrowserSupabase().auth.exchangeCodeForSession(code);if(error)throw error;return data.session;}const fragment=new URLSearchParams(parsed.hash.startsWith('#')?parsed.hash.slice(1):parsed.hash);const accessToken=fragment.get('access_token');const refreshToken=fragment.get('refresh_token');if(!accessToken||!refreshToken)return null;const{data,error}=await getBrowserSupabase().auth.setSession({access_token:accessToken,refresh_token:refreshToken});if(error)throw error;return data.session;}
