'use client';

import { useEffect, useState } from 'react';
import { currentSession, getBrowserSupabase } from '@/lib/supabase/browser';
import '@/app/privacy.css';

export function PrivacyControls({ source = 'app' }: { source?: 'app' | 'web' }) {
  const [hasIdentity, setHasIdentity] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void currentSession().then((session) => setHasIdentity(Boolean(session))).catch(() => undefined);
    const supabase = getBrowserSupabase();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setHasIdentity(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!hasIdentity) return null;

  async function requestErasure() {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = getBrowserSupabase();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error(authError?.message ?? 'Your authenticated identity could not be verified.');

      const { error } = await supabase.functions.invoke('erase-account', { body: { source } });
      if (error) throw new Error(error.message);

      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('timefillergames:seat:')) localStorage.removeItem(key);
      }
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      setMessage('Your TimeFillerGames account and associated personal data were deleted.');
      setHasIdentity(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Account deletion could not be completed. Please try again.');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return <div className="privacy-controls">
    <button className="privacy-trigger" type="button" onClick={() => setOpen((value) => !value)}>Privacy</button>
    {open && <div className="privacy-panel" role="dialog" aria-label="Privacy controls">
      <strong>Account & data</strong>
      <p>Delete this TimeFillerGames identity and associated personal data. Hosted rooms owned by this identity will close. Other room participation is anonymized before the account is removed.</p>
      {!confirming ? <button className="btn secondary" type="button" onClick={() => setConfirming(true)}>Delete my account & data</button> : <div className="privacy-confirm">
        <p><strong>This action is permanent.</strong> You will be signed out and this identity cannot be recovered.</p>
        <button className="btn danger" type="button" disabled={busy} onClick={() => void requestErasure()}>{busy ? 'Deleting…' : 'Permanently delete account & data'}</button>
        <button className="btn ghost" type="button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
      </div>}
      {message && <div className="notice" role="status">{message}</div>}
    </div>}
  </div>;
}
