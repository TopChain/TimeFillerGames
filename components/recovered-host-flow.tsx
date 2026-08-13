'use client';

import { useCallback, useEffect, useState } from 'react';
import { BingoHostPanel } from './bingo-host-panel';
import { HostModerationPanel } from './host-moderation-panel';
import { MajorityMatchHostPanel } from './majority-match-host-panel';
import { PeopleBingoHostPanel } from './people-bingo-host-panel';
import { QuickDrawHostPanel } from './quick-draw-host-panel';
import { fetchLatestBingoMode } from '@/lib/client-people-bingo';
import { fetchRoomSnapshot, heartbeatHostRoom, updateLiveRoom, type RoomSnapshot } from '@/lib/client-room';
import { subscribeToRoom } from '@/lib/realtime-client';
import { currentSession } from '@/lib/supabase/browser';

export function RecoveredHostFlow({ roomCode, onExit }: { roomCode: string; onExit: () => void }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [bingoMode, setBingoMode] = useState<'standard-number' | 'people' | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (token?: string) => {
    const authToken = token ?? accessToken;
    if (!authToken) return;
    const next = await fetchRoomSnapshot(authToken, roomCode);
    if (!next.viewer.isHost) throw new Error('This account no longer owns the recovered room.');
    setSnapshot(next);
    if (next.room.game_type === 'bingo') {
      const mode = await fetchLatestBingoMode(authToken, roomCode);
      setBingoMode(mode.mode);
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    let cancelled = false;
    void currentSession().then(async (session) => {
      if (cancelled) return;
      if (!session || session.user.is_anonymous) throw new Error('A verified recovery identity is required for Host control.');
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      await refresh(session.access_token);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not restore Host control.'));
    return () => { cancelled = true; };
  }, [refresh]);

  useEffect(() => {
    if (!accessToken || !userId || !snapshot || snapshot.room.status === 'closed') return;
    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;
    const beat = () => void heartbeatHostRoom(accessToken, roomCode).catch(() => undefined);
    beat();
    const heartbeatTimer = window.setInterval(beat, 10_000);
    const refreshTimer = window.setInterval(() => void refresh().catch(() => undefined), 5_000);
    void subscribeToRoom({
      accessToken,
      roomId: snapshot.room.id,
      roomCode,
      userId,
      role: 'host',
      onChange: () => void refresh().catch(() => undefined),
      onPresence: () => void refresh().catch(() => undefined),
      onStatus: setRealtimeStatus,
    }).then((unsubscribe) => { if (cancelled) void unsubscribe(); else cleanup = unsubscribe; })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Realtime recovery connection failed.'));
    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(refreshTimer);
      if (cleanup) void cleanup();
    };
  }, [accessToken, refresh, roomCode, snapshot?.room.id, snapshot?.room.status, userId]);

  async function resume() {
    if (!accessToken || !snapshot || snapshot.room.status !== 'paused') return;
    setBusy(true); setError(null);
    try {
      await updateLiveRoom(accessToken, roomCode, { status: 'playing' });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not resume the recovered game.');
    } finally { setBusy(false); }
  }

  if (error && !snapshot) return <main className="role-shell" data-app="host"><section className="workspace host-card narrow"><div className="eyebrow">Host recovery</div><h1>Recovery could not continue.</h1><div className="notice warning" role="alert">{error}</div><button className="btn secondary" onClick={onExit}>Return home</button></section></main>;
  if (!snapshot || !accessToken) return <main className="role-shell" data-app="host"><section className="workspace host-card narrow"><div className="eyebrow">Host recovery</div><h1>Restoring room control…</h1><p className="support">Loading authoritative room and game state.</p></section></main>;

  const room = snapshot.room;
  const ended = room.status === 'results' || room.status === 'closed';
  return <main className="role-shell" data-app="host">
    <header className="role-topbar"><button className="text-button" onClick={onExit}>← TimeFillerGames</button><div className="role-title"><span className="role-dot" /> Recovered Host</div><span className="status-chip">{room.join_code} · {realtimeStatus}</span></header>
    <section className="workspace host-card">
      <div className="notice success"><strong>Host control recovered.</strong> The authoritative room owner has changed to this verified account.</div>
      {room.status === 'paused' && <div className="notice warning">The active game is paused after recovery. Review the state below, then resume deliberately.</div>}
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="meta"><span className="pill">Room {room.join_code}</span><span className="pill">{room.game_type}</span><span className="pill">{room.duration_minutes} min</span><span className="pill">Players {snapshot.counts.active}</span><span className="pill">Status {room.status}</span></div>
      {room.status === 'paused' && <button className="btn primary full-width" disabled={busy} onClick={() => void resume()}>{busy ? 'Resuming…' : 'Resume recovered game'}</button>}

      {!ended && room.game_type === 'bingo' && bingoMode === 'people' && <PeopleBingoHostPanel accessToken={accessToken} roomCode={roomCode} onEnded={() => void refresh()} />}
      {!ended && room.game_type === 'bingo' && bingoMode === 'standard-number' && <BingoHostPanel accessToken={accessToken} roomCode={roomCode} boardSize={5} cardChoiceSeconds={15} onEnded={() => void refresh()} />}
      {!ended && room.game_type === 'bingo' && !bingoMode && <div className="notice">Loading Bingo mode…</div>}
      {!ended && room.game_type === 'majority-match' && <MajorityMatchHostPanel accessToken={accessToken} roomCode={roomCode} onEnded={() => void refresh()} />}
      {!ended && room.game_type === 'quick-draw' && <QuickDrawHostPanel accessToken={accessToken} roomCode={roomCode} onEnded={() => void refresh()} />}
      {ended && <div className="notice success">The recovered game has ended. Server results are preserved. Return home when finished reviewing the room.</div>}

      <HostModerationPanel accessToken={accessToken} roomCode={roomCode} roomStatus={room.status} participants={snapshot.participants} onChanged={refresh} />
    </section>
  </main>;
}
