'use client';

import { useEffect, useState } from 'react';
import { fetchQuickDraw, type QuickDrawSnapshot } from '@/lib/client-quick-draw';

export function QuickDrawResultsPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
  const [snapshot, setSnapshot] = useState<QuickDrawSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchQuickDraw(accessToken, roomCode)
      .then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load Quick Draw results.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (error) return <div className="notice warning" role="alert">{error}</div>;
  if (!snapshot) return <div className="notice">Loading server results…</div>;

  return <div className="quick-draw-results-panel">
    {snapshot.session.ownResult && <div className="private-result">
      <span>Your private result</span>
      <strong>#{snapshot.session.ownResult.placement} · {snapshot.session.ownResult.points} pts</strong>
      <small>Guesser points can include an optional decreasing time component. Artist points depend on how many eligible players identify the word.</small>
    </div>}
    <div className="winner-list">
      {snapshot.session.rankings.length === 0 && <div className="notice">Public rankings are hidden by this room’s ranking setting.</div>}
      {snapshot.session.rankings.map((entry) => <div className="control-row" key={entry.participant_id}><span>#{entry.placement} {entry.nickname}</span><strong>{entry.points} pts</strong></div>)}
    </div>
  </div>;
}
