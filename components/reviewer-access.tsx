'use client';

import { FormEvent, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

const REVIEW_ACCESS_ENABLED = process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED === 'true';

export function ReviewerAccess() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!REVIEW_ACCESS_ENABLED) return null;

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError || !data.session || !data.user || data.user.is_anonymous) {
        throw new Error(authError?.message ?? 'The reviewer Host account could not be verified.');
      }
      // Reuse the existing Host entry query on both web and the bundled native client.
      window.location.assign('/?nativeHost=1');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reviewer sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return <div style={{position:'fixed',right:16,bottom:72,zIndex:80}}>
    {!open ? <button className="btn ghost" type="button" onClick={() => setOpen(true)}>Store review access</button> :
      <div className="panel" role="dialog" aria-modal="true" aria-label="Store reviewer access" style={{width:'min(92vw,360px)',boxShadow:'0 18px 48px rgba(17,24,39,.22)'}}>
        <div className="eyebrow">App review</div>
        <h2>Reviewer Host sign-in</h2>
        <p className="support">Use the reusable demo credentials supplied in the store review notes. This is the real Host flow, not a mock/demo game.</p>
        <form onSubmit={signIn}>
          <label className="form-label">Email<input type="email" autoComplete="username" required value={email} onChange={(event)=>setEmail(event.target.value)} /></label>
          <label className="form-label">Password<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event)=>setPassword(event.target.value)} /></label>
          {error && <div className="notice warning" role="alert">{error}</div>}
          <div className="primary-row">
            <button className="btn ghost" type="button" disabled={busy} onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
            <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Enter Host flow'}</button>
          </div>
        </form>
      </div>}
  </div>;
}
