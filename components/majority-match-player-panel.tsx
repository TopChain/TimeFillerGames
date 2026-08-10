'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMajorityMatch, submitMajorityVoteClient, type MajoritySnapshot } from '@/lib/client-majority-match';

export function MajorityMatchPlayerPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
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

  async function vote(choice: string) {
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await submitMajorityVoteClient(accessToken, roomCode, choice));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit your prediction.');
    } finally {
      setBusy(false);
    }
  }

  if (!snapshot) return <section className="panel"><div className="eyebrow">Majority Match</div><h2>Waiting for the live question.</h2>{error && <div className="notice warning">{error}</div>}</section>;

  const { session } = snapshot;
  const paused = snapshot.room.status === 'paused' || session.status === 'paused';
  const spectator = session.ownResult === null;
  const questionNumber = session.state.roundIndex + 1;

  if (session.state.phase === 'ended') return <section className="panel"><div className="eyebrow">Majority Match</div><h2>Round complete.</h2><p className="support">The Host is reviewing results.</p></section>;

  if (session.state.phase === 'answering') {
    const locked = Boolean(session.ownChoice);
    return <section className="panel majority-live-panel player-majority">
      <div className="live-line"><span className="live-dot" /> {paused ? `PAUSED · QUESTION ${questionNumber}/${session.config.questionCount}` : spectator ? `SPECTATING · QUESTION ${questionNumber}/${session.config.questionCount}` : `QUESTION ${questionNumber}/${session.config.questionCount}`}</div>
      {paused && <div className="notice warning">The Host paused the room. Voting is frozen and will resume with the same remaining time.</div>}
      {spectator && <div className="notice">This seat is currently spectating. If you joined late and an active seat is available, the server will activate you at the next question boundary; Host-designated spectators stay spectators.</div>}
      <div className="bingo-callout"><strong>{remaining}s</strong><span>{paused ? 'answer time frozen' : spectator ? 'watch this question' : 'Choose what you think the room will choose'}</span></div>
      <h2>{session.state.currentQuestion.prompt}</h2>
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="choice-grid">{session.state.currentQuestion.choices.map((choice) => <button className={`choice-card ${session.ownChoice === choice ? 'selected' : ''}`} key={choice} disabled={busy || locked || paused || spectator || remaining <= 0} onClick={() => void vote(choice)}><strong>{choice}</strong>{session.ownChoice === choice && <span>✓ Locked</span>}</button>)}</div>
      <div className="notice">There is no objectively correct answer and no speed bonus. Predict the group majority.</div>
    </section>;
  }

  const reveal = session.state.reveal;
  const scored = Boolean(session.ownChoice && reveal?.majorityChoices.includes(session.ownChoice));
  return <section className="panel majority-live-panel player-majority">
    <div className="eyebrow">Room result</div><h2>{session.state.currentQuestion.prompt}</h2>
    {paused && <div className="notice warning">The Host paused the room before the next question.</div>}
    {spectator && <div className="notice">You are spectating this result. A queued late-join seat is activated before the next question when capacity permits.</div>}
    {reveal && <div className="majority-results">{session.state.currentQuestion.choices.map((choice) => {
      const isMajority = reveal.majorityChoices.includes(choice);
      return <div className={`control-row ${isMajority ? 'selected' : ''}`} key={choice}><span>{choice}{session.ownChoice === choice ? ' · Your prediction' : ''}</span><strong>{reveal.counts[choice] ?? 0}{reveal.percentages ? ` · ${reveal.percentages[choice] ?? 0}%` : ''}</strong></div>;
    })}</div>}
    {!spectator && <div className={`notice ${scored ? 'success' : ''}`}>{scored ? 'Your prediction matched the majority: +1000 points.' : 'Your prediction did not match the majority this question.'}</div>}
    <p className="support">Waiting for the Host to continue.</p>
  </section>;
}
