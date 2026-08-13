'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  claimRoomHost,
  fetchHostRecoveryState,
  fetchRoomSnapshot,
  setReadyState,
  type HostRecoveryState,
  type RoomSnapshot,
} from '@/lib/client-room';
import { currentSession } from '@/lib/supabase/browser';

const SEAT_PREFIX = 'timefillergames:seat:';

type ActiveRecovery = {
  roomCode: string;
  accessToken: string;
  sessionToken: string;
  state: HostRecoveryState;
  snapshot: RoomSnapshot;
};

function storedRoomCodes() {
  const codes: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(SEAT_PREFIX)) codes.push(key.slice(SEAT_PREFIX.length));
  }
  return codes;
}

export function CoHostRecoveryAgent() {
  const [active, setActive] = useState<ActiveRecovery | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    const session = await currentSession().catch(() => null);
    if (!session) {
      setActive(null);
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const queryCode = (query.get('join') ?? query.get('room') ?? '').trim().toUpperCase();
    const codes = Array.from(new Set([queryCode, ...storedRoomCodes()].filter(Boolean)));
    for (const roomCode of codes) {
      try {
        const state = await fetchHostRecoveryState(session.access_token, roomCode);
        if (!state.isCoHost) continue;
        const snapshot = await fetchRoomSnapshot(session.access_token, roomCode);
        const sessionToken = window.localStorage.getItem(`${SEAT_PREFIX}${roomCode}`);
        if (!sessionToken) continue;
        setActive({ roomCode, accessToken: session.access_token, sessionToken, state, snapshot });
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
    return () => {
      window.clearInterval(scanTimer);
      window.clearInterval(clockTimer);
    };
  }, [scan]);

  const secondsUntilClaim = useMemo(() => {
    if (!active) return 0;
    const eligibleAt = new Date(active.state.hostLastSeenAt).getTime() + active.state.recoveryGraceSeconds * 1000;
    return Math.max(0, Math.ceil((eligibleAt - now) / 1000));
  }, [active, now]);

  if (!active) return null;
  const own = active.snapshot.participants[0];
  const lobby = active.snapshot.room.status === 'lobby';

  async function toggleReady() {
    if (!active || !own || !lobby) return;
    setBusy(true); setError(null);
    try {
      await setReadyState(active.accessToken, active.roomCode, active.sessionToken, !own.ready);
      await scan();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update co-host Ready state.');
    } finally { setBusy(false); }
  }

  async function recoverHost() {
    if (!active || !active.state.canClaim) return;
    setBusy(true); setError(null);
    try {
      await claimRoomHost(active.accessToken, active.roomCode);
      window.location.assign(`/?recoveredHost=${encodeURIComponent(active.roomCode)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not recover Host control.');
      await scan();
    } finally { setBusy(false); }
  }

  return <aside className="cohost-recovery-agent" aria-live="polite">
    <strong>Recovery co-host · {active.roomCode}</strong>
    {lobby && own && <button className={`btn ${own.ready ? 'secondary' : 'primary'}`} disabled={busy} onClick={() => void toggleReady()}>{own.ready ? '✓ Ready' : 'Mark Ready'}</button>}
    {active.state.canClaim
      ? <button className="btn host" disabled={busy} onClick={() => void recoverHost()}>{busy ? 'Recovering…' : 'Recover Host control'}</button>
      : <span className="support">Host heartbeat active{secondsUntilClaim > 0 ? ` · recovery in ${secondsUntilClaim}s if it stops` : ''}</span>}
    {error && <span className="notice warning" role="alert">{error}</span>}
  </aside>;
}
