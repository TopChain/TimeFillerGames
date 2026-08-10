'use client';

import { useEffect, useState } from 'react';
import { fetchMajorityMatch, type MajoritySnapshot } from '@/lib/client-majority-match';

export function MajorityMatchResultsPanel({ accessToken, roomCode }: { accessToken: string; roomCode: string }) {
  const [snapshot, setSnapshot] = useState<MajoritySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMajorityMatch(accessToken, roomCode)
      .then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load Majority Match results.'); });
    return () => { cancelled = true; };
  }, [accessToken, roomCode]);

  if (error) return <div className="notice warning" role="alert">{error}</div>;
  if (!snapshot) return <div className="notice">Loading server results…</div>;

  return <div className="majority-results-panel">
    {snapshot.session.ownResult && <div className="private-result"><span>Your private result</span><strong>#{snapshot.session.ownResult.placement} · {snapshot.session.ownResult.points} pts</strong><small>Majority Match uses no speed bonus. Each matched majority prediction is worth the same amount.</small></div>}
    <div className="winner-list">
      {snapshot.session.rankings.length === 0 && <div className="notice">Public rankings are hidden by this room’s ranking setting.</div>}
      {snapshot.session.rankings.map((entry) => <div className="control-row" key={entry.participant_id}><span>#{entry.placement} {entry.nickname}</span><strong>{entry.points} pts</strong></div>)}
    </div>
  </div>;
}
