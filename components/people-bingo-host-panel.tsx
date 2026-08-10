'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { drawPeopleBingoClient, endPeopleBingoClient, fetchPeopleBingo, type PeopleBingoSnapshot } from '@/lib/client-people-bingo';
import { updateLiveRoom } from '@/lib/client-room';
import { AVATARS } from '@/lib/room-flow';

function avatarFor(key: string | null) {
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoHostPanel({ accessToken, roomCode, onEnded }: { accessToken: string; roomCode: string; onEnded?: () => void }) {
  const [snapshot, setSnapshot] = useState<PeopleBingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchPeopleBingo(accessToken, roomCode));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load People Bingo.');
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1200);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt
      ? new Date(snapshot.session.state.pauseStartedAt).getTime()
      : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function draw() {
    setBusy(true); setError(null);
    try { setSnapshot(await drawPeopleBingoClient(accessToken, roomCode)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not draw the next participant.'); }
    finally { setBusy(false); }
  }

  async function togglePause() {
    if (!snapshot) return;
    setBusy(true); setError(null);
    try {
      await updateLiveRoom(accessToken, roomCode, { status: snapshot.room.status === 'paused' ? 'playing' : 'paused' });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change pause state.');
    } finally { setBusy(false); }
  }

  async function end() {
    setBusy(true); setError(null);
    try {
      const next = await endPeopleBingoClient(accessToken, roomCode);
      setSnapshot(next);
      onEnded?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not end People Bingo.');
    } finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">People Bingo 5×5</div><h2>Loading room identities…</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const latest = session.state.latestDraw ? session.directory[session.state.latestDraw] : null;
  const selectionComplete = session.selection.selected >= session.selection.total;
  const canDraw = !paused && session.state.phase !== 'ended' && (selectionComplete || remaining <= 0);

  return <section className="panel people-bingo-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? 'PAUSED · PEOPLE BINGO 5×5' : 'PEOPLE BINGO 5×5'}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">Game time is frozen. Resume continues from the same remaining card-selection time or draw state.</div>}

    {session.state.phase === 'card-selection' && <>
      <div className="section-heading"><div><div className="eyebrow">Card selection</div><h2>{session.selection.selected}/{session.selection.total} cards locked</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'frozen' : 'remaining'}</span></div></div>
      <p className="support">Each active player receives 3 personal 5×5 cards. Every card contains 25 unique room participants. Unselected cards are assigned by the server when the Host makes the first draw after timeout.</p>
    </>}

    {session.state.phase !== 'card-selection' && <>
      <div className="people-bingo-callout">
        <span>Latest participant</span>
        <strong>{latest ? `${avatarFor(latest.avatarKey)} ${latest.nickname}` : '—'}</strong>
      </div>
      <div className="meta"><span className="pill">Draws {session.state.drawn.length}</span><span className="pill">Pool {session.state.pool.length}</span><span className="pill">Auto-marking on every card</span></div>
    </>}

    {session.winners.length > 0 && <div className="winner-list">{session.winners.map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {avatarFor(winner.avatarKey)} {winner.nickname}</span><strong>Draw {winner.completing_draw_index + 1}</strong></div>)}</div>}

    <div className="notice">Release 1 People Bingo is intentionally limited to 5×5 with at least 25 unique active participants. Larger boards remain disabled pending fairness/readability testing.</div>
    <button className="btn secondary full-width" disabled={busy || session.state.phase === 'ended'} onClick={() => void togglePause()}>{paused ? 'Resume game' : 'Pause game'}</button>
    <button className="btn primary full-width" disabled={busy || !canDraw} onClick={() => void draw()}>{paused ? 'Paused' : busy ? 'Drawing…' : !canDraw ? `Card choice closes in ${remaining}s` : 'Draw Next Participant'}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void end()}>End People Bingo</button>
  </section>;
}
