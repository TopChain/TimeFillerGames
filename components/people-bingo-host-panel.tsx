'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { drawPeopleBingoClient, endPeopleBingoClient, fetchPeopleBingo, type PeopleBingoSnapshot } from '@/lib/client-people-bingo';
import { updateLiveRoom } from '@/lib/client-room';
import { HOST_GAME_UI_COPY } from '@/lib/host-game-ui-copy';
import { useHostUiLocale } from '@/lib/use-host-ui-locale';
import { AVATARS } from '@/lib/room-flow';

function avatarFor(key: string | null) {
  return AVATARS.find((avatar) => avatar.id === key)?.emoji ?? '🙂';
}

export function PeopleBingoHostPanel({ accessToken, roomCode, onEnded }: { accessToken: string; roomCode: string; onEnded?: () => void }) {
  const locale = useHostUiLocale();
  const copy = HOST_GAME_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<PeopleBingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchPeopleBingo(accessToken, roomCode)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
  }, [accessToken, copy.actionFailed, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1200);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt ? new Date(snapshot.session.state.pauseStartedAt).getTime() : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function draw() {
    setBusy(true); setError(null);
    try { setSnapshot(await drawPeopleBingoClient(accessToken, roomCode)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
    finally { setBusy(false); }
  }

  async function togglePause() {
    if (!snapshot) return;
    setBusy(true); setError(null);
    try { await updateLiveRoom(accessToken, roomCode, { status: snapshot.room.status === 'paused' ? 'playing' : 'paused' }); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
    finally { setBusy(false); }
  }

  async function end() {
    setBusy(true); setError(null);
    try { const next = await endPeopleBingoClient(accessToken, roomCode); setSnapshot(next); onEnded?.(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">People Bingo 5×5</div><h2>{copy.peopleLoading}</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const latest = session.state.latestDraw ? session.directory[session.state.latestDraw] : null;
  const selectionComplete = session.selection.selected >= session.selection.total;
  const canDraw = !paused && session.state.phase !== 'ended' && (selectionComplete || remaining <= 0);

  return <section className="panel people-bingo-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · PEOPLE BINGO 5×5` : 'PEOPLE BINGO 5×5'}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.peopleFrozen}</div>}
    {session.state.phase === 'card-selection' && <><div className="section-heading"><div><div className="eyebrow">{copy.cardSelection}</div><h2>{session.selection.selected}/{session.selection.total} {copy.cardsLocked}</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.frozen : copy.remaining}</span></div></div><p className="support">{copy.peopleCardHelp}</p></>}
    {session.state.phase !== 'card-selection' && <><div className="people-bingo-callout"><span>{copy.latestParticipant}</span><strong>{latest ? `${avatarFor(latest.avatarKey)} ${latest.nickname}` : '—'}</strong></div><div className="meta"><span className="pill">{copy.draws} {session.state.drawn.length}</span><span className="pill">{copy.pool} {session.state.pool.length}</span><span className="pill">{copy.autoMarking}</span></div></>}
    {session.winners.length > 0 && <div className="winner-list">{session.winners.map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {avatarFor(winner.avatarKey)} {winner.nickname}</span><strong>{copy.draw} {winner.completing_draw_index + 1}</strong></div>)}</div>}
    <div className="notice">{copy.peopleLimit}</div>
    <button className="btn secondary full-width" disabled={busy || session.state.phase === 'ended'} onClick={() => void togglePause()}>{paused ? copy.resumeGame : copy.pauseGame}</button>
    <button className="btn primary full-width" disabled={busy || !canDraw} onClick={() => void draw()}>{paused ? copy.paused : busy ? copy.drawingNow : !canDraw ? copy.cardChoiceCloses(remaining) : copy.drawNextParticipant}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void end()}>{copy.endPeople}</button>
  </section>;
}
