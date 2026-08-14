'use client';

import { useEffect, useState } from 'react';
import { currentSession, getBrowserSupabase } from '@/lib/supabase/browser';

export function PrivacyControls() {
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

      const { data: existing, error: existingError } = await supabase
        .from('privacy_requests')
        .select('id,status,requested_at')
        .eq('auth_user_id', auth.user.id)
        .eq('request_kind', 'erase_account')
        .in('status', ['pending', 'processing'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);

      if (!existing) {
        const { error } = await supabase.from('privacy_requests').insert({
          auth_user_id: auth.user.id,
          request_kind: 'erase_account',
          request_source: 'app',
          status: 'pending',
        });
        if (error) throw new Error(error.message);
      }

      setMessage('Deletion request submitted. Your account and associated personal data are scheduled for deletion within 30 days, except data that must be retained by law.');
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('timefillergames:seat:')) localStorage.removeItem(key);
      }
      await supabase.auth.signOut();
      setHasIdentity(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit the deletion request.');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return <div className="privacy-controls">
    <button className="privacy-trigger" type="button" onClick={() => setOpen((value) => !value)}>Privacy</button>
    {open && <div className="privacy-panel" role="dialog" aria-label="Privacy controls">
      <strong>Account & data</strong>
      <p>Request deletion of this TimeFillerGames identity and associated personal data. Processing may take up to 30 days.</p>
      {!confirming ? <button className="btn secondary" type="button" onClick={() => setConfirming(true)}>Delete my account & data</button> : <div className="privacy-confirm">
        <p><strong>This signs you out.</strong> Hosted rooms may close and this identity will no longer be recoverable after processing.</p>
        <button className="btn danger" type="button" disabled={busy} onClick={() => void requestErasure()}>{busy ? 'Submitting…' : 'Confirm deletion request'}</button>
        <button className="btn ghost" type="button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
      </div>}
      {message && <div className="notice" role="status">{message}</div>}
    </div>}
  </div>;
}
