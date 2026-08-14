import 'server-only';
import { createClient, type User } from '@supabase/supabase-js';

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase public environment variables are required.');
  return { url, key };
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export async function requireUser(request: Request): Promise<User | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const { url, key } = publicConfig();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireHostUser(request: Request): Promise<User | null> {
  const user = await requireUser(request);
  if (!user || user.is_anonymous) return null;
  return user;
}
