'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuickDraw, sendQuickDrawStroke, submitQuickDrawGuessClient, type QuickDrawSnapshot } from '@/lib/client-quick-draw';
import { GAME_UI_COPY } from '@/lib/game-ui-copy';
import { usePlayerUiLocale } from '@/lib/use-player-ui-locale';
import { QuickDrawCanvas } from './quick-draw-canvas';

export function QuickDrawPlayerPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
  const locale = usePlayerUiLocale(accessToken, roomCode);
  const copy = GAME_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<QuickDrawSnapshot | null>(null);
  const [guess, setGuess] = useState('');
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

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt
      ? new Date(snapshot.session.state.pauseStartedAt).getTime()
      : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.deadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function submitGuess() {
    if (!guess.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await submitQuickDrawGuessClient(accessToken, roomCode, guess));
      setGuess('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit your guess.');
    } finally {
      setBusy(false);
    }
  }

  async function sendStroke(payload: { type: 'stroke'; points: Array<{ x: number; y: number }>; width: number }) {
    try {
      await sendQuickDrawStroke(accessToken, roomCode, payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Drawing synchronization slowed down.');
    }
  }

  async function clearCanvas() {
    try {
      await sendQuickDrawStroke(accessToken, roomCode, { type: 'clear' });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear the drawing.');
    }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">{copy.quickDraw.title}</div><h2>{copy.quickDraw.waitingTurn}</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const ownCorrect = session.ownGuesses.some((entry) => entry.accepted);
  const turnNumber = session.state.roundIndex + 1;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">{copy.quickDraw.title}</div><h2>{copy.common.roundComplete}</h2><p className="support">{copy.common.waitingHost}</p></section>;

  if (session.state.phase === 'revealing') return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="eyebrow">{copy.quickDraw.turnResult}</div><h2>{copy.quickDraw.wordWas} <strong>{session.secretWord ?? session.state.revealWord ?? '—'}</strong></h2>
    <QuickDrawCanvas strokes={session.strokes} />
    {paused && <div className="notice warning">{copy.common.paused}. {copy.common.waitingHost}</div>}
    {session.artist.isSelf ? <div className="notice success">{copy.quickDraw.artistResultHelp}</div> : ownCorrect ? <div className="notice success">✓ {copy.quickDraw.correctRecorded}</div> : <div className="notice">{copy.quickDraw.noCorrectForYou}</div>}
    <p className="support">{copy.common.waitingHost}</p>
  </section>;

  if (session.artist.isSelf) return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.common.paused} · ${copy.quickDraw.yourArtistTurn} ${turnNumber}/${session.config.artistTurns}` : `${copy.quickDraw.yourArtistTurn} · ${turnNumber}/${session.config.artistTurns}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.quickDraw.pauseArtist}</div>}
    <div className="section-heading"><div><div className="eyebrow">{copy.quickDraw.drawThisWord}</div><h2 className="artist-secret-word">{session.secretWord ?? '—'}</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.common.frozen : copy.common.remaining}</span></div></div>
    <p className="support">{copy.quickDraw.doNotWriteOrSay}</p>
    <QuickDrawCanvas strokes={session.strokes} editable disabled={paused || remaining <= 0} onStroke={sendStroke} onClear={clearCanvas} />
    <div className="meta"><span className="pill">{copy.quickDraw.correctGuessers} {session.correctGuessers.length}</span><span className="pill">{copy.quickDraw.artistScoreHelp}</span></div>
  </section>;

  return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.common.paused} · ${session.artist.nickname} ${copy.quickDraw.isDrawing}` : `${session.artist.nickname} ${copy.quickDraw.isDrawing}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.quickDraw.pauseGuesser}</div>}
    <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.common.frozen : copy.common.remaining}</span></div>
    <p className="support">{copy.quickDraw.watchDrawing}</p>
    <QuickDrawCanvas strokes={session.strokes} />
    {ownCorrect ? <div className="notice success">✓ {copy.quickDraw.correctRecorded}</div> : <form className="quick-draw-guess-form" onSubmit={(event) => { event.preventDefault(); void submitGuess(); }}>
      <label className="form-label">{copy.quickDraw.yourGuess}<input value={guess} maxLength={80} autoComplete="off" placeholder={copy.quickDraw.guessPlaceholder} disabled={busy || paused || remaining <= 0} onChange={(event) => setGuess(event.target.value)} /></label>
      <button className="btn primary" type="submit" disabled={busy || paused || remaining <= 0 || !guess.trim()}>{paused ? copy.common.paused : busy ? copy.quickDraw.sending : copy.quickDraw.submitGuess}</button>
    </form>}
    {session.ownGuesses.length > 0 && <div className="own-guess-list"><h3>{copy.quickDraw.yourGuesses}</h3>{session.ownGuesses.slice(-5).reverse().map((entry, index) => <div className="control-row" key={`${entry.created_at}-${index}`}><span>{entry.guess}</span><strong>{entry.accepted ? `✓ ${copy.common.correct}` : copy.quickDraw.notYet}</strong></div>)}</div>}
    <p className="support">{copy.quickDraw.matchingNote}</p>
  </section>;
}
