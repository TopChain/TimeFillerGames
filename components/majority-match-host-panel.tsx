'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { endMajorityClient, fetchMajorityMatch, nextMajorityClient, revealMajorityClient, type MajoritySnapshot } from '@/lib/client-majority-match';

export function MajorityMatchHostPanel({ accessToken, roomCode, onEnded }: { accessToken: string; roomCode: string; onEnded?: () => void }) {
  const [snapshot, setSnapshot] = useState<MajoritySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchMajorityMatch(accessToken, roomCode));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Majority Match.');
    }
  }, [accessToken, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1500);
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

  async function run(action: () => Promise<MajoritySnapshot>) {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      setSnapshot(next);
      if (next.session.status === 'ended') onEnded?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Majority Match action failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">Majority Match</div><h2>Loading live question…</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const questionNumber = session.state.roundIndex + 1;
  const isLast = questionNumber >= session.config.questionCount;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Majority Match</div><h2>Game complete</h2><p className="support">Final rankings are ready from the server.</p></section>;

  if (session.state.phase === 'answering') return <section className="panel majority-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `PAUSED · QUESTION ${questionNumber}/${session.config.questionCount}` : `MAJORITY MATCH · QUESTION ${questionNumber}/${session.config.questionCount}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">Voting is frozen. Resume continues with the same remaining answer time.</div>}
    <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'answer time frozen' : 'answer time remaining'}</span></div>
    <h2>{session.state.currentQuestion.prompt}</h2>
    <div className="choice-grid">{session.state.currentQuestion.choices.map((choice) => <div className="choice-card" key={choice}><strong>{choice}</strong></div>)}</div>
    <div className="meta"><span className="pill">Submitted {session.submittedCount}</span><span className="pill">No speed bonus</span><span className="pill">Votes stay private until reveal</span></div>
    <button className="btn primary full-width" disabled={busy || paused || remaining > 0} onClick={() => void run(() => revealMajorityClient(accessToken, roomCode))}>{paused ? 'Paused' : remaining > 0 ? `Voting closes in ${remaining}s` : 'Reveal majority'}</button>
    <button className="btn secondary full-width" disabled={busy || paused} onClick={() => void run(() => revealMajorityClient(accessToken, roomCode, true))}>Close voting early & reveal</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endMajorityClient(accessToken, roomCode))}>End game</button>
  </section>;

  const reveal = session.state.reveal;
  return <section className="panel majority-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `PAUSED · RESULT ${questionNumber}/${session.config.questionCount}` : `RESULT · QUESTION ${questionNumber}/${session.config.questionCount}`}</div>
    {paused && <div className="notice warning">The room is paused before the next question.</div>}
    <h2>{session.state.currentQuestion.prompt}</h2>
    {reveal && <div className="majority-results">{session.state.currentQuestion.choices.map((choice) => {
      const isMajority = reveal.majorityChoices.includes(choice);
      return <div className={`control-row ${isMajority ? 'selected' : ''}`} key={choice}><span>{choice}{isMajority ? ' · Majority' : ''}</span><strong>{reveal.counts[choice] ?? 0}{reveal.percentages ? ` · ${reveal.percentages[choice] ?? 0}%` : ''}</strong></div>;
    })}</div>}
    <div className="notice">If multiple choices tie for the highest vote count, every tied top answer receives full points.</div>
    <button className="btn primary full-width" disabled={busy || paused} onClick={() => void run(() => nextMajorityClient(accessToken, roomCode))}>{isLast ? 'Finish & show results' : 'Next question'}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endMajorityClient(accessToken, roomCode))}>End game now</button>
  </section>;
}
