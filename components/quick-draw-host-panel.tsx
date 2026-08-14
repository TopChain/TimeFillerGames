'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { endQuickDrawClient, fetchQuickDraw, finishQuickDrawRoundClient, nextQuickDrawRoundClient, type QuickDrawSnapshot } from '@/lib/client-quick-draw';
import { updateLiveRoom } from '@/lib/client-room';
import { HOST_GAME_UI_COPY } from '@/lib/host-game-ui-copy';
import type { Locale } from '@/lib/product';
import { QuickDrawCanvas } from './quick-draw-canvas';

export function QuickDrawHostPanel({ accessToken, roomCode, locale = 'en', onEnded }: { accessToken: string; roomCode: string; locale?: Locale; onEnded?: () => void }) {
  const copy = HOST_GAME_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<QuickDrawSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchQuickDraw(accessToken, roomCode)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
  }, [accessToken, copy.actionFailed, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 650);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt ? new Date(snapshot.session.state.pauseStartedAt).getTime() : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.deadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function run(action: () => Promise<QuickDrawSnapshot>) {
    setBusy(true); setError(null);
    try { const next = await action(); setSnapshot(next); if (next.session.status === 'ended') onEnded?.(); }
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

  if (!snapshot) return <section className="panel"><div className="eyebrow">Quick Draw &amp; Guess</div><h2>{copy.quickLoading}</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const turnNumber = session.state.roundIndex + 1;
  const isLast = turnNumber >= session.config.artistTurns;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Quick Draw &amp; Guess</div><h2>{copy.gameComplete}</h2><p className="support">{copy.finalReady}</p></section>;

  if (session.state.phase === 'drawing') return <section className="panel quick-draw-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · ${copy.turn} ${turnNumber}/${session.config.artistTurns}` : `QUICK DRAW · ${copy.turn} ${turnNumber}/${session.config.artistTurns}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.quickFrozen}</div>}
    <div className="section-heading"><div><div className="eyebrow">{copy.artist}</div><h2>{session.artist.nickname}</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.frozen : copy.remaining}</span></div></div>
    <div className="quick-draw-secret host-secret"><span>{copy.secretWord}</span><strong>{session.secretWord ?? copy.hidden}</strong><small>{copy.hostOnlySecret}</small></div>
    <QuickDrawCanvas strokes={session.strokes} />
    <div className="meta"><span className="pill">{copy.correct} {session.correctGuessers.length}</span><span className="pill">{copy.category} {session.config.wordCategory}</span><span className="pill">{copy.difficulty} {session.config.wordDifficulty}</span></div>
    {session.correctGuessers.length > 0 && <div className="winner-list">{session.correctGuessers.map((guesser) => <div className="control-row" key={guesser.participant_id}><span>✓ {guesser.nickname}</span><strong>{guesser.points} {copy.points}</strong></div>)}</div>}
    <button className="btn secondary full-width" disabled={busy} onClick={() => void togglePause()}>{paused ? copy.resumeTurn : copy.pauseTurn}</button>
    <button className="btn primary full-width" disabled={busy || paused || remaining > 0} onClick={() => void run(() => finishQuickDrawRoundClient(accessToken, roomCode))}>{paused ? copy.paused : remaining > 0 ? copy.turnEnds(remaining) : copy.revealScore}</button>
    <button className="btn secondary full-width" disabled={busy || paused} onClick={() => void run(() => finishQuickDrawRoundClient(accessToken, roomCode, true))}>{copy.skipReveal}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endQuickDrawClient(accessToken, roomCode))}>{copy.endGame}</button>
  </section>;

  return <section className="panel quick-draw-live-panel">
    <div className="eyebrow">{copy.turnResult}</div><h2>{copy.wordWas} <strong>{session.secretWord ?? session.state.revealWord ?? '—'}</strong></h2>
    <QuickDrawCanvas strokes={session.strokes} />
    <div className="meta"><span className="pill">{copy.artist} {session.artist.nickname}</span><span className="pill">{copy.correctGuessers} {session.correctGuessers.length}</span></div>
    {session.correctGuessers.length > 0 ? <div className="winner-list">{session.correctGuessers.map((guesser) => <div className="control-row" key={guesser.participant_id}><span>✓ {guesser.nickname}</span><strong>{guesser.points} {copy.points}</strong></div>)}</div> : <div className="notice">{copy.noGuesser}</div>}
    <button className="btn primary full-width" disabled={busy || paused} onClick={() => void run(() => nextQuickDrawRoundClient(accessToken, roomCode))}>{isLast ? copy.finishResults : copy.nextArtist}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endQuickDrawClient(accessToken, roomCode))}>{copy.endGameNow}</button>
  </section>;
}
