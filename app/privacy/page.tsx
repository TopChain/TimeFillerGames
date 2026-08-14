'use client';

import { useEffect, useState } from 'react';
import { currentSession, getBrowserSupabase, hasBrowserSupabaseConfig, requestHostMagicLink } from '@/lib/supabase/browser';

export default function PrivacyPage() {
  const [email, setEmail] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void currentSession().then((session) => setSignedIn(Boolean(session))).catch(() => undefined);
    if (!hasBrowserSupabaseConfig()) return;
    const { data } = getBrowserSupabase().auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  async function verify() {
    setBusy(true);
    setMessage(null);
    try {
      await requestHostMagicLink(email);
      setMessage('Check your email for the TimeFillerGames sign-in link, then return to this page.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the verification link.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="shell">
    <section className="panel" style={{ maxWidth: 760, margin: '48px auto' }}>
      <div className="eyebrow">TimeFillerGames privacy</div>
      <h1>Manage your account & data</h1>
      <p className="support">Use this page to verify a Host account before using the Privacy control for permanent account and data removal. Temporary Player identities can use the same Privacy control inside the app or browser where they are signed in.</p>
      {!signedIn ? <>
        <label className="form-label">Host email
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </label>
        <button className="btn primary" type="button" disabled={busy || !email.trim()} onClick={() => void verify()}>{busy ? 'Sending…' : 'Send verification link'}</button>
      </> : <div className="notice success">Identity verified. Open the Privacy control on this page to permanently remove this account and associated personal data.</div>}
      {message && <div className="notice" role="status">{message}</div>}
      <p className="support">Hosted rooms owned by an account are closed during removal. Participation in rooms owned by someone else is anonymized before the authentication identity is removed.</p>
      <a className="btn ghost" href="/">Return to TimeFillerGames</a>
    </section>
  </main>;
}
