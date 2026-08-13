'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { claimRoomHost, fetchHostRecoveryState, fetchRoomSnapshot, setReadyState, type HostRecoveryState, type RoomSnapshot } from '@/lib/client-room';
import { getCoHostIdentityStatus, secureCoHostIdentity } from '@/lib/cohost-identity';
import { currentSession } from '@/lib/supabase/browser';

const SEAT_PREFIX = 'timefillergames:seat:';

type IdentityStatus = { isAnonymous: boolean; email: string | null; confirmed: boolean };
type ActiveRecovery = { roomCode: string; accessToken: string; sessionToken: string; state: HostRecoveryState; snapshot: RoomSnapshot; identity: IdentityStatus };

function storedRoomCodes() {
  const codes: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(SEAT_PREFIX)) codes.push(key.slice(SEAT_PREFIX.length));
  }
  return codes;
}

export function CoHostRecoveryAgentV2() {
  const [active, setActive] = useState<ActiveRecovery | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    const session = await currentSession().catch(() => null);
    if (!session) { setActive(null); return; }
    const query = new URLSearchParams(window.location.search);
    const queryCode = (query.get('join') ?? query.get('room') ?? '').trim().toUpperCase();
    const codes = Array.from(new Set([queryCode, ...storedRoomCodes()].filter(Boolean)));
    for (const roomCode of codes) {
      try {
        const state = await fetchHostRecoveryState(session.access_token, roomCode);
        if (!state.isCoHost) continue;
        const [snapshot, identity] = await Promise.all([fetchRoomSnapshot(session.access_token, roomCode), getCoHostIdentityStatus()]);
        const sessionToken = window.localStorage.getItem(`${SEAT_PREFIX}${roomCode}`);
        if (!sessionToken) continue;
        setActive({ roomCode, accessToken: session.access_token, sessionToken, state, snapshot, identity });
        return;
      } catch {
        // Stale saved seats are ignored; the normal Player flow owns cleanup/reconnect.
      }
    }
    setActive(null);
  }, []);

  useEffect(() => {
    void scan();
    const scanTimer = window.setInterval(() => void scan(), 5_000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => { window.clearInterval(scanTimer); window.clearInterval(clockTimer); };
  }, [scan]);

  useEffect(() => {
    if (active?.identity.email && !recoveryEmail) setRecoveryEmail(active.identity.email);
  }, [active?.identity.email, recoveryEmail]);

  const secondsUntilClaim = useMemo(() => {
    if (!active) return 0;
    const eligibleAt = new Date(active.state.hostLastSeenAt).getTime() + active.state.recoveryGraceSeconds * 1000;
    return Math.max(0, Math.ceil((eligibleAt - now) / 1000));
  }, [active, now]);

  if (!active) return null;
  const own = active.snapshot.participants[0];
  const lobby = active.snapshot.room.status === 'lobby';
  const activeGame = active.snapshot.room.status === 'playing' || active.snapshot.room.status === 'paused';
  const secured = !active.identity.isAnonymous && active.identity.confirmed;
  const canRecover = secured && activeGame && active.state.canClaim;

  async function toggleReady() {
    if (!active || !own || !lobby) return;
    setBusy(true); setError(null);
    try { await setReadyState(active.accessToken, active.roomCode, active.sessionToken, !own.ready); await scan(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update co-host Ready state.'); }
    finally { setBusy(false); }
  }

  async function secureIdentity() {
    setBusy(true); setError(null); setIdentityMessage(null);
    try {
      await secureCoHostIdentity(recoveryEmail);
      setIdentityMessage('Verification sent. Open the verification email on this device; this seat keeps the same player identity.');
      await scan();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not secure this recovery seat.'); }
    finally { setBusy(false); }
  }

  async function recoverHost() {
    if (!canRecover) return;
    setBusy(true); setError(null);
    try { await claimRoomHost(active.accessToken, active.roomCode); window.location.assign(`/?recoveredHost=${encodeURIComponent(active.roomCode)}`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not recover Host control.'); await scan(); }
    finally { setBusy(false); }
  }

  return <aside className="cohost-recovery-agent" aria-live="polite">
    <strong>Recovery co-host · {active.roomCode}</strong>
    {lobby && own && <button className={`btn ${own.ready ? 'secondary' : 'primary'}`} disabled={busy} onClick={() => void toggleReady()}>{own.ready ? '✓ Ready' : 'Mark Ready'}</button>}
    {!secured && <div className="cohost-recovery-identity">
      <span className="support">Secure this same seat with a verified email before the game so recovery cannot be claimed by an anonymous temporary session.</span>
      <input type="email" autoComplete="email" placeholder="Recovery email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} />
      <button className="btn secondary" disabled={busy || !recoveryEmail.trim()} onClick={() => void secureIdentity()}>{busy ? 'Sending…' : 'Secure recovery'}</button>
    </div>}
    {secured && canRecover
      ? <button className="btn host" disabled={busy} onClick={() => void recoverHost()}>{busy ? 'Recovering…' : 'Recover Host control'}</button>
      : secured && activeGame
        ? <span className="support">Recovery identity verified · Host heartbeat active{secondsUntilClaim > 0 ? ` · recovery in ${secondsUntilClaim}s if it stops` : ''}</span>
        : secured ? <span className="support">Recovery identity verified · recovery is armed for an active game.</span> : null}
    {identityMessage && <span className="notice success">{identityMessage}</span>}
    {error && <span className="notice warning" role="alert">{error}</span>}
  </aside>;
}
