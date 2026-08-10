'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { drawNextBingo, endBingo, fetchBingo, startBingo, type BingoSnapshot } from '@/lib/client-bingo';

export function BingoHostPanel({ accessToken, roomCode, boardSize, cardChoiceSeconds, onEnded }: { accessToken: string; roomCode: string; boardSize: number; cardChoiceSeconds: number; onEnded?: () => void }) {
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
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Bingo action failed.'); }
    finally { setBusy(false); }
  }

  if (!snapshot || snapshot.session.status === 'ended') {
    return <section className="panel bingo-live-panel"><div className="eyebrow">Standard Number Bingo</div><h2>Start the server-authoritative round</h2><p className="support">Each active participant receives three personal candidate cards. The server locks an automatic assignment when the selection timer expires.</p>{error && <div className="notice warning" role="alert">{error}</div>}<button className="btn primary full-width" disabled={busy} onClick={() => void run(() => startBingo(accessToken, roomCode, boardSize, cardChoiceSeconds))}>{busy ? 'Starting…' : `Start ${boardSize}×${boardSize} Bingo`}</button></section>;
  }

  const state = snapshot.session.state;
  const selection = snapshot.session.cardSelection;
  const paused = snapshot.room.status === 'paused' || snapshot.session.status === 'paused';
  return <section className="panel bingo-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? 'PAUSED · BINGO' : `BINGO · ${state.phase === 'card-selection' ? 'CARD SELECTION' : 'DRAWING'}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">The round is frozen. Card-selection time and server draws resume from this exact state.</div>}
    {state.phase === 'card-selection' ? <>
      <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'card-selection time frozen' : 'card-selection time remaining'}</span></div>
      <div className="meta"><span className="pill">Selected {selection.selected}/{selection.total}</span><span className="pill">3 candidates each</span><span className="pill">Auto-assign at timeout</span></div>
      <button className="btn primary full-width" disabled={busy || paused || remaining > 0 && selection.selected < selection.total} onClick={() => void run(() => drawNextBingo(accessToken, roomCode))}>{paused ? 'Paused' : selection.selected === selection.total ? 'All cards locked · Draw Next' : remaining > 0 ? 'Waiting for card selection…' : 'Lock remaining cards · Draw Next'}</button>
    </> : <>
      <div className="bingo-callout draw"><span>Latest server draw</span><strong>{state.latestDraw ?? '—'}</strong></div>
      <div className="meta"><span className="pill">Draws {state.drawn.length}</span><span className="pill">Pool {state.pool.length}</span><span className="pill">Winners {snapshot.session.winners.length}</span></div>
      {snapshot.session.winners.length > 0 && <div className="winner-list">{snapshot.session.winners.map((winner) => <div className="control-row" key={winner.participant_id}><span>#{winner.placement} {winner.nickname}</span><strong>Draw {winner.completing_draw_index + 1}</strong></div>)}</div>}
      <button className="btn primary full-width" disabled={busy || paused} onClick={() => void run(() => drawNextBingo(accessToken, roomCode))}>{paused ? 'Paused' : busy ? 'Drawing…' : 'Draw Next'}</button>
    </>}
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(async () => { const result = await endBingo(accessToken, roomCode); onEnded?.(); return result; })}>End Bingo & show results</button>
  </section>;
}
