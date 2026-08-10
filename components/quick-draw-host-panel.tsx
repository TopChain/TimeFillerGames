'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { endQuickDrawClient, fetchQuickDraw, finishQuickDrawRoundClient, nextQuickDrawRoundClient, type QuickDrawSnapshot } from '@/lib/client-quick-draw';
import { QuickDrawCanvas } from './quick-draw-canvas';

export function QuickDrawHostPanel({ accessToken, roomCode, onEnded }: { accessToken: string; roomCode: string; onEnded?: () => void }) {
  const [snapshot, setSnapshot] = useState<QuickDrawSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchQuickDraw(accessToken, roomCode));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Quick Draw.');
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 650);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => snapshot ? Math.max(0, Math.ceil((new Date(snapshot.session.state.deadline).getTime() - now) / 1000)) : 0, [now, snapshot]);

  async function run(action: () => Promise<QuickDrawSnapshot>) {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      setSnapshot(next);
      if (next.session.status === 'ended') onEnded?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Quick Draw action failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">Quick Draw & Guess</div><h2>Loading drawing turn…</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const turnNumber = session.state.roundIndex + 1;
  const isLast = turnNumber >= session.config.artistTurns;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Quick Draw & Guess</div><h2>Game complete</h2><p className="support">Final server rankings are ready.</p></section>;

  if (session.state.phase === 'drawing') return <section className="panel quick-draw-live-panel">
    <div className="live-line"><span className="live-dot" /> QUICK DRAW · TURN {turnNumber}/{session.config.artistTurns}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    <div className="section-heading"><div><div className="eyebrow">Artist</div><h2>{session.artist.nickname}</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>remaining</span></div></div>
    <div className="quick-draw-secret host-secret"><span>Secret word</span><strong>{session.secretWord ?? 'Hidden'}</strong><small>Host view only. Do not read this aloud.</small></div>
    <QuickDrawCanvas strokes={session.strokes} />
    <div className="meta"><span className="pill">Correct {session.correctGuessers.length}</span><span className="pill">Category {session.config.wordCategory}</span><span className="pill">Difficulty {session.config.wordDifficulty}</span></div>
    {session.correctGuessers.length > 0 && <div className="winner-list">{session.correctGuessers.map((guesser) => <div className="control-row" key={guesser.participant_id}><span>✓ {guesser.nickname}</span><strong>{guesser.points} pts</strong></div>)}</div>}
    {session.config.guessVisibility === 'moderated-stream' && <div className="moderation-queue"><h3>Host-only guess monitor</h3><p className="support">This is a moderation queue, not a public chat stream. Public guess streaming remains blocked until content moderation is complete.</p>{session.hostGuessStream.slice(0, 12).map((guess, index) => <div className="control-row" key={`${guess.created_at}-${index}`}><span>{guess.nickname}: {guess.guess}</span><strong>{guess.accepted ? '✓ Correct' : 'Review'}</strong></div>)}</div>}
    <button className="btn primary full-width" disabled={busy || remaining > 0} onClick={() => void run(() => finishQuickDrawRoundClient(accessToken, roomCode))}>{remaining > 0 ? `Turn ends in ${remaining}s` : 'Reveal word & score turn'}</button>
    <button className="btn secondary full-width" disabled={busy} onClick={() => void run(() => finishQuickDrawRoundClient(accessToken, roomCode, true))}>Skip turn & reveal</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endQuickDrawClient(accessToken, roomCode))}>End game</button>
  </section>;

  return <section className="panel quick-draw-live-panel">
    <div className="eyebrow">Turn result</div><h2>The word was <strong>{session.secretWord ?? session.state.revealWord ?? '—'}</strong></h2>
    <QuickDrawCanvas strokes={session.strokes} />
    <div className="meta"><span className="pill">Artist {session.artist.nickname}</span><span className="pill">Correct guessers {session.correctGuessers.length}</span></div>
    {session.correctGuessers.length > 0 ? <div className="winner-list">{session.correctGuessers.map((guesser) => <div className="control-row" key={guesser.participant_id}><span>✓ {guesser.nickname}</span><strong>{guesser.points} pts</strong></div>)}</div> : <div className="notice">No eligible guesser identified the word this turn.</div>}
    <button className="btn primary full-width" disabled={busy} onClick={() => void run(() => nextQuickDrawRoundClient(accessToken, roomCode))}>{isLast ? 'Finish & show results' : 'Next artist'}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endQuickDrawClient(accessToken, roomCode))}>End game now</button>
  </section>;
}
