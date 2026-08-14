'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { drawNextBingo, endBingo, fetchBingo, startBingo, type BingoSnapshot } from '@/lib/client-bingo';
import { HOST_GAME_UI_COPY } from '@/lib/host-game-ui-copy';
import type { Locale } from '@/lib/product';

export function BingoHostPanel({ accessToken, roomCode, boardSize, cardChoiceSeconds, locale = 'en', onEnded }: { accessToken: string; roomCode: string; boardSize: number; cardChoiceSeconds: number; locale?: Locale; onEnded?: () => void }) {
  const copy = HOST_GAME_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<BingoSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchBingo(accessToken, roomCode)); }
    catch { /* A session may not exist until the Host starts it. */ }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 2000);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot || snapshot.session.state.phase !== 'card-selection') return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt
      ? new Date(snapshot.session.state.pauseStartedAt).getTime()
      : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.selectionDeadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function run(action: () => Promise<BingoSnapshot>) {
    setBusy(true); setError(null);
    try { setSnapshot(await action()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
    finally { setBusy(false); }
  }

  if (!snapshot || snapshot.session.status === 'ended') {
    return <section className="panel bingo-live-panel"><div className="eyebrow">Bingo</div><h2>{copy.startServerRound}</h2><p className="support">{copy.candidateHelp}</p>{error && <div className="notice warning" role="alert">{error}</div>}<button className="btn primary full-width" disabled={busy} onClick={() => void run(() => startBingo(accessToken, roomCode, boardSize, cardChoiceSeconds))}>{busy ? copy.drawingNow : copy.startBoard(boardSize)}</button></section>;
  }

  const state = snapshot.session.state;
  const selection = snapshot.session.cardSelection;
  const paused = snapshot.room.status === 'paused' || snapshot.session.status === 'paused';
  return <section className="panel bingo-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · BINGO` : `BINGO · ${state.phase === 'card-selection' ? copy.cardSelection : copy.drawing}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.roundFrozen}</div>}
    {state.phase === 'card-selection' ? <>
      <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.selectionFrozen : copy.remaining}</span></div>
      <div className="meta"><span className="pill">{copy.selected} {selection.selected}/{selection.total}</span><span className="pill">{copy.candidatesEach}</span><span className="pill">{copy.autoAssign}</span></div>
      <button className="btn primary full-width" disabled={busy || paused || remaining > 0 && selection.selected < selection.total} onClick={() => void run(() => drawNextBingo(accessToken, roomCode))}>{paused ? copy.paused : selection.selected === selection.total ? copy.allCardsLocked : remaining > 0 ? copy.waitingSelection : copy.lockAndDraw}</button>
    </> : <>
      <div className="bingo-callout draw"><span>{copy.latestServerDraw}</span><strong>{state.latestDraw ?? '—'}</strong></div>
      <div className="meta"><span className="pill">{copy.draws} {state.drawn.length}</span><span className="pill">{copy.pool} {state.pool.length}</span><span className="pill">{copy.winners} {snapshot.session.winners.length}</span></div>
      {snapshot.session.winners.length > 0 && <div className="winner-list">{snapshot.session.winners.map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {winner.nickname}</span><strong>{copy.draw} {winner.completing_draw_index + 1}</strong></div>)}</div>}
      <button className="btn primary full-width" disabled={busy || paused} onClick={() => void run(() => drawNextBingo(accessToken, roomCode))}>{paused ? copy.paused : busy ? copy.drawingNow : copy.drawNext}</button>
    </>}
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(async () => { const result = await endBingo(accessToken, roomCode); onEnded?.(); return result; })}>{copy.endBingo}</button>
  </section>;
}
