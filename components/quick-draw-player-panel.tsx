'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuickDraw, sendQuickDrawStroke, submitQuickDrawGuessClient, type QuickDrawSnapshot } from '@/lib/client-quick-draw';
import { QuickDrawCanvas } from './quick-draw-canvas';

export function QuickDrawPlayerPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
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

  if (!snapshot) return <section className="panel"><div className="eyebrow">Quick Draw & Guess</div><h2>Waiting for the live drawing turn.</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const ownCorrect = session.ownGuesses.some((entry) => entry.accepted);
  const turnNumber = session.state.roundIndex + 1;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Quick Draw & Guess</div><h2>Round complete.</h2><p className="support">The Host is reviewing results.</p></section>;

  if (session.state.phase === 'revealing') return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="eyebrow">Turn result</div><h2>The word was <strong>{session.secretWord ?? session.state.revealWord ?? '—'}</strong></h2>
    <QuickDrawCanvas strokes={session.strokes} />
    {paused && <div className="notice warning">The Host paused the room before the next turn.</div>}
    {session.artist.isSelf ? <div className="notice success">Your artist score is calculated by how many eligible players correctly identified the word.</div> : ownCorrect ? <div className="notice success">Correct! Your server score for this turn has been recorded.</div> : <div className="notice">No correct guess was recorded for you this turn.</div>}
    <p className="support">Waiting for the Host to continue.</p>
  </section>;

  if (session.artist.isSelf) return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="live-line"><span className="live-dot" /> {paused ? `PAUSED · YOUR ARTIST TURN ${turnNumber}/${session.config.artistTurns}` : `YOUR ARTIST TURN · ${turnNumber}/${session.config.artistTurns}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">The Host paused this turn. Drawing is frozen and will resume with the same remaining time.</div>}
    <div className="section-heading"><div><div className="eyebrow">Draw this word</div><h2 className="artist-secret-word">{session.secretWord ?? '—'}</h2></div><div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'frozen' : 'remaining'}</span></div></div>
    <p className="support">Do not write the word or say it aloud. Your strokes synchronize to the room.</p>
    <QuickDrawCanvas strokes={session.strokes} editable disabled={paused || remaining <= 0} onStroke={sendStroke} onClear={clearCanvas} />
    <div className="meta"><span className="pill">Correct guessers {session.correctGuessers.length}</span><span className="pill">Artist scoring by successful guesses</span></div>
  </section>;

  return <section className="panel quick-draw-live-panel player-quick-draw">
    <div className="live-line"><span className="live-dot" /> {paused ? `PAUSED · ${session.artist.nickname} IS DRAWING` : `GUESS · ${session.artist.nickname} IS DRAWING`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">The Host paused this turn. Guessing is frozen and will resume with the same remaining time.</div>}
    <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'frozen' : 'remaining'}</span></div>
    <QuickDrawCanvas strokes={session.strokes} />
    {ownCorrect ? <div className="notice success">✓ Correct guess accepted. Your score is locked for this turn.</div> : <form className="quick-draw-guess-form" onSubmit={(event) => { event.preventDefault(); void submitGuess(); }}>
      <label className="form-label">Your guess<input value={guess} maxLength={80} autoComplete="off" placeholder="Type your guess…" disabled={busy || paused || remaining <= 0} onChange={(event) => setGuess(event.target.value)} /></label>
      <button className="btn primary" type="submit" disabled={busy || paused || remaining <= 0 || !guess.trim()}>{paused ? 'Paused' : busy ? 'Sending…' : 'Submit guess'}</button>
    </form>}
    {session.ownGuesses.length > 0 && <div className="own-guess-list"><h3>Your guesses</h3>{session.ownGuesses.slice(-5).reverse().map((entry, index) => <div className="control-row" key={`${entry.created_at}-${index}`}><span>{entry.guess}</span><strong>{entry.accepted ? '✓ Correct' : 'Not yet'}</strong></div>)}</div>}
    <p className="support">Guess acceptance currently uses conservative normalized exact matching. Fuzzy spelling tolerance remains a test-driven release decision.</p>
  </section>;
}
