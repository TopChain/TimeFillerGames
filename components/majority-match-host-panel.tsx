'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { endMajorityClient, fetchMajorityMatch, nextMajorityClient, revealMajorityClient, type MajoritySnapshot } from '@/lib/client-majority-match';
import { HOST_GAME_UI_COPY } from '@/lib/host-game-ui-copy';
import type { Locale } from '@/lib/product';

export function MajorityMatchHostPanel({ accessToken, roomCode, locale = 'en', onEnded }: { accessToken: string; roomCode: string; locale?: Locale; onEnded?: () => void }) {
  const copy = HOST_GAME_UI_COPY[locale];
  const [snapshot, setSnapshot] = useState<MajoritySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try { setSnapshot(await fetchMajorityMatch(accessToken, roomCode)); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
  }, [accessToken, copy.actionFailed, roomCode]);

  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => void refresh(), 1500);
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearInterval(poll); window.clearInterval(clock); };
  }, [refresh]);

  const remaining = useMemo(() => {
    if (!snapshot) return 0;
    const reference = snapshot.room.status === 'paused' && snapshot.session.state.pauseStartedAt ? new Date(snapshot.session.state.pauseStartedAt).getTime() : now;
    return Math.max(0, Math.ceil((new Date(snapshot.session.state.deadline).getTime() - reference) / 1000));
  }, [now, snapshot]);

  async function run(action: () => Promise<MajoritySnapshot>) {
    setBusy(true); setError(null);
    try { const next = await action(); setSnapshot(next); if (next.session.status === 'ended') onEnded?.(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.actionFailed); }
    finally { setBusy(false); }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">Majority Match</div><h2>{copy.majorityLoading}</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const questionNumber = session.state.roundIndex + 1;
  const isLast = questionNumber >= session.config.questionCount;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Majority Match</div><h2>{copy.gameComplete}</h2><p className="support">{copy.finalReady}</p></section>;

  if (session.state.phase === 'answering') return <section className="panel majority-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · ${copy.question} ${questionNumber}/${session.config.questionCount}` : `MAJORITY MATCH · ${copy.question} ${questionNumber}/${session.config.questionCount}`}</div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {paused && <div className="notice warning">{copy.votingFrozen}</div>}
    <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? copy.answerFrozen : copy.answerRemaining}</span></div>
    <h2>{session.state.currentQuestion.prompt}</h2>
    <div className="choice-grid">{session.state.currentQuestion.choices.map((choice) => <div className="choice-card" key={choice}><strong>{choice}</strong></div>)}</div>
    <div className="meta"><span className="pill">{copy.submitted} {session.submittedCount}</span><span className="pill">{copy.noSpeedBonus}</span><span className="pill">{copy.votesPrivate}</span></div>
    <button className="btn primary full-width" disabled={busy || paused || remaining > 0} onClick={() => void run(() => revealMajorityClient(accessToken, roomCode))}>{paused ? copy.paused : remaining > 0 ? copy.votingCloses(remaining) : copy.revealMajority}</button>
    <button className="btn secondary full-width" disabled={busy || paused} onClick={() => void run(() => revealMajorityClient(accessToken, roomCode, true))}>{copy.closeEarly}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endMajorityClient(accessToken, roomCode))}>{copy.endGame}</button>
  </section>;

  const reveal = session.state.reveal;
  return <section className="panel majority-live-panel">
    <div className="live-line"><span className="live-dot" /> {paused ? `${copy.paused} · ${copy.result} ${questionNumber}/${session.config.questionCount}` : `${copy.result} · ${copy.question} ${questionNumber}/${session.config.questionCount}`}</div>
    {paused && <div className="notice warning">{copy.paused}</div>}
    <h2>{session.state.currentQuestion.prompt}</h2>
    {reveal && <div className="majority-results">{session.state.currentQuestion.choices.map((choice) => {
      const isMajority = reveal.majorityChoices.includes(choice);
      return <div className={`control-row ${isMajority ? 'selected' : ''}`} key={choice}><span>{choice}{isMajority ? ` · ${copy.majority}` : ''}</span><strong>{reveal.counts[choice] ?? 0}{reveal.percentages ? ` · ${reveal.percentages[choice] ?? 0}%` : ''}</strong></div>;
    })}</div>}
    <div className="notice">{copy.tieRule}</div>
    <button className="btn primary full-width" disabled={busy || paused} onClick={() => void run(() => nextMajorityClient(accessToken, roomCode))}>{isLast ? copy.finishResults : copy.nextQuestion}</button>
    <button className="btn danger full-width" disabled={busy} onClick={() => void run(() => endMajorityClient(accessToken, roomCode))}>{copy.endGameNow}</button>
  </section>;
}
